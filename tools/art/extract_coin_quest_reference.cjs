/* Read-only Coin Quest extraction. Writes evidence only inside this project. */
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = process.argv[2] || 'D:/nilworkspaces/tqm-proj/boss-game';
const context = {};
vm.createContext(context);
for (const file of ['2026-10-15_character-art.js', '2026-10-22_aclaire-walk.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'js', file), 'utf8'), context);
}
const a = context.CQ.CharacterArt;
const result = {w:a.w,h:a.h,density:a.density,palette:a.palette,frame:a.frames.aclaire.idle};
fs.writeFileSync(path.join(__dirname,'../../art/previews/phase_a/2026-10-23_cq_idle_data.json'),JSON.stringify(result)+'\n');
console.log(JSON.stringify({w:a.w,h:a.h,ax:a.ax,density:a.density,version:a.version,paletteEntries:a.palette.length}));
