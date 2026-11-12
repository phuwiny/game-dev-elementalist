"""Shared level generator: ASCII layout -> Tiled JSON maps (used by w1.py and later worlds).

A world script builds each level with `Level`, then calls `write_levels`.
"""
import json
import os
import random
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
        self.shards = []  # (col, row, slot): Spirit Shards are Tiled objects, not ASCII cells

    def shard(self, c, r, slot):
        assert self.g[r][c] == '.', f'shard over {self.g[r][c]!r} at col {c} row {r}'
        assert all(s[2] != slot for s in self.shards), f'shard slot {slot} used twice'
        self.shards.append((c, r, slot))

    def crate_nest(self, c, slot):
        """3x3 ring of crates (burn them with fire) hiding a Spirit Shard at the bottom centre"""
        for r in (17, 18, 19):
            self.put(c, r, 'b'); self.put(c + 2, r, 'b')
        self.put(c + 1, 17, 'b'); self.put(c + 1, 18, 'b')
        self.shard(c + 1, 19, slot)

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


TILESET_DIR = Path(__file__).resolve().parents[2] / 'public/assets/tilesets'
FLIP_H = 0x80000000
# Standard tile-ID layout of every world tileset (ART_HANDOFF.md section 7.1). Used for the Tiled
# properties when a world's .tsx has not been delivered yet; the game then draws graybox tiles.
STANDARD_LAYOUT = {'tilecount': 64, 'columns': 16, 'imagewidth': 288, 'imageheight': 72, 'margin': 1, 'spacing': 2}
STANDARD_PROPERTIES = [(range(0, 16), 'collides'), (range(16, 19), 'oneWay'), (range(19, 22), 'hazard')]


def standard_tiles():
    return [{'id': i, 'properties': [{'name': name, 'type': 'bool', 'value': True}]}
            for ids, name in STANDARD_PROPERTIES for i in ids]


def load_tileset(name):
    """Embed the tileset from its TSX (single source of truth for margin, spacing and tile properties).

    Without a TSX (art not delivered yet) the standard layout is used.
    """
    tsx = TILESET_DIR / f'{name}.tsx'
    if not tsx.exists():
        return {'firstgid': 1, 'name': name, 'tilewidth': 16, 'tileheight': 16, 'image': f'../tilesets/{name}.png',
                **STANDARD_LAYOUT, 'tiles': standard_tiles()}
    root = ET.parse(tsx).getroot()
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


# Tile roles shared by every world tileset (ART_HANDOFF.md section 7.1; first used by tiles_w1_ember_woods)
T_TOP = (0, 0, 1)             # grass cap, two variants
T_FILL = (2, 3)               # soil, two variants
T_LEFT, T_RIGHT, T_CEILING = 4, 5, 6
T_OUTER = {'tl': 7, 'tr': 8, 'bl': 9, 'br': 10}   # convex corners
T_INNER = {'tl': 11, 'tr': 12, 'bl': 13, 'br': 14}  # concave corners (unused, see solid_tile)
T_CAP = 15                    # single-tile platform cap
T_ONEWAY = (16, 17, 18)       # left end, middle, right end
T_HAZARD = (19, 19, 20, 21)
# ground decoration: leaves 34-37, roots 38-41, rubble 46-49, mushrooms 50-53, ember flowers 54-57
DECOR_GROUND = list(range(34, 42)) + list(range(46, 58))
DECOR_CHANCE = 0.3
# background ruins: ruined masonry 22-33 behind the play lane, wall vines 42-45 hanging from the broken top
WALL_TILES = tuple(range(22, 34))
VINE_TILES = tuple(range(42, 46))
VINE_CHANCE = 0.4
CLASSES = {'P': 'player', 'G': 'goal', 'K': 'checkpoint', 'c': 'coin', 'h': 'heart', 'o': 'orb', 'u': 'feather',
           's': 'moss_slime',
           'f': 'leaf_wisp', 'r': 'thorn_beetle', 'v': 'vine', 'b': 'crate', 'i': 'ice', '~': 'water',
           't': 'torch', 'w': 'seed', 'm': 'windmill', 'X': 'cracked_wall', '_': 'plate', 'D': 'gate',
           'A': 'arena_gate', 'B': 'boss'}


def solid_tile(solid, r, c, rng):
    """pick the terrain tile for a solid cell from its 8 neighbours (out of the map counts as solid)"""
    u, d, l, rt = solid(r - 1, c), solid(r + 1, c), solid(r, c - 1), solid(r, c + 1)
    if not u and not d:
        return T_CAP
    if not u:
        if not l:
            return T_OUTER['tl']
        if not rt:
            return T_OUTER['tr']
        return rng.choice(T_TOP)
    if not d:
        if not l:
            return T_OUTER['bl']
        if not rt:
            return T_OUTER['br']
        return T_CEILING
    if not l:
        return T_LEFT
    if not rt:
        return T_RIGHT
    # T_INNER (11-14) is not used: each draws a grass cap or edge lines across a tile that sits inside the soil,
    # so a concave corner shows as a green block. Plain fill reads cleanly until the art intent is confirmed.
    return rng.choice(T_FILL)


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
            tid = None
            if ch == '#':
                tid = solid_tile(solid, r, c, rng)
            elif ch == '-':
                tid = T_ONEWAY[0] if not oneway(r, c - 1) else T_ONEWAY[2] if not oneway(r, c + 1) else T_ONEWAY[1]
            elif ch == '^':
                tid = rng.choice(T_HAZARD)
            data.append(0 if tid is None else 1 + tid)
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


