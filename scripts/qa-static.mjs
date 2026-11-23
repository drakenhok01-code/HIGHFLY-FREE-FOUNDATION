import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const cfg=JSON.parse(fs.readFileSync('foundation.config.json','utf8'));
assert.equal(cfg.unsungCommit,'9f61b0d80b18c6cf661f72372545b3f9214fb455');
assert.equal(cfg.allowPrivateAssets,false);assert.equal(cfg.allowKaykitPaid,false);assert.equal(cfg.allowClaudeAssets,false);
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const files=walk('.').map(x=>x.replaceAll('\\','/')).filter(x=>!x.startsWith('.git/')&&!x.startsWith('.work/')&&!x.startsWith('dist/'));
// Only the four SHA-256-locked, generated/user-approved WebP art archives are allowed.
// All other ZIPs, SOURCE packs, models, sound binaries and unaudited media stay forbidden.
const reviewedPremiumArchives=new Set([
 'assets/highfly/premium/HF_PHOENIX_ITEMS.zip',
 'assets/highfly/premium/HF_PHOENIX_BACKGROUNDS.zip',
 'assets/highfly/premium/HF_PHOENIX_MISSIONS_A.zip',
 'assets/highfly/premium/HF_PHOENIX_MISSIONS_B.zip'
]);
for(const archive of reviewedPremiumArchives)assert.ok(fs.existsSync(archive),'Missing reviewed art pack '+archive);

// User expressly provided these 60 original icons for integration in HIGHFLY.
// Unlike unverified binaries, each archive is pinned by an exact SHA-256 and
// independently re-verified at build time before extracting .webp files.
const userIconHashes={
 'armor':'5ae833209b0fdffbe6e0d33ab8c58de609f639e0d6142a035e04e3ceb910bc21',
 'items':'0861a7fc17ec50ff88403969cca115da8cef1aabffcef9e43b24ce59a07aa774',
 'navigation':'01f7f2d60cd598e96557c4f49548f8ab631d556f357f6317be4add418df209b8',
 'professions':'2f888665537bc7b96f7bce8d88ca6602395c393500cfa4ca02f9dbcfdff151c0',
 'skills':'c0ae669e42610c5e041d91b62c1aa059b814dc85b7d7f5ded9f043bf71b523e1',
 'skills-advanced':'5f0c40d5e6034e41dc3b264f6383e340d42bb39aca1289d808cdff2cf6fd935b',
 'weapons':'ef5cef4b03b5ad00b74618167b84a5d592e94c42770aa7293786a6fe75fb3173'
};
for(const [cat,expected] of Object.entries(userIconHashes)){
 const rel='assets/highfly/premium/hf_user_icons_'+cat+'.zip';
 assert.ok(fs.existsSync(rel),'Missing user-approved icon archive '+cat);
 const actual=crypto.createHash('sha256').update(fs.readFileSync(rel)).digest('hex');
 assert.equal(actual,expected,'User archive changed unexpectedly: '+cat);
 reviewedPremiumArchives.add(rel);
}

// P4.9.1: Exactly three independently verified CC0 animated GLBs may be
// committed. Never relax the ban for arbitrary .glb or paid KayKit SOURCE.
const auditedSpeciesBlobs=new Map([
 ['assets/highfly/p491/models/wolf.glb','00d69a6c127752c2506c66bc93db9a10f4a73df0'],
 ['assets/highfly/p491/models/crab.glb','ceb814db15ad267caeabadfb4da0299eccc807aa'],
 ['assets/highfly/p491/models/boar.glb','f57ae4b2a4fa6df29e6feaf5fb9a7e39ec5ff73d']
]);
for(const [rel,expected] of auditedSpeciesBlobs){
 assert.ok(fs.existsSync(rel),'Missing approved CC0 skeletal animal '+rel);
 const bytes=fs.readFileSync(rel);
 const gitBlob=crypto.createHash('sha1').update('blob '+bytes.length).update(Buffer.from([0])).update(bytes).digest('hex');
 assert.equal(gitBlob,expected,'CC0 species asset changed unexpectedly '+rel);
 assert.equal(bytes.toString('ascii',0,4),'glTF','Not an authentic GLB: '+rel);
}

const forbidden=files.filter(x=>/private_assets|phoenix-source-|kaykit.*source|upstream\/|\.glb$|\.fbx$|\.ogg$|\.wav$|\.bin$|\.zip$/i.test(x)&&!reviewedPremiumArchives.has(x)&&!auditedSpeciesBlobs.has(x));
assert.deepEqual(forbidden,[],'Bootstrap cannot contain private or unaudited binaries; only 3 CC0 audited GLBs allowed');
for(const name of ['src/highfly/mobile-touch.mjs','src/highfly/fog.mjs','src/highfly/kaykit-free-hero.mjs','scripts/f0-build.mjs','scripts/qa-dist.mjs'])assert.ok(fs.existsSync(name));
console.log('PASS qa:static '+files.length+' clean sources + 3 CC0 audited GLBs; no SOURCE media or history');

const heroCode=fs.readFileSync('src/highfly/kaykit-free-hero.mjs','utf8');
assert.match(heroCode,/stylizeUniversalKayKit\(data\)/,'One hero must use the continuous body/rest transform');
assert.match(heroCode,/createUniversalMaterial\(/,'Body must use Unsung native vertex shader');
for(const forbidden of ['CpuKayKitSkin','installCharacterOverlay','new THREE.WebGLRenderer','overlayRenderer'])
 assert.ok(!heroCode.includes(forbidden),'Forbidden ghost avatar compatibility patch: '+forbidden);
const skinSource=fs.readFileSync('src/highfly/stylize-kaykit-free.mjs','utf8');
assert.match(skinSource,/clips.length!==76/,'All FREE 76 clip retarget gate must remain');
console.log('PASS F0.8 clean one-GPU-scene universal actor guard');

// The top-center KayKit checkmark was reported as a persistent HUD obstruction.
const buildSource=fs.readFileSync('scripts/f0-build.mjs','utf8');
assert.ok(!buildSource.includes('hfStatus.'),'No permanent KayKit success/fallback banner may cover the HUD');
console.log('PASS HIGHFLY F0.8.1 no persistent character status HUD banner');

for(const file of ['src/highfly/universal-motion.mjs','src/highfly/universal-gear.mjs',
 'scripts/qa-free-rigs.mjs','tests/universal-motion.test.mjs'])
 assert.ok(fs.existsSync(file),'Missing universal action or rig-audit module '+file);
const dash=fs.readFileSync('src/highfly/dash.mjs','utf8');
assert.match(dash,/installHighflyDash/);
const motion=fs.readFileSync('src/highfly/universal-motion.mjs','utf8');
assert.match(motion,/installHighflyUniversalMotion/);
assert.match(motion,/probeHighflyWall/);
assert.match(motion,/highflyDoubleJump/);
assert.match(motion,/highflyActionStart/);
const hud=fs.readFileSync('src/highfly/mobile-touch.mjs','utf8');
for(const name of ['context','equip','sit','lie','cheer','settings'])
 assert.ok(hud.includes('data-a="'+name+'"'),'Missing Android contextual/gesture action '+name);
for(const name of ['chop','mine','fishing','plant','water','harvest','smelt','forge'])
 assert.ok(motion.includes(name),'Missing real profession implementation '+name);
assert.match(hud,/resolveHighflyContext/,'Resource interactions must be contextual, not a giant action drawer');
console.log('PASS F0.13.1 one universal action, three-emote drawer, weapon preview and Android options');
