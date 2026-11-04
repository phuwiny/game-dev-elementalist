"""Music (needs `npm run build` + preview on :4173).

usage: python3 music.py
 - nothing plays before the first key press; then Title music starts and produces sound
 - tracks follow the scenes: Title -> World Map -> World 1 -> boss -> World 1, jingles for Stage Clear and Game Over
 - pause ducks the music, M mutes it, quitting the level restores the volume
 - a music file in assets/audio/music/ replaces the built-in score (a generated WAV served as title.ogg/mp3)
"""
import math
import os
import struct
import sys
import wave
from io import BytesIO
from playwright.sync_api import sync_playwright

BASE = os.environ.get('GAME_URL', 'http://localhost:4173/')
GS = "window.__game.scene.getScene('GameScene')"
failures = []


def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok:
        failures.append(what)


def sine_wav(seconds=1.0, freq=330.0, rate=22050):
    buf = BytesIO()
    with wave.open(buf, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate)
        w.writeframes(b''.join(struct.pack('<h', int(12000 * math.sin(2 * math.pi * freq * i / rate))) for i in range(int(rate * seconds))))
    return buf.getvalue()


def open_game(br, stub_files=False):
    page = br.new_page(viewport={'width': 640, 'height': 360})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    # a missing optional music file is a 404 in the console (same as the atlases that are not delivered yet): not an error here
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
    if stub_files:
        wav = sine_wav()
        page.route('**/assets/audio/music/title.*', lambda r: r.fulfill(status=200, body=wav, content_type='audio/ogg' if r.request.url.endswith('.ogg') else 'audio/mpeg'))
    page.goto(BASE + '?lowres')
    page.wait_for_function("() => window.__game && window.__game.scene.isActive('TitleScene')")
    page.wait_for_timeout(300)
    return page, errors


