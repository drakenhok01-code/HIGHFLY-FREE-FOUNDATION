/**
 * HIGHFLY P5.0.6 — elevanted lake -> waterfall lip continuity.
 *
 * Adds a small channel to the SAME batched waterfall geometry before upload.
 * Zero per-frame work, zero draw calls, no terrain/water/graphics settings changed.
 * Source lake discs have radius pool.r + 10; fall lip starts at s - 1.5.
 * A four-metre overlap is hidden under the lake surface by normal depth.
 */
export function appendP506PoolOutflow(pool, spillDistance, positions, info, indices, width = 13) {
  if (!pool || !Number.isFinite(spillDistance) || !Number.isFinite(width) || width <= 0) return { joined: false, reason: 'invalid' };
  const length = Math.hypot(pool.out?.[0] ?? 0, pool.out?.[1] ?? 0);
  if (!(length > 0) || !Number.isFinite(pool.r) || !Number.isFinite(pool.level)) return { joined: false, reason: 'invalid' };
  const dx = pool.out[0], dz = pool.out[1]; // match native Unsung's literal outflow vector exactly
  const start = pool.r + 6;        // 4m overlap within native pool.r + 10 water disc
  const end = spillDistance - 1.5; // exact lip used by native Unsung addFall()
  const gap = end - start;
  if (!(gap > 0.2)) return { joined: false, reason: 'already-overlapped' };
  if (gap > 155) return { joined: false, reason: 'implausible-distance' };
  const segments = Math.max(2, Math.min(64, Math.ceil(gap / 2.5)));
  const base = positions.length / 3;
  const acrossX = -dz, acrossZ = dx;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments, d = start + gap * t;
    const x = pool.x + dx * (d + 0.4), z = pool.z + dz * (d + 0.4);
    const y = pool.level - 0.06 - 0.44 * t;
    const halfWidth = width * (0.35 + 0.15 * t);
    positions.push(x - acrossX * halfWidth, y, z - acrossZ * halfWidth,
                   x + acrossX * halfWidth, y, z + acrossZ * halfWidth);
    const along = gap * t;
    info.push(-1, along, gap + 5, 1, along, gap + 5);
    if (i < segments) {
      const a = base + i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  return { joined: true, segments, gapMeters: gap, start, end };
}