def ruins(rows, spans, rng):
    """(wall gids, vine gids): masonry rising from the ground with an uneven top, vines hanging from it

    spans: (first col, last col, max height in tiles); cells holding an object or enemy are left empty
    """
    H_, W_ = len(rows), len(rows[0])
    walls, vines = [0] * (H_ * W_), [0] * (H_ * W_)
    for c0, c1, h in spans:
        for c in range(c0, c1 + 1):
            if rows[G][c] != '#':
                continue  # no wall standing over a pit
            height = max(2, h - rng.choice((0, 0, 1, 2)))
            top = G - height
            for r in range(top, G):
                if rows[r][c] == '.':
                    walls[r * W_ + c] = 1 + rng.choice(WALL_TILES)
            if walls[top * W_ + c] and rng.random() < VINE_CHANCE:
                for r in (top, top + 1):
                    if walls[r * W_ + c]:
                        vines[r * W_ + c] = 1 + rng.choice(VINE_TILES)
    return walls, vines


def to_tiled(rows, name, tileset, shards=(), ruin_spans=(), boss='bramble_king'):
    """Tiled map (JSON) for one level. `tileset` is the tileset name, `boss` the kind of the 'B' object."""
    W = len(rows[0])
    objects = []
    rng = random.Random('terrain:' + name)
    data = autotile(rows, rng)
    ground = decorate(rows, random.Random('decor:' + name))
    walls, vines = ruins(rows, ruin_spans, random.Random('ruins:' + name))
    over = [v or g for v, g in zip(vines, ground)]
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
                props = [{'name': 'kind', 'type': 'string', 'value': boss}] if ch == 'B' else []
            obj = {'id': len(objects) + 1, 'name': '', 'class': cls, 'x': c * 16, 'y': (r + 1 - h) * 16,
                   'width': w * 16, 'height': h * 16, 'rotation': 0, 'visible': True}
            if props:
                obj['properties'] = props
            objects.append(obj)
    for c, r, slot in shards:
        objects.append({'id': len(objects) + 1, 'name': '', 'class': 'shard', 'x': c * 16, 'y': r * 16,
                        'width': 16, 'height': 16, 'rotation': 0, 'visible': True,
                        'properties': [{'name': 'slot', 'type': 'int', 'value': slot}]})
    return {
        'type': 'map', 'version': '1.10', 'tiledversion': '1.10.2', 'orientation': 'orthogonal',
        'renderorder': 'right-down', 'width': W, 'height': H, 'tilewidth': 16, 'tileheight': 16,
        'infinite': False, 'nextlayerid': 5, 'nextobjectid': len(objects) + 1,
        'properties': [{'name': 'name', 'type': 'string', 'value': name}],
        'tilesets': [load_tileset(tileset)],
        'layers': [
            {'id': 3, 'name': 'decor', 'type': 'tilelayer', 'width': W, 'height': H, 'x': 0, 'y': 0,
             'opacity': 1, 'visible': True, 'data': walls},
            {'id': 4, 'name': 'decor_over', 'type': 'tilelayer', 'width': W, 'height': H, 'x': 0, 'y': 0,
             'opacity': 1, 'visible': True, 'data': over},
            {'id': 1, 'name': 'terrain', 'type': 'tilelayer', 'width': W, 'height': H, 'x': 0, 'y': 0,
             'opacity': 1, 'visible': True, 'data': data},
            {'id': 2, 'name': 'objects', 'type': 'objectgroup', 'draworder': 'topdown', 'x': 0, 'y': 0,
             'opacity': 1, 'visible': True, 'objects': objects},
        ],
    }


def write_levels(out, levels, tileset):
    """levels: (key, build function, display name, ruin spans). Writes <out>/<key>.json and prints the layouts."""
    os.makedirs(out, exist_ok=True)
    for key, fn, name, ruin_spans in levels:
        level = fn()
        rows = level.rows()
        with open(os.path.join(out, f'{key}.json'), 'w', newline='\n') as f:
            json.dump(to_tiled(rows, name, tileset, level.shards, ruin_spans), f, separators=(',', ':'))
            f.write('\n')
        print(f'== {key} {name} ({len(rows[0])}x{len(rows)})')
        for i in range(0, len(rows[0]), 100):
            print('\n'.join(r[i:i + 100] for r in rows[9:])); print()
