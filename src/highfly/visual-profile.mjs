/**
 * HIGHFLY P4.9.7 — native Unsung graphics tuning, not an overlay renderer.
 *
 * The terrain heightfields, world geometry, collisions, actors and loot are untouched.
 * Uses only existing Unsung Settings/three.js pipeline switches. SSAO remains disabled
 * because the half-resolution pass produced streaks in earlier Android reviews.
 *
 * ?hfquality=legacy|performance|balanced|quality allows a reversible A/B check.
 * "legacy" restores the settings captured before this module changed anything.
 */
export const GRAPHICS = Object.freeze({
  // Fixed internal 3D resolution: measure physical pixels without governor
  // silently reducing the scene during motion. Recommended for ?hfpx=native.
  android: Object.freeze({
    renderScale: 1, minRenderScale: 1, targetFps: 0, sharpen: .60,
    shadows: true, shadowRate: 2, softShadows: 1,
    volumetrics: true, reflections: false, cover: 1,
    clouds: 1, cloudRes: 1024,
  }),
  legacy: Object.freeze({
    renderScale: 1, minRenderScale: .88, targetFps: 48, sharpen: .65,
  }),
  performance: Object.freeze({
    renderScale: .88, minRenderScale: .65, targetFps: 60, sharpen: .55,
    shadows: true, shadowRate: 2, softShadows: 1,
    volumetrics: true, reflections: false, cover: .78,
    clouds: 1, cloudRes: 1024,
  }),
  balanced: Object.freeze({
    renderScale: 1, minRenderScale: .75, targetFps: 55, sharpen: .52,
    shadows: true, shadowRate: 2, softShadows: 1,
    volumetrics: true, reflections: false, cover: 1,
    clouds: 1, cloudRes: 1024,
  }),
  quality: Object.freeze({
    renderScale: 1, minRenderScale: .80, targetFps: 50, sharpen: .48,
    shadows: true, shadowRate: 1, softShadows: 2,
    volumetrics: true, reflections: true, cover: 1,
    clouds: 1, cloudRes: 2048,
  }),
});

const NATIVE_KEYS = [
  'preset', 'renderScale', 'targetFps', 'shadows', 'shadowRate',
  'softShadows', 'volumetrics', 'reflections', 'cover', 'clouds', 'cloudRes',
];
const PRESET_KEYS = NATIVE_KEYS.filter(k => k !== 'preset');

export function installHighflyGraphics(pipe, settings, search = '', storage = globalThis.localStorage) {
  const query = new URLSearchParams(search);
  const baseline = Object.fromEntries(NATIVE_KEYS.map(k => [k, settings.values[k]]));
  let saved = null;
  try { saved = storage?.getItem('highfly-graphics-profile-v1'); } catch {}
  const requested = query.get('hfquality') || saved || 'balanced';
  let selected = Object.hasOwn(GRAPHICS, requested) ? requested : 'balanced';

  const apply = (mode, persist = false) => {
    if (!Object.hasOwn(GRAPHICS, mode)) return false;
    const spec = GRAPHICS[mode];
    // Reset first: changing back to legacy must truly restore the old visuals.
    for (const k of NATIVE_KEYS) settings.values[k] = baseline[k];
    for (const k of PRESET_KEYS) {
      if (Object.hasOwn(spec, k)) settings.values[k] = spec[k];
    }
    if (mode !== 'legacy') settings.values.preset = 'custom';

    // Native depth-aware TAA and AgX tonemap. No second scene, canvas or overlay.
    // The governor may later adjust sharpening when it changes render resolution.
    if (pipe.ao) pipe.ao.enabled = false;
    if (pipe.tonemap?.uniforms?.uSharpen) pipe.tonemap.uniforms.uSharpen.value = spec.sharpen;
    if (pipe.taa) pipe.taa.reset = true;
    if (pipe.bloomStrength !== undefined) pipe.bloomStrength = .065;
    selected = mode;
    if (persist) {
      try { storage?.setItem('highfly-graphics-profile-v1', mode); } catch {}
    }
    return true;
  };

  apply(selected);
  return {
    get selected() { return selected; },
    get minRenderScale() { return GRAPHICS[selected].minRenderScale; },
    profiles: GRAPHICS,
    set: mode => apply(mode, true),
  };
}