with sync_playwright() as pw:
    br = pw.chromium.launch(args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
    page, errors = open_game(br)
    wait = page.wait_for_timeout
    kb = page.keyboard

    def tap(key, ms=80):
        kb.down(key); wait(ms); kb.up(key); wait(80)

    def state():
        return page.evaluate("() => window.__music.state")

    def gain():
        return page.evaluate("() => window.__music.master ? window.__music.master.gain.value : null")

    def rms():
        """level of the music bus over ~0.3 s (analyser tapped onto the master gain)"""
        return page.evaluate("""async () => {
          const m = window.__music, ctx = m.master.context;
          const a = ctx.createAnalyser(); a.fftSize = 2048; m.master.connect(a);
          const buf = new Float32Array(a.fftSize); let peak = 0;
          for (let i = 0; i < 6; i++) { await new Promise(r => setTimeout(r, 50)); a.getFloatTimeDomainData(buf); for (const v of buf) peak = Math.max(peak, Math.abs(v)); }
          m.master.disconnect(a); return peak;
        }""")

    def wait_state(name, source=None, timeout=4000):
        try:
            page.wait_for_function(
                "([n, s]) => { const st = window.__music.state; return st && st.name === n && (!s || st.source === s); }",
                arg=[name, source], timeout=timeout)
            return True
        except Exception:
            return False

    # ---- nothing before the first key press, then the Title theme ----
    check(state() is None, 'silent before the first key press (browser autoplay rule)')
    tap('ArrowDown'); tap('ArrowUp')
    check(wait_state('title', 'score'), f'Title theme starts after the first key ({state()})')
    wait(800)
    check(rms() > 0.01, 'Title theme is audible')

    # ---- scenes ----
    tap('Enter')
    page.wait_for_function("() => window.__game.scene.isActive('WorldMapScene')")
    check(wait_state('world_map'), f'World Map theme ({state()})')
    tap('Enter')
    page.wait_for_function("() => window.__game.scene.isActive('UIScene')")
    check(wait_state('world1'), f'World 1 theme in the level ({state()})')
    wait(900)
    base = gain()
    check(base is not None and abs(base - 0.5) < 0.02, f'music volume {base}')

    # ---- pause ducks, resume restores ----
    tap('Escape'); wait(400)
    check(gain() < base * 0.5, f'pause ducks the music ({gain()})')
    tap('Escape'); wait(400)
    check(abs(gain() - base) < 0.02, f'resume restores the volume ({gain()})')

    # ---- mute with M ----
    tap('m'); wait(400)
    check(gain() < 0.01, f'M mutes the music ({gain()})')
    tap('m'); wait(400)
    check(abs(gain() - base) < 0.02, f'M unmutes ({gain()})')

    # ---- boss ----
    page.evaluate("() => { window.__game.scene.stop('UIScene'); window.__game.scene.stop('GameScene'); window.__game.scene.start('TitleScene'); }")
    page.wait_for_function("() => window.__game.scene.isActive('TitleScene')")
    page.evaluate("() => { window.__game.scene.getScene('TitleScene').scene.start('GameScene', { level: 'w1_3' }); }")
    page.wait_for_function("() => { const g = window.__game.scene.getScene('GameScene'); return window.__game.scene.isActive('UIScene') && g.def.key === 'w1_3' && g.player && g.player.active && g.player.body; }")
    wait(1000)
    # braces: an arrow returning the Phaser sprite makes page.evaluate try to serialize it (see docs/STATUS.md)
    page.evaluate(f"() => {{ {GS}.player.setPosition(2860, 319); }}")   # past the arena gate: the fight starts
    ok_boss = wait_state('boss')
    info = page.evaluate(f"() => ({{ x: {GS}.player.body.x, boss: {GS}.boss && {GS}.boss.isActive, level: {GS}.def.key, dead: {GS}.player.isDead }})")
    check(ok_boss, f'boss theme when the fight starts ({state()} {info})')
    wait(700)
    check(rms() > 0.01, 'boss theme is audible')
    page.evaluate(f"() => {{ {GS}.killPlayer(); }}")              # die: boss resets, level theme returns
    check(wait_state('world1', timeout=6000), f'level theme after dying in the boss fight ({state()})')

    # ---- jingles ----
    page.wait_for_function(f"() => !{GS}.player.isDead", timeout=8000)   # respawned
    wait(600)
    page.evaluate(f"() => {GS}.reachGoal()")
    page.wait_for_function("() => window.__game.scene.isActive('StageClearScene')")
    check(wait_state('stage_clear'), f'Stage Clear jingle ({state()})')
    try:
        page.wait_for_function("() => window.__music.state === null", timeout=9000)
        check(True, 'Stage Clear jingle plays once and stops')
    except Exception:
        check(False, f'Stage Clear jingle did not stop ({state()})')
    page.evaluate("() => { window.__game.scene.stop('StageClearScene'); window.__game.scene.start('GameOverScene'); }")
    check(wait_state('game_over'), f'Game Over jingle ({state()})')
    check(not errors, f'no page errors {errors}')
    page.close()

    # ---- a real music file replaces the score ----
    page, errors = open_game(br, stub_files=True)
    page.keyboard.down('ArrowDown'); page.wait_for_timeout(80); page.keyboard.up('ArrowDown'); page.wait_for_timeout(80)
    page.keyboard.down('ArrowUp'); page.wait_for_timeout(80); page.keyboard.up('ArrowUp')
    check(wait_state('title', 'file', timeout=5000), f'title.ogg/.mp3 is used when present ({state()})')
    page.wait_for_timeout(500)
    check(rms() > 0.01, 'the file is audible')
    page.keyboard.down('Enter'); page.wait_for_timeout(80); page.keyboard.up('Enter')
    check(wait_state('world_map', 'score'), f'tracks without a file still use the built-in score ({state()})')
    check(not errors, f'no page errors with a music file {errors}')
    br.close()

sys.exit(1 if failures else 0)
