"""World 1 (Ember Woods) levels: ASCII layout -> Tiled JSON maps.

usage: python3 w1.py <out_dir>   (writes w1_1.json, w1_2.json, w1_3.json and prints the layouts)
"""
import sys

from common import G, Level, write_levels

TILESET = 'tiles_w1_ember_woods'


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
    # Spirit Shards: a tower of one-way ledges by the start, a ledge over the platform, a crate nest
    L.platform(5, 7, 17); L.platform(8, 10, 14); L.platform(11, 13, 11); L.shard(12, 10, 0)
    L.platform(48, 49, 12); L.shard(48, 11, 1)
    L.crate_nest(146, 2)                        # the pit at 142-144 comes first
    # Spirit Orbs: after the heart nest (torch + gate ahead), before the last crate nest (ice wall behind).
    # Keep orbs out of the RUINS columns: a cell holding an object changes the wall RNG sequence
    L.put(72, G - 2, 'o'); L.put(140, G - 2, 'o')
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
    # Spirit Shards: ledge over the pyramid, a crate nest, a ledge guarded by a leaf wisp
    L.platform(28, 30, 14); L.shard(29, 9, 0)    # float 4 tiles above the ledge: jump again from it
    L.crate_nest(44, 1)
    L.platform(135, 137, 12); L.shard(136, 11, 2); L.put(133, 10, 'f')
    # Spirit Orbs: before the two torches, before the vine column
    L.put(74, G - 2, 'o'); L.put(142, G - 2, 'o')
    # 1UP Feather (the only one in World 1): one-way ledges climbing above the checkpoint into the rows
    # the camera does not show from the ground (it sees rows 8-22 there); the feather sits on the top ledge
    L.platform(118, 120, 17); L.platform(121, 123, 14); L.platform(124, 126, 11); L.platform(127, 129, 8)
    L.put(128, 7, 'u')
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
    # Spirit Shards: a ledge over the spikes, a crate nest, a ledge next to the wisp by the pyramid
    L.platform(29, 31, 15); L.shard(30, 10, 0)
    L.crate_nest(52, 1)
    L.platform(128, 129, 14); L.shard(129, 9, 2)
    # Spirit Orbs: after the first checkpoint (ice wall + torch ahead), just before the boss arena
    L.put(68, G - 2, 'o'); L.put(165, G - 2, 'o')
    return L


# background ruins per level: (first col, last col, max height in tiles)
LEVELS = (
    ('w1_1', w1_1, 'Ember Trail', [(60, 70, 5), (148, 158, 4)]),
    ('w1_2', w1_2, 'Burning Canopy', [(60, 68, 5), (150, 160, 4)]),
    ('w1_3', w1_3, 'Bramble Hollow', [(60, 66, 4), (176, 198, 6)]),
)

if __name__ == '__main__':
    write_levels(sys.argv[1], LEVELS, TILESET)
