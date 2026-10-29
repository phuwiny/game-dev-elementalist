"""World 1 (Ember Woods) levels: ASCII layout -> Tiled JSON maps.

usage: python3 w1.py <out_dir>   (writes w1_1.json, w1_2.json, w1_3.json and prints the layouts)
"""
import json
import os
import random
import sys
from pathlib import Path
from xml.etree import ElementTree as ET

H, G = 23, 20  # rows, ground row (G..H-1 are ground)
SIZES = {'v': (1, 1), 'b': (1, 1), 'i': (1, 1), '~': (1, 1), 't': (1, 2), 'w': (1, 1), 'm': (3, 3),
         'X': (2, 2), '_': (2, 1), 'D': (2, 3), 'A': (2, 3)}


class Level:
    def __init__(self, width):
        self.W = width
        self.g = [['.'] * width for _ in range(H)]
        self.fill(0, width - 1, G, H - 1)
        self.fill(0, 0, 0, H - 1)
        self.fill(width - 1, width - 1, 0, H - 1)

    def put(self, c, r, ch):
        assert self.g[r][c] == '.', f'overwrite {self.g[r][c]!r} at col {c} row {r} with {ch!r}'
        self.g[r][c] = ch

    def fill(self, c0, c1, r0, r1, ch='#'):
        for r in range(r0, r1 + 1):
            for c in range(c0, c1 + 1):
                self.g[r][c] = ch

    def pit(self, c0, c1):
        self.fill(c0, c1, G, H - 1, '.')

    def step(self, c0, c1, height):
        """raised ground block of `height` tiles on top of the ground"""
        self.fill(c0, c1, G - height, G - 1)

    def platform(self, c0, c1, row):
        """floating one-way platform (stand on it from above, jump up through it)"""
        self.fill(c0, c1, row, row, '-')

    def gate(self, c, ch='D', floor=G):
        self.fill(c, c + 1, 0, floor - 4)
        self.put(c, floor - 1, ch)

    def column(self, c, ch, top, floor=G):
        self.fill(c, c, 0, top - 1)
        for r in range(top, floor):
            self.put(c, r, ch)

    def coins(self, c0, c1, r):
        for c in range(c0, c1 + 1):
            self.put(c, r, 'c')

    def spikes(self, c0, c1, floor=G):
        for c in range(c0, c1 + 1):
            self.put(c, floor - 1, '^')

    def rows(self):
        return [''.join(r) for r in self.g]


# ---------------------------------------------------------------------------
# 1-1 Ember Trail: get Burnil, learn fire safely
# ---------------------------------------------------------------------------
def w1_1():
    L = Level(170)
    L.put(3, G - 1, 'P')
    L.put(9, G - 2, '1')                        # Burnil
    L.coins(12, 14, G - 2)
    L.column(18, 'v', 14)                       # first vine wall: shoot it
    L.step(24, 27, 1); L.step(28, 31, 2)        # gentle steps
    L.coins(28, 31, G - 4)
    L.put(35, G - 1, 's')
    L.pit(40, 42)                               # 3-tile pit
    L.coins(40, 42, G - 3)
    L.step(44, 45, 1); L.platform(46, 50, 15); L.coins(47, 49, 14)   # 4 tiles of headroom under it for the V4 body
    L.put(52, G - 1, 's')
    for r in (17, 18, 19): L.put(58, r, 'b'); L.put(60, r, 'b')   # crate nest with a heart
    L.put(59, 17, 'b'); L.put(59, 18, 'b'); L.put(59, 19, 'h')
    L.put(64, G - 1, 'K')
    L.put(70, G - 1, 't'); L.gate(76)           # torch -> gate
    L.step(79, 82, 1)                           # 5 flat tiles before the spikes (lint run-up)
    L.spikes(88, 90)                            # 3 spikes
    L.put(95, G - 1, 's')
    L.pit(100, 103)                             # 4-tile pit
    L.coins(101, 102, 17)                       # coins mark the jump arc (no ceiling over pits: lint headroom)
    L.put(108, G - 1, 'K')
    L.column(114, 'i', 14)                      # ice wall
    L.put(120, G - 1, 's'); L.put(126, G - 1, 's')
    L.step(130, 134, 2); L.coins(130, 134, G - 4)
    L.put(138, 15, 'f')                         # first leaf wisp
    L.pit(142, 144)
    L.coins(150, 154, G - 2)
    L.put(162, G - 1, 'G')
    return L


