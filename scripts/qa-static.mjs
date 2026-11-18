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
