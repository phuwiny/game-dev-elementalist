"""Core UI assets check (needs `npm run build` + preview on :4173).

1. Title: menu buttons (button_* 9-slice), hover follows UP/DOWN, cursor_arrow beside the selected button
2. Settings: panel_9slice behind the table, cursor_arrow on the selected row
3. HUD: lives / coins / shards / boss name use the font_hud bitmap font, shard icon is a real items frame
4. checkpoint: touching the shrine plays fx_checkpoint_spark
5. Pause, Stage Clear, Game Over: panel_9slice, ENTER/ESC buttons (ENTER = hover)
screenshots go to SHOT_DIR

usage: python3 core_ui.py
"""
import os
import sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get('GAME_URL', 'http://localhost:4173/')
SHOT_DIR = os.environ.get('SHOT_DIR', '/tmp/core_ui_shots')
GS = "window.__game.scene.getScene('GameScene')"
failures = []


def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok:
        failures.append(what)


def objects(page, scene):
    """type / texture / frame / size / position / text of every object in a scene (containers flattened)"""
    return page.evaluate("""(k) => {
      const out = [];
      const walk = (list) => list.forEach(o => {
        if (o.list) { walk(o.list); return; }
        out.push({ type: o.type, tex: o.texture ? o.texture.key : null, frame: o.frame ? o.frame.name : null,
                   w: o.width, h: o.height, x: o.x, y: o.y, text: typeof o.text === 'string' ? o.text : null,
                   font: o.font || null, visible: o.visible });
      });
      walk(window.__game.scene.getScene(k).children.list);
      return out;
    }""", scene)


def frames(objs, prefix):
    return [o for o in objs if o['frame'] and o['frame'].startswith(prefix)]