# ---------------------------------------------------------------------------
# 1-2 Burning Canopy: fire with combat, beetles and wisps
# ---------------------------------------------------------------------------
def w1_2():
    L = Level(200)
    L.put(3, G - 1, 'P')
    L.coins(8, 11, G - 2)
    L.put(16, G - 1, 'r')                       # thorn beetle: hit it from behind
    L.step(22, 25, 1); L.step(26, 29, 2); L.step(30, 33, 3)
    L.put(31, G - 5, 'h')
    L.step(34, 37, 2); L.step(38, 41, 1)
    L.put(46, 15, 'f')
    L.pit(50, 53)
    L.step(54, 55, 1); L.platform(56, 60, 15); L.coins(56, 60, 14)
    L.put(63, G - 1, 's'); L.put(68, G - 1, 'r')
    L.put(72, G - 1, 'K')
    L.put(76, G - 1, 't'); L.put(80, G - 1, 't'); L.gate(86)   # two torches -> one gate
    L.put(93, 14, 'f'); L.put(99, 16, 'f')
    L.spikes(95, 97)
    L.pit(103, 106)
    L.coins(104, 105, 17)
    for r in range(15, 20): L.put(112, r, 'b')    # crate wall (fire)
    L.fill(112, 112, 0, 14)
    L.put(118, G - 1, 'r')
    L.put(124, G - 1, 'K')
    L.step(128, 131, 2); L.step(132, 135, 4) if False else None
    L.platform(134, 138, 15); L.coins(134, 138, 14)
    L.put(140, G - 1, 's')
    L.column(146, 'v', 13)
    L.put(152, 15, 'f'); L.put(156, G - 1, 'r')
    L.pit(160, 162)
    L.spikes(168, 170)
    L.put(175, G - 1, 's'); L.put(178, G - 1, 'r')
    L.coins(182, 186, G - 2)
    L.put(192, G - 1, 'G')
    return L


# ---------------------------------------------------------------------------
# 1-3 Bramble Hollow: the hard one, then Bramble King
# ---------------------------------------------------------------------------
def w1_3():
    L = Level(204)
    L.put(3, G - 1, 'P')
    L.put(10, G - 1, 'r'); L.put(14, 15, 'f')
    L.pit(18, 21)
    L.step(24, 28, 2); L.spikes(29, 31, floor=G); L.step(32, 35, 2)
    L.put(40, G - 1, 's'); L.put(43, G - 1, 'r')
    L.column(48, 'v', 13)
    L.put(54, 14, 'f'); L.pit(57, 60); L.coins(58, 59, 17)
    L.put(64, G - 1, 'K')
    L.column(70, 'i', 13)
    L.put(75, G - 1, 't'); L.put(78, G - 1, 'r'); L.gate(84)
    L.spikes(89, 91)
    L.put(99, 13, 'f')                          # keep wisps away from the spike landing (knockback)
    L.pit(103, 106); L.coins(104, 105, 17)
    for r in (17, 18, 19): L.put(111, r, 'b'); L.put(113, r, 'b')
    L.put(112, 17, 'b'); L.put(112, 18, 'b'); L.put(112, 19, 'h')
    L.put(118, G - 1, 'r'); L.put(121, G - 1, 's')
    L.step(126, 129, 2); L.step(130, 133, 3); L.step(134, 137, 1)
    L.put(131, 14, 'f')
    L.pit(143, 146)
    L.spikes(152, 154)
    L.put(158, G - 1, 'r'); L.put(161, G - 1, 's')
    L.put(163, G - 2, 'h')
    L.put(166, G - 1, 'K')                      # checkpoint before the boss
    L.gate(170, ch='A')                         # arena gate (open until the fight starts)
    L.put(180, G - 1, 'G')                      # goal appears when the boss is defeated
    L.put(188, G - 1, 'B')                      # Bramble King (12x12 tiles, bottom-left)
    return L


