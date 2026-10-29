"""Key rebinding (needs `npm run build` + preview on :4173).

usage: python3 settings.py
 - Title shows Settings and a controls hint built from the bindings
 - rebinding Jump to W: saved, Title hint changes, in game W jumps and SPACE no longer does
 - conflict: giving Attack the key W swaps with Jump
 - reserved key is refused
 - Settings opened from the Pause screen: new key works after resuming
 - Reset to defaults
"""
import json
import os
import sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get('GAME_URL', 'http://localhost:4173/')
GS = "window.__game.scene.getScene('GameScene')"
failures = []


def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok:
        failures.append(what)


with sync_playwright() as pw:
    br = pw.chromium.launch(args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'])
    page = br.new_page(viewport={'width': 640, 'height': 360})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(BASE + '?lowres')
    page.wait_for_function("() => window.__game && window.__game.scene.isActive('TitleScene')")
    page.wait_for_timeout(300)
    kb = page.keyboard

    def tap(key, ms=80):
        kb.down(key); page.wait_for_timeout(ms); kb.up(key); page.wait_for_timeout(60)

    def texts(scene):
        return page.evaluate(
            "(k) => window.__game.scene.getScene(k).children.list.filter(o => typeof o.text === 'string').map(o => o.text)", scene)

    def saved():
        raw = page.evaluate("() => localStorage.getItem('elemental-spirit:bindings')")
        return json.loads(raw) if raw else None

    def active(scene):
        return page.evaluate("(k) => window.__game.scene.isActive(k)", scene)

    def anim():
        return page.evaluate(f"() => {GS}.player.anims.currentAnim ? {GS}.player.anims.currentAnim.key.replace('player_', '') : '-'")

    def to_title_row(label):
        # Title menu: Adventure, Settings, dev levels
        for _ in range(4):
            sel = [t for t in texts('TitleScene') if t.startswith('>')]
            if sel and label in sel[0]:
                return
            tap('ArrowDown')

    check(any('Settings' in t for t in texts('TitleScene')), 'Title menu has Settings')
    check(any('A/D move  SPACE jump  J sword' in t for t in texts('TitleScene')), 'Title hint shows the default keys')

    # ---- rebind Jump -> W ----
    to_title_row('Settings'); tap('Enter')
    page.wait_for_function("() => window.__game.scene.isActive('SettingsScene')")
    page.wait_for_timeout(200)
    tap('ArrowDown'); tap('ArrowDown')                # rows: Left, Right, Jump
    tap('Enter'); tap('w')
    check(saved() and saved()['jump'] == ['W'], f"Jump saved as W {saved() and saved()['jump']}")

    # ---- conflict: Attack (row 3) -> W swaps with Jump, which gets J ----
    tap('ArrowDown'); tap('Enter'); tap('w')
    b = saved()
    check(b['attack'] == ['W'] and b['jump'] == ['J'], f"swap on conflict: attack {b['attack']}, jump {b['jump']}")
    check(any('swapped' in t for t in texts('SettingsScene')), 'swap message shown')

    # ---- reserved key refused, keeps listening, ESC cancels ----
    tap('Enter'); tap('m')
    check(any('reserved' in t for t in texts('SettingsScene')), 'reserved key refused with a message')
    check(saved()['attack'] == ['W'], 'binding unchanged after a refused key')
    tap('Escape')
    check(not any('Press a key' in t for t in texts('SettingsScene')), 'ESC cancels listening')

    # ---- put it back to Jump=W, Attack=J for the in-game check ----
    tap('Enter'); tap('j')                             # Attack <- J (Jump has J: swaps, Jump gets W)
    b = saved()
    check(b['attack'] == ['J'] and b['jump'] == ['W'], f"Attack J, Jump W: {b['attack']} {b['jump']}")

    tap('Escape')
    page.wait_for_function("() => window.__game.scene.isActive('TitleScene')")
    page.wait_for_timeout(300)
    check(any('W jump' in t and 'J sword' in t for t in texts('TitleScene')), 'Title hint follows the new keys')

    # ---- in game: W jumps, SPACE does not ----
    page.evaluate("() => { window.__game.scene.getScene('TitleScene').scene.start('GameScene', { level: 'w1_1' }); }")
    page.wait_for_function("() => window.__game.scene.isActive('UIScene')")
    page.wait_for_timeout(800)
    page.evaluate(f"() => {{ const g = {GS}; g.enemies.getChildren().forEach(e => e.vanish()); g.player.setPosition(232, 319); }}")
    page.wait_for_timeout(600)
    tap('Space', 150); page.wait_for_timeout(100)
    check(anim() not in ('jump_up', 'jump_peak'), f'SPACE no longer jumps (anim {anim()})')
    page.wait_for_timeout(800)
    kb.down('w'); page.wait_for_timeout(120)
    jumped = anim() in ('jump_up', 'jump_peak')
    kb.up('w'); page.wait_for_timeout(1000)
    check(jumped, 'W jumps')

    # ---- Settings from Pause: Attack -> U, then resume and swing ----
    tap('Escape')
    check(page.evaluate("() => window.__game.scene.isPaused('GameScene')"), 'ESC pauses')
    tap('s')
    page.wait_for_function("() => window.__game.scene.isActive('SettingsScene')")
    page.wait_for_timeout(200)
    check(not page.evaluate("() => window.__game.scene.getScene('UIScene').pauseLayer.visible"), 'pause layer hidden under Settings')
    tap('ArrowDown'); tap('ArrowDown'); tap('ArrowDown')   # Attack row
    tap('Enter'); tap('u')
    tap('Escape')                                          # close Settings (not resume)
    page.wait_for_timeout(300)
    check(not active('SettingsScene'), 'Settings closed')
    check(page.evaluate("() => window.__game.scene.isPaused('GameScene')"), 'game still paused after closing Settings')
    tap('Escape')                                          # resume
    page.wait_for_timeout(300)
    check(not page.evaluate("() => window.__game.scene.isPaused('GameScene')"), 'ESC resumes')
    kb.down('u'); page.wait_for_timeout(100)
    swung = anim().startswith('attack')
    kb.up('u')
    check(swung, f'U attacks after rebinding from Pause (anim {anim()})')

    # ---- Reset to defaults (from Title) ----
    page.evaluate("() => { window.__game.scene.stop('GameScene'); window.__game.scene.stop('UIScene'); window.__game.scene.start('TitleScene'); }")
    page.wait_for_function("() => window.__game.scene.isActive('TitleScene')")
    page.wait_for_timeout(300)
    to_title_row('Settings'); tap('Enter')
    page.wait_for_function("() => window.__game.scene.isActive('SettingsScene')")
    page.wait_for_timeout(200)
    for _ in range(11):                                    # past the 11 action rows to "Reset to defaults"
        tap('ArrowDown')
    tap('Enter')
    b = saved()
    check(b['jump'] == ['SPACE'] and b['attack'] == ['J'] and b['left'] == ['A', 'LEFT'], f'defaults restored {b["jump"]} {b["attack"]}')
    check(not errors, f'no page errors {errors}')
    br.close()

sys.exit(1 if failures else 0)