os.makedirs(SHOT_DIR, exist_ok=True)
with sync_playwright() as pw:
    br = pw.chromium.launch(args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'])
    page = br.new_page(viewport={'width': 1280, 'height': 720})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(BASE + '?lowres')
    page.wait_for_function("() => window.__game && window.__game.scene.isActive('TitleScene')")
    page.wait_for_timeout(400)

    # ---- 1. Title ----
    objs = objects(page, 'TitleScene')
    buttons = frames(objs, 'button_')
    check(len(buttons) == 4 and all(b['type'] == 'NineSlice' and b['tex'] == 'ui' for b in buttons), f'4 Title buttons from ui button_*: {[b["frame"] for b in buttons]}')
    check([b['frame'] for b in buttons].count('button_hover') == 1 and buttons[0]['frame'] == 'button_hover', 'first button is hover')
    page.keyboard.press('ArrowDown')
    page.wait_for_timeout(200)
    objs = objects(page, 'TitleScene')
    buttons = frames(objs, 'button_')
    cursor = frames(objs, 'cursor_arrow')
    label = page.evaluate("() => window.__game.scene.getScene('TitleScene').selectedLabel")
    check(buttons[1]['frame'] == 'button_hover' and buttons[0]['frame'] == 'button_normal' and label == 'Settings', f'DOWN moves hover to Settings ({label})')
    check(len(cursor) == 1 and abs(cursor[0]['y'] - buttons[1]['y']) < 0.5 and cursor[0]['x'] < buttons[1]['x'] - buttons[1]['w'] / 2,
          'cursor_arrow sits left of the selected button')
    page.screenshot(path=f'{SHOT_DIR}/title.png')

    # ---- 2. Settings ----
    page.keyboard.press('Enter')
    page.wait_for_function("() => window.__game.scene.isActive('SettingsScene')")
    page.wait_for_timeout(300)
    objs = objects(page, 'SettingsScene')
    panel = frames(objs, 'panel_9slice')
    check(len(panel) == 1 and panel[0]['type'] == 'NineSlice' and panel[0]['w'] > 300, f'Settings panel_9slice {panel[:1]}')
    first = next(o for o in objs if o['text'] == 'Move left')
    cur = frames(objs, 'cursor_arrow')
    check(len(cur) == 1 and cur[0]['x'] < first['x'] and abs(cur[0]['y'] - first['y']) < 12, 'cursor on the first Settings row')
    check(not any(o['text'] and o['text'].startswith('>') for o in objs), 'no ">" text markers left')
    page.screenshot(path=f'{SHOT_DIR}/settings.png')
    page.keyboard.press('Escape')
    page.wait_for_function("() => window.__game.scene.isActive('TitleScene')")

    # ---- 3. HUD ----
    page.evaluate("() => { window.__game.scene.getScene('TitleScene').scene.start('GameScene', { level: 'w1_1' }); }")
    page.wait_for_function("() => window.__game.scene.isActive('GameScene') && window.__game.scene.isActive('UIScene')")
    page.wait_for_timeout(800)
    hud = objects(page, 'UIScene')
    bitmap = [o for o in hud if o['type'] == 'BitmapText' and o['visible']]
    texts = sorted(o['text'] for o in bitmap)
    check(any(t.startswith('×') for t in texts) and '00' in texts and '0/3' in texts, f'HUD counters in font_hud: {texts}')
    check(all(o['font'] == 'font_hud' for o in bitmap), 'HUD bitmap texts use font_hud')
    icon = page.evaluate("() => { const u = window.__game.scene.getScene('UIScene'); return [u.shardIcon.texture.key, u.shardIcon.frame.name, u.shardIcon.width, u.shardIcon.height]; }")
    check(icon == ['items', 'spirit_shard_shine_000', 16, 16], f'HUD shard icon is a real items frame {icon}')

    # ---- 4. checkpoint spark ----
    cp = page.evaluate(f"""() => {{
      const g = {GS}; g.enemies.getChildren().forEach(e => e.vanish());
      const s = g.children.list.find(o => o.frame && o.frame.name.startsWith('checkpoint_shrine'));
      g.player.body.reset(s.x - 60, s.y - 2); return [s.x, s.y];
    }}""")
    page.wait_for_timeout(500)
    page.evaluate(f"() => {{ window.__spark = []; const g = {GS}; g.events.on('postupdate', () => g.children.list.forEach(o => {{ if (o.anims && o.anims.currentAnim && o.anims.currentAnim.key === 'fx_checkpoint_spark') window.__spark.push([o.texture.key, o.x, o.y]); }})); g.player.body.reset({cp[0]}, {cp[1]} - 2); }}")
    page.wait_for_timeout(600)
    spark = page.evaluate("() => window.__spark")
    check(len(spark) > 0 and spark[0][0] == 'fx' and abs(spark[0][1] - cp[0]) < 0.5 and spark[0][2] < cp[1] - 30,
          f'checkpoint_spark plays above the shrine flame {spark[:1]}')

    # ---- 3b. boss name (font_hud) ----
    name = page.evaluate("() => { const u = window.__game.scene.getScene('UIScene'); return [u.bossName.type, u.bossName.font]; }")
    check(name == ['BitmapText', 'font_hud'], f'boss name uses font_hud {name}')

    # ---- 5. Pause / Stage Clear / Game Over ----
    page.keyboard.press('Escape')
    page.wait_for_timeout(300)
    pause = frames(objects(page, 'UIScene'), 'panel_9slice')
    check(len(pause) == 1 and pause[0]['visible'], 'Pause panel_9slice')
    page.screenshot(path=f'{SHOT_DIR}/pause.png')
    page.keyboard.press('Escape')
    page.wait_for_timeout(300)

    page.evaluate(f"() => {{ {GS}.reachGoal(); }}")
    page.wait_for_function("() => window.__game.scene.isActive('StageClearScene')", timeout=20000)
    page.wait_for_timeout(300)
    objs = objects(page, 'StageClearScene')
    btn = frames(objs, 'button_')
    check(len(frames(objs, 'panel_9slice')) == 1 and [b['frame'] for b in btn] == ['button_hover', 'button_normal'], f'Stage Clear panel + buttons {[b["frame"] for b in btn]}')
    check(any(o['text'] == 'ENTER  Next stage' for o in objs) and any(o['text'] == 'ESC  World Map' for o in objs), 'Stage Clear button labels')
    page.screenshot(path=f'{SHOT_DIR}/stage_clear.png')

    page.evaluate("() => { window.__game.scene.getScene('StageClearScene').scene.start('GameOverScene'); }")
    page.wait_for_function("() => window.__game.scene.isActive('GameOverScene')")
    page.wait_for_timeout(300)
    objs = objects(page, 'GameOverScene')
    btn = frames(objs, 'button_')
    check(len(frames(objs, 'panel_9slice')) == 1 and [b['frame'] for b in btn] == ['button_hover', 'button_normal'], 'Game Over panel + buttons')
    page.screenshot(path=f'{SHOT_DIR}/game_over.png')

    check(not errors, f'no page errors {errors[:2]}')
    br.close()

print(f'\n{len(failures)} failures' if failures else '\nALL PASS')
sys.exit(1 if failures else 0)
