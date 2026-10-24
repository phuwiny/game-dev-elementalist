import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseTiledMap, type TiledMap } from '../src/core/TiledLevel';

type TiledObjects = NonNullable<TiledMap['layers'][number]['objects']>;
import { lintLevel, SINGLE_JUMP_RULES } from '../src/core/LevelLint';
import { parseLevel, LevelParseError } from '../src/core/LevelParser';
import { ADVENTURE_LEVELS } from '../src/levels';

const load = (file: string) => JSON.parse(readFileSync(new URL(`../public/${file}`, import.meta.url), 'utf8')) as TiledMap;

describe('World 1 Tiled maps', () => {
  for (const def of ADVENTURE_LEVELS) {
    it(`${def.key} parses and passes the single-jump lint`, () => {
      const level = parseTiledMap(load(def.map!));
      expect(lintLevel(level, SINGLE_JUMP_RULES)).toEqual([]);
      expect(level.checkpoints.length).toBeGreaterThanOrEqual(1);
    });
  }

  it('1-1 gives Burnil and 1-3 ends with the boss arena', () => {
    const w11 = parseTiledMap(load('assets/maps/w1_1.json'));
    expect(w11.objects.filter((o) => o.kind === 'spirit').map((o) => o.slot)).toEqual([0]);
    const w13 = parseTiledMap(load('assets/maps/w1_3.json'));
    expect(w13.boss).not.toBeNull();
    expect(w13.objects.some((o) => o.kind === 'arenaGate')).toBe(true);
  });
});

describe('parseTiledMap', () => {
  const tiny = (objects: TiledObjects): TiledMap => ({
    width: 4,
    height: 3,
    tilewidth: 16,
    tileheight: 16,
    tilesets: [
      {
        firstgid: 1,
        tiles: [
          { id: 0, properties: [{ name: 'collides', value: true }] },
          { id: 2, properties: [{ name: 'hazard', value: true }] },
        ],
      },
    ],
    layers: [
      { name: 'terrain', type: 'tilelayer', data: [0, 0, 0, 0, 0, 0, 3, 0, 1, 1, 1, 1] },
      { name: 'objects', type: 'objectgroup', objects },
    ],
  });

  it('reads tiles and bottom-left anchored objects (class or legacy type)', () => {
    const level = parseTiledMap(
      tiny([
        { id: 1, class: 'player', x: 0, y: 16, width: 16, height: 16 },
        { id: 2, type: 'goal', x: 48, y: 16, width: 16, height: 16 },
        { id: 3, class: 'torch', x: 16, y: 0, width: 16, height: 32 },
        { id: 4, class: 'leaf_wisp', x: 32, y: 0, width: 16, height: 16 },
      ]),
    );
    expect(level.tiles[1][2]).toBe(2);
    expect(level.tiles[2][0]).toBe(1);
    expect(level.player).toEqual({ col: 0, row: 1 });
    expect(level.goal).toEqual({ col: 3, row: 1 });
    expect(level.objects).toEqual([{ kind: 'torch', col: 1, row: 1 }]);
    expect(level.enemies).toEqual([{ kind: 'leaf_wisp', col: 2, row: 0 }]);
  });

  it('rejects unknown classes and maps without player or goal', () => {
    expect(() => parseTiledMap(tiny([{ id: 1, class: 'dragon', x: 0, y: 0, width: 16, height: 16 }]))).toThrow(/Unknown/);
    expect(() => parseTiledMap(tiny([{ id: 1, class: 'goal', x: 0, y: 0, width: 16, height: 16 }]))).toThrow(LevelParseError);
  });
});

describe('lintLevel', () => {
  it('flags wide pits, long spike strips, tall steps and objects needing other elements', () => {
    const level = parseLevel([
      'P...............G',
      '...........###...',
      '.......^^^^###...',
      '##.....##########',
    ]);
    level.objects.push({ kind: 'windmill', col: 1, row: 2 });
    const issues = lintLevel(level, { ...SINGLE_JUMP_RULES, maxStepUpTiles: 1 });
    expect(issues.some((i) => i.startsWith('pit of 5'))).toBe(true);
    expect(issues.some((i) => i.startsWith('spike strip of 4'))).toBe(true);
    expect(issues.some((i) => i.startsWith('step up of 2'))).toBe(true);
    expect(issues.some((i) => i.includes('windmill'))).toBe(true);
  });

  it('flags a platform hanging low over a pit (head bonk drops the player in)', () => {
    const rows = [
      '#.................#',
      '#.................#',
      '#.................#',
      '#.................#',
      '#.......##........#',
      '#.................#',
      '#.................#',
      '#P..............G.#',
      '#######....########',
    ];
    const issues = lintLevel(parseLevel(rows), SINGLE_JUMP_RULES);
    expect(issues.some((i) => i.startsWith('pit at cols 7-10') && i.includes('ceiling'))).toBe(true);
    const open = rows.map((r) => r.replace('##.', '...'));
    expect(lintLevel(parseLevel(open), SINGLE_JUMP_RULES).filter((i) => i.includes('ceiling'))).toEqual([]);
  });
});
