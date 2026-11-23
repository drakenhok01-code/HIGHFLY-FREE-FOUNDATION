import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GRAPHICS, installHighflyGraphics } from '../src/highfly/visual-profile.mjs';

function harness(query = '', saved = null) {
  const values = {
    preset: 'medium', renderScale: .63, targetFps: 50,
    shadows: true, shadowRate: 2, softShadows: 1,
    volumetrics: true, reflections: false, cover: .75,
    clouds: 1, cloudRes: 1024, fov: 60, music: .65,
  };
  const storage = {
    stored: saved, writes: [],
    getItem() { return this.stored; },
    setItem(k, v) { this.stored = v; this.writes.push([k, v]); },
  };
  const pipe = {
    ao: { enabled: true },
    taa: { reset: false },
    tonemap: { uniforms: { uSharpen: { value: .1 } } },
    bloomStrength: .1,
    scene: { name: 'original-world' }, renderer: { name: 'original-renderer' },
  };
  const scene = pipe.scene, renderer = pipe.renderer;
  const installed = installHighflyGraphics(pipe, { values }, query, storage);
  return { values, storage, pipe, installed, scene, renderer };
}

test('balanced profile improves native foliage detail and keeps actual Unsung renderer/scene', () => {
  const h = harness();
  assert.equal(h.installed.selected, 'balanced');
  assert.equal(h.values.renderScale, 1);
  assert.equal(h.values.cover, 1);
  assert.equal(h.values.shadows, true);
  assert.equal(h.values.reflections, false);
  assert.equal(h.values.targetFps, 55);
  assert.equal(h.installed.minRenderScale, .75);
  assert.equal(h.pipe.scene, h.scene);
  assert.equal(h.pipe.renderer, h.renderer);
  assert.equal(h.pipe.ao.enabled, false);
  assert.equal(h.values.fov, 60);
  assert.equal(h.values.music, .65);
});

test('quality uses only existing shadow, foliage, cloud and reflection switches', () => {
  const h = harness('?hfquality=quality');
  assert.equal(h.values.softShadows, 2);
  assert.equal(h.values.reflections, true);
  assert.equal(h.values.cloudRes, 2048);
  assert.equal(h.values.cover, 1);
  assert.equal(h.values.renderScale, 1);
  assert.equal(h.installed.minRenderScale, .80);
  assert.equal(h.values.targetFps, 50);
  assert.equal(h.pipe.ao.enabled, false);
});

test('native legacy comparison and runtime switching restore baseline visuals', () => {
  const h = harness('?hfquality=legacy');
  assert.equal(h.values.cover, .75);
  assert.equal(h.values.reflections, false);
  assert.equal(h.values.renderScale, 1);
  assert.equal(h.values.preset, 'medium');
  assert.equal(h.installed.minRenderScale, .88);
  assert.equal(h.installed.set('quality'), true);
  assert.equal(h.values.reflections, true);
  assert.equal(h.installed.set('legacy'), true);
  assert.equal(h.values.reflections, false);
  assert.equal(h.values.cloudRes, 1024);
  assert.equal(h.values.cover, .75);
  assert.equal(h.values.preset, 'medium');
  assert.equal(h.storage.stored, 'legacy');
});

test('invalid query safely falls back; saved mode and optional storage handled', () => {
  const h = harness('?hfquality=fantasy', 'quality');
  assert.equal(h.installed.selected, 'balanced');
  assert.equal(h.installed.set('broken'), false);
  assert.equal(h.installed.selected, 'balanced');
  const saved = harness('', 'quality');
  assert.equal(saved.installed.selected, 'quality');
  assert.equal(saved.values.reflections, true);
  assert.ok(Object.isFrozen(GRAPHICS));
});

test('only native quality governor is tuned: original world geometry remains source-pinned', () => {
  const build = fs.readFileSync('scripts/f0-build.mjs', 'utf8');
  const source = fs.readFileSync('src/highfly/visual-profile.mjs', 'utf8');
  const cfg = JSON.parse(fs.readFileSync('foundation.config.json', 'utf8'));
  assert.equal(cfg.unsungCommit, '9f61b0d80b18c6cf661f72372545b3f9214fb455');
  assert.match(build, /window\.__hfGraphics\?\.minRenderScale/);
  assert.match(build, /const allowed=new Set\(\['index\.html'/);
  assert.equal((build.match(/patch\('src\/world\/terrain\.js'/g) || []).length, 3);
  assert.doesNotMatch(source, /new THREE\.(Scene|WebGLRenderer|Mesh)\(/);
  assert.doesNotMatch(source, /createElement\(['"]canvas/);
});
