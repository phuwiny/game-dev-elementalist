"""Lay out generated illustration plates without stretching or painting over art.
The source directory is external; final PNGs are committed deliverables.
Usage: python3 tools/art/compose_phase_a_boards.py /workspace/generated_images
Pixel studies regenerate independently with build_phase_a_studies.py.
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw
from build_phase_a_studies import ART, P, BG, text, paste

SOURCES = {
 'aclaire_action_poses':'exec-16411b8d-b7d8-4566-986e-4c608d0556e8.png',
 'spirits_sheet':'exec-1a9280e3-a19e-4a00-93e7-61c103879fd3.png',
 'enemies_lineup':'exec-db038d80-d5a0-4ea2-93d5-318d1b410e63.png',
 'boss_bramble_king':'exec-44592b66-4c9d-4b4a-8cbc-7fe689d2eadf.png',
 'boss_magma_serpent':'exec-5b54a316-7746-4bec-b59f-0df73e2f638e.png',
 'boss_tempest_roc':'exec-ad0cc779-f180-4df3-a934-17da53c2b7bf.png',
 'boss_moat_hydra':'exec-a461a6a2-78b9-49c8-b5c9-b791ba4ef068.png',
 'boss_hollow_warden':'exec-f70a3339-7fa6-47d9-94e7-3b5c21aff18f.png',
 'world_w1_keyframe':'exec-35f5c082-a428-443c-8503-ec2554412dcc.png',
 'world_w2_keyframe':'exec-85140ba7-b7ee-4cbb-b324-04a7a85c248d.png',
 'world_w3_keyframe':'exec-77606a34-61bc-4008-b319-7c11e43af6f6.png',
 'world_w4_keyframe':'exec-d22364c2-40dc-47f6-b8d2-a2a52acd509b.png',
 'world_w5_keyframe':'exec-ad9bdf85-7dc6-4529-a1b6-12fbe878cea1.png',
}
RAMPS = {
 1:[10,11,12,13,14,6,29,30],2:[15,16,17,18,19,12,13,2],
 3:[15,18,19,5,20,21,22,23,3],4:[1,2,3,4,24,25,26,27,17],
 5:[1,2,3,4,5,31,12,17,22,26],
}
NOTES = {
'aclaire_action_poses':('V2 identity / sword drawn only during the 3-hit combo; empty sheath stays on back.', 'Casting poses keep the sword sheathed. Illustrative motion arcs are not final FX sprites.'),
'enemies_lineup':('10 enemy concepts / size boxes compare silhouettes with the 40 px Aclaire body.', '32x32 standard; Golemling and Sentinel 48x48; Knight 32x48. Knight has four elemental variants.'),
'boss_bramble_king':('192 x 192 target frame / fire burns vine shield to expose the heart knot.', 'Illustration only. Heart shape is a visual proposal; no new attack or animation is implemented.'),
'boss_magma_serpent':('192 x 128 target frame / water freezes lava stepping stones; water counters fire.', 'Cooled jaw vent is a proposed visual weak point. Stun timing is not a confirmed gameplay change.'),
'boss_tempest_roc':('192 x 160 target frame / reach elevated pillars with double jump and glide.', 'Breast wind core during dive recovery is a visual proposal, awaiting gameplay review.'),
'boss_moat_hydra':('128 x 128 per head / THREE heads / submerged torso belongs to bg_w4_boss_near.', 'Earth block operates drain valve; neck-base gills are a visual proposal. No new reward is specified.'),
'boss_hollow_warden':('160 x 192 target frame / four phases share FIRE, WATER, WIND and EARTH identities.', 'Water > Fire > Wind > Earth > Water. Chest seal opening is a visual proposal.'),
}

def main():
    source=Path(sys.argv[1])
    for name,file in SOURCES.items():
        raw=Image.open(source/file).convert('RGBA')
        im=Image.new('RGBA',(1920,1080),BG)
        if name=='spirits_sheet':
            # Remove only the reserved blank layout column and replace it with exact native studies.
            im.alpha_composite(raw.crop((0,0,1410,941)),(30,20))
            text(im,(1485,10),'32 x 32 PIXEL STUDIES',23,bold=True)
            for j,kind in enumerate(('burnil','wata','valvaliz','eathy')):
                y=55+j*233
                sp=Image.open(ART/f'previews/phase_a/{kind}_study.png')
                paste(im,sp,(1485,y),6);paste(im,sp,(1740,y+80))
                text(im,(1730,y+130),'1:1',17);text(im,(1515,y+195),'NEAREST x6',17)
            text(im,(50,992),'Reference-based expressions + deterministic pixel studies. Bodies <=24 px; wings / orbit stones may extend.',22)
            text(im,(50,1030),'PHASE A / Original references remain the identity authority. No production atlas or animation.',20)
        else:
            assert raw.width<=1920 and raw.height<=941
            im.alpha_composite(raw,((1920-raw.width)//2,0))
            if name.startswith('world_'):
                n=int(name[7]);ids=RAMPS[n]
                text(im,(55,954),'EXACT MASTER PALETTE / W'+str(n),20,bold=True)
                for j,c in enumerate(ids):
                    x=55+j*181;ImageDraw.Draw(im).rectangle((x,990,x+155,1018),fill=P[c])
                    text(im,(x,1025),P[c],19)
            else:
                a,b=NOTES[name];text(im,(60,965),a,23,bold=True);text(im,(60,1010),b,21)
        im.save(ART/f'concept/{name}.png')

if __name__=='__main__':main()
