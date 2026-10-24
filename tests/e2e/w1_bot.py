"""World 1 playtest bot: real keyboard input only (no teleport past hazards).

usage: python3 w1_bot.py <level> [clean|combat] [--boss]
 - clean: enemies removed, checks pure traversal (must finish with 0 deaths)
 - combat: enemies alive, bot slashes enemies ahead; reports deaths
 - --boss (w1_3): after the arena closes, fights Bramble King with fire + sword
"""
import os
BASE = os.environ.get('GAME_URL', 'http://localhost:4173/')
SHOT_DIR = os.environ.get('SHOT_DIR', 'tests/e2e/shots')
os.makedirs(SHOT_DIR, exist_ok=True)
import sys
import time
from playwright.sync_api import sync_playwright

LEVEL = sys.argv[1]
MODE = sys.argv[2] if len(sys.argv) > 2 else 'clean'
BOSS = '--boss' in sys.argv
GS = "window.__game.scene.getScene('GameScene')"

STATE_JS = """() => {
  const g = window.__game.scene.getScene('GameScene');
  if (!window.__game.scene.isActive('GameScene')) return { scene: window.__game.scene.getScenes(true).map(s => s.sys.settings.key) };
  const p = g.player, b = p.body, T = 16, L = g.level;
  const tile = (c, r) => r >= L.height ? 0 : (r < 0 || c < 0 || c >= L.width) ? 1 : L.tiles[r][c];
  const footRow = Math.floor((b.bottom - 1) / T);
  const probe = Math.floor((b.right + 6) / T);
  const grounded = b.blocked.down || b.touching.down;
  // มองข้างหน้า 2 ช่อง: หาพื้นแรกใต้ระดับเท้า ถ้าเป็นหนามหรือหลุมลึกให้กระโดด
  const floorAt = (c) => {
    if (tile(c, footRow) === 1) return 'wall';
    for (let r = footRow; r <= footRow + 4; r++) {
      const t = tile(c, r);
      if (t === 2) return 'spike';
      if (t === 1) return null;
    }
    return 'pit';
  };
  let hazard = floorAt(probe);
  if (!hazard) { const h2 = floorAt(probe + 1); if (h2 === 'spike' || h2 === 'pit') hazard = h2; }
  const vOverlap = (r) => r.bottom > b.top && r.top < b.bottom;
  let block = null;
  for (const o of g.puzzleObjects) {
    if (o.removed) continue;
    const r = o.bounds;
    const ahead = r.left - b.right;
    if (['vine', 'ice', 'crate'].includes(o.kind) || (o.kind === 'gate' && !o.isOpen)) {
      if (ahead > -4 && ahead < 40 && vOverlap(r)) { block = o.kind; break; }
    }
    if (o.kind === 'torch' && !o.isActive && ahead > -8 && ahead < 90 && vOverlap(r)) { block = 'torch'; break; }
  }
  const foes = g.enemies.getChildren().filter(e => e.isAlive);
  const foe = foes.some(e => { const dx = e.x - p.x; return dx > -10 && dx < 44 && Math.abs(e.y - p.y) < 40; });
  // ด้วงหันหน้ามาหา (เกราะหน้า): กระโดดข้าม
  const beetle = foes.some(e => e.constructor.name === 'ThornBeetle' || e.isFlipped !== undefined ? (e.isFlipped === false && e.x - p.x > 0 && e.x - p.x < 56 && Math.abs(e.y - p.y) < 24) : false);
  const near = foes.map(e => [e.constructor.name, Math.round(e.x - p.x), Math.round(e.y - p.y)]).filter(v => Math.abs(v[1]) < 60);
  const boss = g.boss;
  let bs = null;
  if (boss && (boss.isActive || boss.isDefeated)) {
    const whips = boss.whips.map(w => w.sprite.x);
    const seeds = boss.seeds.filter(s => s.sprite.visible || true).map(s => s.sprite.x);
    bs = { left: boss.left, exposed: boss.isExposed, defeated: boss.isDefeated, hp: boss.hp,
      shields: boss.shields.filter(s => !s.removed).length,
      low: Math.min(9, ...boss.shields.filter(s => !s.removed).map(s => Math.round((boss.bottom - s.bounds.bottom) / 32))), telegraph: !!boss.telegraph, whips, seeds };
  }
  return { scene: ['GameScene'], x: p.x, y: p.y, col: Math.floor(p.x / T), grounded, hazard, block, foe,
    dead: p.isDead, lives: g.vitals.lives, hp: g.vitals.hp, selected: g.elements.selected, boss: bs,
    beetle, near, goal: g.goalFlag ? { x: g.goalFlag.x, visible: g.goalFlag.visible } : null, finished: g.finished };
}"""


