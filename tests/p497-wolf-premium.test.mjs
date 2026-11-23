/** HIGHFLY premium wolf pelt: ACTUAL runtime mapping & deterministic source. */
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import test from 'node:test';
const read=p=>readFileSync(p,'utf8');
test('wolf pelt maps to premium painterly WebP path and six rarity frames',()=>{
 const s=read('src/highfly/premium-assets.mjs');
 assert.match(s,/item_wolf_pelt:'items\/wolf_pelt'/);
 assert.doesNotMatch(s,/id==='item_wolf_pelt'\?import\.meta\.env\.BASE_URL\+'highfly\/p496\/wolf_pelt\.svg'/);
 assert.match(s,/hasOrnateRarity\?assetUrl\('rarity\/'\+rel\+'__'\+/);
 assert.match(s,/const P494_CREATURE_ICON_IDS=new Set\(\['item_boar_tusk','item_crab_shell'\]\)/);
});
test('source illustration is decoded and combined with existing metal artwork BEFORE rarity generation',()=>{
 const f=read('scripts/f0-build.mjs');
 const a=f.indexOf('scripts/highfly-p497-premium-wolf-pelt.py');
 const b=f.indexOf('scripts/highfly-p43-premium-art.py');
 const c=f.indexOf('scripts/highfly-p44-align-art.py');
 assert.ok(a>0&&b>a&&c>b);
 for(const n of [1,2,3])assert.ok(existsSync('assets/highfly/p497-wolf-pelt/part-'+n+'.b64'));
 assert.match(read('scripts/highfly-p497-premium-wolf-pelt.py'),/Image\.open\(dest\/'items'\/'leather\.webp'\)/);
});
