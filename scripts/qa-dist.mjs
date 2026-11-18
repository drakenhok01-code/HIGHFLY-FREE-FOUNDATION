import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root='dist';
assert.ok(fs.existsSync(path.join(root,'index.html')),'Unsung Vite HTML not found');
const prov=JSON.parse(fs.readFileSync(path.join(root,'BUILD_PROVENANCE.json'),'utf8'));
assert.equal(prov.originalUnsungCommit,'9f61b0d80b18c6cf661f72372545b3f9214fb455');
assert.match(fs.readFileSync(path.join(root,'index.html'),'utf8'),/\/HIGHFLY-FREE-FOUNDATION\//);
const m=JSON.parse(fs.readFileSync(path.join(root,'ASSET_MANIFEST.json'),'utf8'));
const groups={};assert.equal(m.records.length,137,'134 baseline + 2 Emberfall + 1 Quaternius extracted retarget');
for(const a of m.records){
 assert.equal(a.decision,'ALLOW');
 const f=path.join(root,a.path);assert.ok(fs.existsSync(f),'Missing asset '+a.path);
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'),a.sha256,'Unexpected file hash '+a.path);
 const commit=a.id.startsWith('quaternius-ual:')?'bb2ce469f0ab2ccfc487faef55550ba07fae2483':
 a.id.startsWith('emberfall-original:')?'5d199ab4888e428b0dab80528a37ab8ac0107360':
 (a.id==='kaykit-free:Knight.glb'?prov.kaykitCommit:prov.originalUnsungCommit);
 assert.ok(a.source.includes(commit));groups[a.license]=(groups[a.license]||0)+1;
}
assert.equal(groups['CC-BY-4.0'],62);assert.equal(groups['CC0-1.0'],69);
assert.equal(groups['MIT (original Unsung)'],4);
assert.equal(groups['MIT (Emberfall original geometry)'],2);
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
for(const f of walk(root)){
 assert.ok(!/private_assets|phoenix-source|kaykit.*source|\.fbx$|\.zip$/i.test(f),'Restricted file '+f);
 if(/\.(js|css|html|json)$/.test(f))assert.ok(!/phoenix-source-stage|HIGHFLY_CI_MOCK_SOURCE|private_assets\//i.test(fs.readFileSync(f,'utf8')),'Private dependency '+f);
}
assert.ok(fs.existsSync(path.join(root,'CREDITS_UNSUNG.md')));
assert.ok(fs.existsSync(path.join(root,'LICENSES','UNSUNG-MIT.txt')));
assert.ok(fs.existsSync(path.join(root,'LICENSES','KAYKIT-ADVENTURERS-CC0.txt')));
assert.ok(fs.existsSync(path.join(root,'LICENSES','EMBERFALL-MIT.txt')));
assert.ok(fs.existsSync(path.join(root,'LICENSES','QUATERNIUS-UAL-CC0.txt')));
const free=JSON.parse(fs.readFileSync(path.join(root,'catalogo-free.json'),'utf8'));
assert.equal(free.assets.length,32,'Official FREE index must remain pinned to 32 model sources');
assert.ok(free.assets.every(x=>x.source.includes(free.commit)),'Unpinned model in official FREE index');
assert.ok(fs.readFileSync(path.join(root,'catalogo.html'),'utf8').includes('HIGHFLY'),'Missing FREE catalog web page');
console.log('PASS qa:dist '+JSON.stringify(groups)+' 32 public KayKit index entries');