def main():
    with sync_playwright() as pw:
        br = pw.chromium.launch(args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'])
        page = br.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(BASE + '?lowres')
        page.wait_for_function("() => window.__game && window.__game.scene.isActive('TitleScene')", timeout=15000)
        page.evaluate(f"() => {{ window.__game.scene.getScene('TitleScene').scene.start('GameScene', {{ level: '{LEVEL}' }}); }}")
        page.wait_for_function("() => window.__game.scene.isActive('GameScene')")
        page.wait_for_timeout(600)
        if MODE == 'clean':
            page.evaluate(f"() => {GS}.enemies.getChildren().forEach(e => e.vanish())")
        page.evaluate(f"() => {{ const g={GS}; window.__log=[]; g.events.on('postupdate', () => {{ window.__log.push([Math.round(g.player.x), Math.round(g.player.body.bottom), g.input.keyboard.keys.length]); if (window.__log.length > 120) window.__log.shift(); }}); }}")
        lives0 = page.evaluate(f"() => {GS}.vitals.lives")
        print("  start lives", lives0, page.evaluate(f"() => [{GS}.vitals.hp, {GS}.player.isDead, {GS}.player.x]"), flush=True)
        deaths = 0
        hits = 0
        last_hp = page.evaluate(f"() => {GS}.vitals.hp")
        jump_until = 0.0
        last_progress = (0, time.time())
        page.keyboard.down('d')
        holding_d = True
        t0 = time.time()
        result = 'timeout'
        boss_started = False
        while time.time() - t0 < 240:
            s = page.evaluate(STATE_JS)
            if 'StageClearScene' in s['scene']:
                result = 'clear'
                break
            if 'GameOverScene' in s['scene']:
                result = 'gameover'
                break
            if 'x' not in s:
                time.sleep(0.05)
                continue
            now = time.time()
            if s['hp'] < last_hp:
                hits += 1
                if '-v' in sys.argv and s['boss']: print(f"   hit x-left={s['x']-s['boss']['left']:.0f} y={s['y']:.0f} grounded={s['grounded']} whips={[round(w - s['boss']['left']) for w in s['boss']['whips']]} seeds={len(s['boss']['seeds'])} exposed={s['boss']['exposed']} hp={s['boss']['hp']}", flush=True)
            last_hp = s['hp']
            if s['dead']:
                deaths += 1
                if '-v' in sys.argv: print('   arc', page.evaluate("() => window.__log.slice(-60).filter((_, i) => i % 3 == 0).map(l => l.slice(0,2))"), flush=True)
                print(f'  DEATH at col {s["col"]} (hazard={s["hazard"]}, boss={bool(s["boss"])}, near={s["near"]})', flush=True)
                page.keyboard.up('Space'); page.keyboard.up('a'); page.keyboard.up('d'); holding_d = False
                page.wait_for_function(f"() => !{GS}.player.isDead || !window.__game.scene.isActive('GameScene')", timeout=8000)
                page.wait_for_timeout(500)
                last_hp = page.evaluate(f"() => window.__game.scene.isActive('GameScene') ? {GS}.vitals.hp : 0")
                last_progress = (0, time.time())
                continue
            if now > jump_until:
                page.keyboard.up('Space')

            if s['boss'] and not s['boss']['defeated']:
                if not BOSS:
                    result = 'reached boss'
                    break
                if not boss_started:
                    main.fight = time.time()
                boss_started = True
                fight_boss(page, s, now, lambda t: None)
                continue
            if s['boss'] and s['boss']['defeated']:
                if not boss_started:
                    pass
                elif s['goal'] and s['goal']['visible']:
                    if not getattr(main, 'won', None):
                        main.won = time.time(); print(f'  boss defeated after {main.won - main.fight:.0f}s of fighting', flush=True)
                    left = s['goal']['x'] < s['x']
                    page.keyboard.up('d' if left else 'a'); page.keyboard.down('a' if left else 'd'); holding_d = not left
                time.sleep(0.05)
                continue

            # stuck detection
            if s['x'] > last_progress[0] + 8:
                last_progress = (s['x'], now)
            elif now - last_progress[1] > 6:
                result = f'stuck at col {s["col"]} block={s["block"]} hazard={s["hazard"]}'
                break

            if s['block'] and s['grounded']:
                if holding_d:
                    page.keyboard.up('d'); holding_d = False
                if s['selected'] != 'fire':
                    page.keyboard.press('1')
                page.keyboard.down('k'); page.wait_for_timeout(60); page.keyboard.up('k')
                page.wait_for_timeout(450)
                continue
            if MODE == 'combat' and s['foe']:
                page.keyboard.press('j')
            if not holding_d:
                page.keyboard.down('d'); holding_d = True
            if (s['hazard'] or (MODE == 'combat' and s['beetle'])) and s['grounded'] and now > jump_until:
                page.keyboard.down('Space')
                if '-v' in sys.argv: print(f'  jump x={s["x"]:.0f} col={s["col"]} {s["hazard"]}', flush=True)
                jump_until = now + 0.45
            time.sleep(0.03)
        page.keyboard.up('d')
        print(f'{LEVEL} [{MODE}{" boss" if BOSS else ""}]: {result}, deaths={deaths}, hits={hits}, '
              f'time={time.time() - t0:.0f}s, lives {lives0}->{page.evaluate(f"() => {GS}.vitals.lives")}')
        if errors:
            print('  page errors:', errors[:5])
        br.close()


BOSS_JUMP_DELAY = {1: 130, 2: 300}
boss_state = {'phase': 'approach', 'jump_until': 0.0}


def fight_boss(page, s, now, _):
    """ยืนหน้าโล่ ยิงไฟ (กระโดดยิงโล่ชิ้นบน), กระโดดหลบแส้, เมื่อจุดอ่อนเปิดเดินเข้าไปฟัน"""
    b = s['boss']
    kb = page.keyboard
    if now > boss_state['jump_until']:
        kb.up('Space')
    whip_close = any(s['x'] - 70 < wx + 64 and wx < s['x'] + 30 for wx in b['whips'])
    stand_x = b['left'] - 40
    if whip_close and s['grounded']:
        kb.down('Space'); boss_state['jump_until'] = now + 0.45
        return
    if b['exposed']:
        # เดินเข้าไปฟันจุดอ่อน
        if s['x'] < b['left'] + 4:
            kb.up('a'); kb.down('d')
        else:
            kb.up('d')
        kb.press('j')
        time.sleep(0.05)
        return
    # กลับไปยืนตำแหน่งยิง
    if s['x'] > stand_x + 8:
        kb.up('d'); kb.down('a'); time.sleep(0.05); return
    if s['x'] < stand_x - 8:
        kb.up('a'); kb.down('d'); time.sleep(0.05); return
    kb.up('a'); kb.up('d')
    if s['selected'] != 'fire':
        kb.press('1')
    # หันขวา
    kb.down('d'); page.wait_for_timeout(16); kb.up('d')
    if b['telegraph']:
        time.sleep(0.05)
        return
    if b['low'] == 0:
        kb.down('k'); page.wait_for_timeout(50); kb.up('k'); page.wait_for_timeout(300)
    else:
        # โล่ที่เหลืออยู่สูง: กระโดดแล้วยิงตอนลอยถึงระดับนั้น
        kb.down('Space'); page.wait_for_timeout(BOSS_JUMP_DELAY.get(b['low'], 330))
        kb.down('k'); page.wait_for_timeout(50); kb.up('k')
        page.wait_for_timeout(150); kb.up('Space'); page.wait_for_timeout(500)


if __name__ == '__main__':
    main()
