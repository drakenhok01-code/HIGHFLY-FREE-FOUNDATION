import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const cfg=JSON.parse(fs.readFileSync('foundation.config.json','utf8'));
assert.equal(cfg.unsungCommit,'9f61b0d80b18c6cf661f72372545b3f9214fb455');
assert.equal(cfg.allowPrivateAssets,false);assert.equal(cfg.allowKaykitPaid,false);assert.equal(cfg.allowClaudeAssets,false);
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const files=walk('.').map(x=>x.replaceAll('\\','/')).filter(x=>!x.startsWith('.git/')&&!x.startsWith('.work/')&&!x.startsWith('dist/'));
const forbidden=files.filter(x=>/private_assets|phoenix-source-|kaykit.*source|upstream\/|\.glb$|\.fbx$|\.ogg$|\.wav$|\.bin$|\.zip$/i.test(x));
assert.deepEqual(forbidden,[],'Bootstrap cannot contain private or unaudited binaries');
for(const name of ['src/highfly/mobile-touch.mjs','src/highfly/fog.mjs','src/highfly/kaykit-free-hero.mjs','scripts/f0-build.mjs','scripts/qa-dist.mjs'])assert.ok(fs.existsSync(name));
console.log('PASS qa:static '+files.length+' clean source-only files; no SOURCE media or history');

const heroCode=fs.readFileSync('src/highfly/kaykit-free-hero.mjs','utf8');
assert.match(heroCode,/stylizeUniversalKayKit\(data\)/,'One hero must use the continuous body/rest transform');
assert.match(heroCode,/createUniversalMaterial\(/,'Body must use Unsung native vertex shader');
for(const forbidden of ['CpuKayKitSkin','installCharacterOverlay','new THREE.WebGLRenderer','overlayRenderer'])
 assert.ok(!heroCode.includes(forbidden),'Forbidden ghost avatar compatibility patch: '+forbidden);
const skinSource=fs.readFileSync('src/highfly/stylize-kaykit-free.mjs','utf8');
assert.match(skinSource,/clips.length!==76/,'All FREE 76 clip retarget gate must remain');
console.log('PASS F0.8 clean one-GPU-scene universal actor guard');