TSX = Path(__file__).resolve().parents[2] / 'public/assets/tilesets/tiles_w1_ember_woods.tsx'
FLIP_H = 0x80000000


def load_tileset():
    """Embed the tileset from the TSX (single source of truth for margin, spacing and tile properties)."""
    root = ET.parse(TSX).getroot()
    image = root.find('image')
    tiles = []
    for tile in root.findall('tile'):
        props = [{'name': p.get('name'), 'type': p.get('type'), 'value': p.get('value') == 'true'}
                 for p in tile.find('properties')]
        tiles.append({'id': int(tile.get('id')), 'properties': props})
    return {
        'firstgid': 1, 'name': root.get('name'), 'tilewidth': 16, 'tileheight': 16,
        'tilecount': int(root.get('tilecount')), 'columns': int(root.get('columns')),
        'image': '../tilesets/' + image.get('source'), 'imagewidth': int(image.get('width')),
        'imageheight': int(image.get('height')), 'margin': int(root.get('margin')),
        'spacing': int(root.get('spacing')), 'tiles': tiles,
    }


# Tile roles in tiles_w1_ember_woods (see art/reports/phase_c.md and tools/art/build_world1_environment.py)
T_TOP = (0, 0, 0, 1)          # grass cap (moss soil x3, old roots x1)
T_EDGE = 2                    # soil with a dark left edge; mirrored for the right edge (no right-edge tile in the set)
T_BOTTOM = (10, 10, 15)       # underside with a dark bottom strip
T_FILL = (3, 3, 7)            # no plain fill tile exists: roots with a subtle left line, one with a cavity
T_ONEWAY = (16, 17, 18)       # left end, middle, right end
T_HAZARD = (19, 19, 20, 21)
# ground decoration: leaves 34-37, roots 38-41, rubble 46-49, mushrooms 50-53, ember flowers 54-57
DECOR_GROUND = list(range(34, 42)) + list(range(46, 58))
DECOR_CHANCE = 0.3
CLASSES = {'P': 'player', 'G': 'goal', 'K': 'checkpoint', 'c': 'coin', 'h': 'heart', 's': 'moss_slime',
           'f': 'leaf_wisp', 'r': 'thorn_beetle', 'v': 'vine', 'b': 'crate', 'i': 'ice', '~': 'water',
           't': 'torch', 'w': 'seed', 'm': 'windmill', 'X': 'cracked_wall', '_': 'plate', 'D': 'gate',
           'A': 'arena_gate', 'B': 'boss'}


def autotile(rows, rng):
    """terrain gids from the ASCII layout: '#' solid, '-' one-way, '^' hazard"""
    H_, W_ = len(rows), len(rows[0])

    def solid(r, c):
        return r < 0 or r >= H_ or c < 0 or c >= W_ or rows[r][c] == '#'

    def oneway(r, c):
        return 0 <= r < H_ and 0 <= c < W_ and rows[r][c] == '-'

    data = []
    for r in range(H_):
        for c in range(W_):
            ch = rows[r][c]
            tid, flip = None, False
            if ch == '#':
                if not solid(r - 1, c):
                    tid = rng.choice(T_TOP)
                elif not solid(r, c - 1):
                    tid = T_EDGE
                elif not solid(r, c + 1):
                    tid, flip = T_EDGE, True
                elif not solid(r + 1, c):
                    tid = rng.choice(T_BOTTOM)
                else:
                    tid = rng.choice(T_FILL)
            elif ch == '-':
                tid = T_ONEWAY[0] if not oneway(r, c - 1) else T_ONEWAY[2] if not oneway(r, c + 1) else T_ONEWAY[1]
            elif ch == '^':
                tid = rng.choice(T_HAZARD)
            data.append(0 if tid is None else (1 + tid) | (FLIP_H if flip else 0))
    return data


