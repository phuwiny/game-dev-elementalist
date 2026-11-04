"""Menu/progress flow: Title -> World Map -> stage -> Stage Clear -> next, save persists, pause quit, game over exit."""
import os
BASE = os.environ.get('GAME_URL', 'http://localhost:4173/')
SHOT_DIR = os.environ.get('SHOT_DIR', 'tests/e2e/shots')
os.makedirs(SHOT_DIR, exist_ok=True)
from playwright.sync_api import sync_playwright
GS = "window.__game.scene.getScene('GameScene')"
def active(page): return page.evaluate("() => window.__game.scene.getScenes(true).map(s => s.sys.settings.key)")
def wait(page, key): page.wait_for_function(f"() => window.__game.scene.isActive('{key}')", timeout=8000); page.wait_for_timeout(300)
def prog(page): return page.evaluate("() => window.__game.registry.get('progress').toJSON()")
with sync_playwright() as pw:
    br = pw.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    page = br.new_page(); errs = []; page.on('pageerror', lambda e: errs.append(str(e)))
    page.goto(BASE + '?lowres'); wait(page, 'TitleScene')
    page.evaluate("() => localStorage.clear()")
    page.reload(); wait(page, 'TitleScene')
    page.keyboard.press('Enter'); wait(page, 'WorldMapScene'); print('1', active(page), prog(page))
    page.screenshot(path=f'{SHOT_DIR}/worldmap_fresh.png')
    page.keyboard.press('ArrowRight'); page.keyboard.press('Enter'); page.wait_for_timeout(400)
    print('2 locked stage stays on map:', active(page))
    page.keyboard.press('ArrowLeft'); page.keyboard.press('Enter'); wait(page, 'GameScene')
    print('3 level', page.evaluate(f"() => {GS}.def.key"), 'spirits', page.evaluate(f"() => {GS}.elements.selector.unlocked"))
    # walk into Burnil (col 9) for real
    page.keyboard.down('d'); page.wait_for_timeout(1200); page.keyboard.up('d'); page.wait_for_timeout(300)
    print('4 after Burnil', page.evaluate(f"() => {GS}.elements.selector.unlocked"), prog(page))
    # pause -> quit to map
    page.keyboard.press('Escape'); page.wait_for_timeout(300); page.screenshot(path=f'{SHOT_DIR}/pause.png')
    page.keyboard.press('x'); wait(page, 'WorldMapScene'); print('5 quit ->', active(page))
    page.keyboard.press('Enter'); wait(page, 'GameScene')
    page.evaluate(f"() => {GS}.reachGoal()"); wait(page, 'StageClearScene'); print('6', active(page), prog(page))
    page.screenshot(path=f'{SHOT_DIR}/clear.png')
    page.keyboard.press('Enter'); wait(page, 'GameScene'); print('7 next level', page.evaluate(f"() => {GS}.def.key"), page.evaluate(f"() => {GS}.elements.selector.unlocked"))
    # game over -> ESC -> world map focused on this stage
    for _ in range(6):
        if page.evaluate("() => window.__game.scene.isActive('GameOverScene')"): break
        page.evaluate(f"() => {{ if (window.__game.scene.isActive('GameScene')) {GS}.killPlayer(); }}"); page.wait_for_timeout(2500)
    wait(page, 'GameOverScene')
    page.keyboard.press('Escape'); wait(page, 'WorldMapScene'); print('8 game over esc ->', active(page))
    page.reload(); wait(page, 'TitleScene'); print('9 after reload', prog(page))
    page.keyboard.press('Enter'); wait(page, 'WorldMapScene'); page.screenshot(path=f'{SHOT_DIR}/worldmap_progress.png')
    # dev level from title
    page.keyboard.press('Escape'); wait(page, 'TitleScene')
    print('menu before', page.evaluate("() => window.__game.scene.getScene('TitleScene').children.list.filter(o => o.type==='Text').map(t=>t.text).filter(t=>t.startsWith('>'))"))
    page.keyboard.press('ArrowDown'); page.wait_for_timeout(150); page.keyboard.press('ArrowDown'); page.wait_for_timeout(200)   # Adventure, Settings, then the first dev level
    print('menu after', page.evaluate("() => window.__game.scene.getScene('TitleScene').children.list.filter(o => o.type==='Text').map(t=>t.text).filter(t=>t.startsWith('>'))"))
    page.keyboard.press('Enter'); wait(page, 'GameScene')
    print('10 dev level', page.evaluate(f"() => {GS}.def.key"))
    page.evaluate(f"() => {GS}.reachGoal()"); wait(page, 'StageClearScene'); page.keyboard.press('Escape'); wait(page, 'TitleScene')
    print('11 dev clear esc ->', active(page), 'progress unchanged', prog(page))
    print('errors', errs)
    br.close()
