# Music files

Drop real tracks here and the game uses them instead of the built-in chiptune scores (`src/assets/scores.ts`).
Provide both formats; browsers that cannot play Ogg Vorbis fall back to MP3.

| File name (without extension) | Where it plays | Loops |
| --- | --- | --- |
| `title` | Title and Settings | yes |
| `world_map` | World Map | yes |
| `world1` | World 1 levels (also Elements Lab and Graybox) | yes |
| `boss` | Bramble King fight | yes |
| `stage_clear` | Stage Clear screen | no (jingle) |
| `game_over` | Game Over screen | no (jingle) |

Example: `public/assets/audio/music/world1.ogg` and `world1.mp3`. The whole file loops, so cut it to loop cleanly.
A missing file is fine: that track falls back to the built-in score.