def decorate(rows, rng):
    """sparse ground decoration on grass caps, away from objects, enemies and spawns"""
    H_, W_ = len(rows), len(rows[0])
    data = [0] * (H_ * W_)
    for r in range(1, H_):
        last = -9
        for c in range(W_):
            if rows[r][c] != '#' or rows[r - 1][c] != '.':
                continue
            near = rows[r - 1][max(0, c - 2):c + 3]
            if set(near) != {'.'} or c - last < 2:
                continue
            if rng.random() < DECOR_CHANCE:
                data[(r - 1) * W_ + c] = 1 + rng.choice(DECOR_GROUND)
                last = c
    return data


def to_tiled(rows, name):
    W = len(rows[0])
    objects = []
    rng = random.Random('terrain:' + name)
    data = autotile(rows, rng)
    decor = decorate(rows, random.Random('decor:' + name))
    for r, line in enumerate(rows):
        for c, ch in enumerate(line):
            if ch in '.#^-':
                continue
            if ch in '1234':
                cls, w, h, props = 'spirit', 1, 1, [{'name': 'slot', 'type': 'int', 'value': int(ch) - 1}]
            else:
                cls = CLASSES[ch]
                w, h = SIZES.get(ch, (1, 1))
                if ch == 'B':
                    w, h = 12, 12
                props = [{'name': 'kind', 'type': 'string', 'value': 'bramble_king'}] if ch == 'B' else []
            obj = {'id': len(objects) + 1, 'name': '', 'class': cls, 'x': c * 16, 'y': (r + 1 - h) * 16,
                   'width': w * 16, 'height': h * 16, 'rotation': 0, 'visible': True}
            if props:
                obj['properties'] = props
            objects.append(obj)
    return {
        'type': 'map', 'version': '1.10', 'tiledversion': '1.10.2', 'orientation': 'orthogonal',
        'renderorder': 'right-down', 'width': W, 'height': H, 'tilewidth': 16, 'tileheight': 16,
        'infinite': False, 'nextlayerid': 4, 'nextobjectid': len(objects) + 1,
        'properties': [{'name': 'name', 'type': 'string', 'value': name}],
        'tilesets': [load_tileset()],
        'layers': [
            {'id': 3, 'name': 'decor', 'type': 'tilelayer', 'width': W, 'height': H, 'x': 0, 'y': 0,
             'opacity': 1, 'visible': True, 'data': decor},
            {'id': 1, 'name': 'terrain', 'type': 'tilelayer', 'width': W, 'height': H, 'x': 0, 'y': 0,
             'opacity': 1, 'visible': True, 'data': data},
            {'id': 2, 'name': 'objects', 'type': 'objectgroup', 'draworder': 'topdown', 'x': 0, 'y': 0,
             'opacity': 1, 'visible': True, 'objects': objects},
        ],
    }


if __name__ == '__main__':
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    for key, fn, name in (('w1_1', w1_1, 'Ember Trail'), ('w1_2', w1_2, 'Burning Canopy'), ('w1_3', w1_3, 'Bramble Hollow')):
        rows = fn().rows()
        with open(os.path.join(out, f'{key}.json'), 'w', newline='\n') as f:
            json.dump(to_tiled(rows, name), f, separators=(',', ':'))
            f.write('\n')
        print(f'== {key} {name} ({len(rows[0])}x{len(rows)})')
        for i in range(0, len(rows[0]), 100):
            print('\n'.join(r[i:i + 100] for r in rows[9:])); print()
