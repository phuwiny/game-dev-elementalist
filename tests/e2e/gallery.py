"""Concept art gallery unlocked by Spirit Shards (needs `npm run build` + preview on :4173).

1. fresh save: Title menu -> Gallery, three images, all locked (dark box + how to unlock), ENTER refuses
2. all three shards of 1-1 saved: its image shows, fitted to the frame, ENTER = full view (fills the screen), ESC back
3. World Map: header counts the gallery, G opens it, ESC returns to the World Map
4. clearing 1-2 with its third shard: Stage Clear says "New gallery image unlocked!"; clearing again does not
screenshots go to SHOT_DIR

usage: python3 gallery.py
"""
import os
import sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get('GAME_URL', 'http://localhost:4173/')
SHOT_DIR = os.environ.get('SHOT_DIR', '/tmp/gallery_shots')
GS = "window.__game.scene.getScene('GameScene')"
GAL = "window.__game.scene.getScene('GalleryScene')"
failures = []


def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok:
        failures.append(what)


os.makedirs(SHOT_DIR, exist_ok=True)
with sync_playwright() as pw:
    br = pw.chromium.launch(args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'])
    page = br.new_page(viewport={'width': 1280, 'height': 720})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(BASE + '?lowres')
    page.wait_for_function("() => window.__game && window.__game.scene.isActive('TitleScene')")
    page.wait_for_timeout(400)
    kb = page.keyboard

    def tap(key, ms=200):
        kb.press(key)
        page.wait_for_timeout(ms)

    def active(scene):
        return page.evaluate(f"() => window.__game.scene.isActive('{scene}')")

    def view():
        return page.evaluate(f"""() => {{
          const g = {GAL}, img = g.children.list.find(o => o.type === 'Image' && o.texture.key.startsWith('gallery_'));
          const texts = g.children.list.filter(o => o.type === 'Text' && o.visible).map(o => o.text);
          return {{ key: g.selectedKey, full: g.fullView, shown: img.visible, tex: img.texture.key,
                    w: img.displayWidth, h: img.displayHeight, texts }};
        }}""")

    # ---- 1. Title -> Gallery, all locked ----
    for _ in range(5):
        if page.evaluate("() => window.__game.scene.getScene('TitleScene').selectedLabel") == 'Gallery':
            break
        tap('ArrowDown')
    tap('Enter', 500)
    check(active('GalleryScene'), 'Title menu opens the Gallery')
    v = view()
    check(v['key'] == 'gallery_w1_1' and not v['shown'] and any(t.startswith('LOCKED') and '1-1 Ember Trail' in t and 'Shards 0/3' in t for t in v['texts']),
          f'fresh save: image 1 locked with how to unlock it {v["texts"]}')
    check('Unlocked 0/3' in v['texts'] and '1 / 3' in v['texts'], 'header Unlocked 0/3, counter 1 / 3')
    tap('Enter')
    check(not view()['full'], 'ENTER on a locked image does nothing')
    keys = []
    for _ in range(3):
        tap('ArrowRight')
        keys.append(view()['key'])
    check(keys == ['gallery_w1_2', 'gallery_w1_3', 'gallery_w1_1'], f'RIGHT browses and wraps {keys}')
    page.screenshot(path=f'{SHOT_DIR}/gallery_locked.png')
    tap('Escape', 400)
    check(active('TitleScene'), 'ESC returns to the Title')

    # ---- 2. 1-1 shards complete ----
    page.evaluate("() => { window.__game.registry.get('progress').addShards('w1_1', [0, 1, 2]); }")
    for _ in range(5):
        if page.evaluate("() => window.__game.scene.getScene('TitleScene').selectedLabel") == 'Gallery':
            break
        tap('ArrowDown')
    tap('Enter', 500)
    v = view()
    check(v['shown'] and v['tex'] == 'gallery_w1_1' and abs(v['w'] - 416) < 0.5 and abs(v['h'] - 234) < 0.5
          and 'Unlocked 1/3' in v['texts'] and '1-1 Ember Trail' in v['texts'], f'1-1 image shown in a 416x234 frame {v["w"]}x{v["h"]}')
    page.screenshot(path=f'{SHOT_DIR}/gallery_open.png')
    tap('Enter')
    v = view()
    check(v['full'] and abs(v['w'] - 640) < 0.5 and abs(v['h'] - 360) < 0.5 and not v['texts'], f'ENTER: full view fills the screen {v["w"]}x{v["h"]}')
    page.screenshot(path=f'{SHOT_DIR}/gallery_full.png')
    tap('ArrowRight')
    check(view()['key'] == 'gallery_w1_1', 'no browsing while in full view')
    tap('Escape')
    check(not view()['full'] and active('GalleryScene'), 'ESC leaves full view first')
    tap('Escape', 400)

    # ---- 3. World Map ----
    page.evaluate("() => { window.__game.scene.getScene('TitleScene').scene.start('WorldMapScene'); }")
    page.wait_for_function("() => window.__game.scene.isActive('WorldMapScene')")
    page.wait_for_timeout(300)
    header = page.evaluate("() => window.__game.scene.getScene('WorldMapScene').children.list.filter(o => o.type === 'Text').map(o => o.text)")
    check(any('Gallery 1/3' in t for t in header) and any('G gallery' in t for t in header), 'World Map shows Gallery 1/3 and the G key')
    tap('g', 500)
    check(active('GalleryScene'), 'G opens the Gallery from the World Map')
    tap('Escape', 500)
    check(active('WorldMapScene'), 'ESC returns to the World Map')

    # ---- 4. Stage Clear notice ----
    def clear_w1_2(stage_slots):
        page.evaluate("() => { const m = window.__game.scene; m.stop('StageClearScene'); m.stop('WorldMapScene'); m.start('GameScene', { level: 'w1_2' }); }")
        page.wait_for_function(f"() => window.__game.scene.isActive('GameScene') && {GS}.def.key === 'w1_2'")
        page.wait_for_timeout(600)
        page.evaluate(f"() => {{ const g = {GS}; {stage_slots}.forEach(s => g.stageShards.add(s)); g.reachGoal(); }}")
        page.wait_for_function("() => window.__game.scene.isActive('StageClearScene')", timeout=15000)
        page.wait_for_timeout(300)
        return page.evaluate("() => window.__game.scene.getScene('StageClearScene').children.list.filter(o => o.type === 'Text').map(o => o.text)")

    page.evaluate("() => { window.__game.registry.get('progress').addShards('w1_2', [0, 1]); }")
    texts = clear_w1_2([2])
    check('New gallery image unlocked!' in texts and 'Spirit Shards: 3/3  (+1 new)' in texts, f'third shard of 1-2: Stage Clear announces the image {texts}')
    page.screenshot(path=f'{SHOT_DIR}/stage_clear_gallery.png')
    texts = clear_w1_2([0, 1, 2])
    check('New gallery image unlocked!' not in texts, 'clearing 1-2 again: no notice')

    check(not errors, f'no page errors {errors[:2]}')
    br.close()

print(f'\n{len(failures)} failures' if failures else '\nALL PASS')
sys.exit(1 if failures else 0)
