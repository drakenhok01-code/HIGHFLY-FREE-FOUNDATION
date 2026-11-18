# F1 — KayKit FREE lab · 18 noviembre 2026

Objetivo: reemplazar SOLO el render del personaje, sin modificar la física ni el mapa Unsung. Entrada opt-in: ?hfchar=kaykit.

## Licencia y hashes

- KayKit Character Pack Adventures FREE, autor Kay Lousberg, CC0 1.0.
- Modelo Knight.glb: revisión oficial 672074b73ba276876a19e8816ecdc5241817ab47, SHA-256 60428e3abc09ba83e595d256e3af8c5c976b46cdae599f0802fc82b4a3445168, tamaño conocido 3,659,532 bytes.
- Licencia oficial LICENSE.txt, SHA-256 ae322141814056dda0deea7540d74c41d87aee5a923629. Ambos se descargan desde el GitHub público oficial y se verifican en Actions.
- No se importan recursos SOURCE, EXTRA, privados, ni modelos ClaudeCraft.

## Implementación real en laboratorio

- src/highfly/kaykit-free-hero.mjs: Three AnimationMixer con clips FREE inspeccionados y geometrías/skinning del GLB oficial.
- Escala inicial 1.82 / 2.4374973315. El capsule radius 0.36 y las colisiones nativas quedan intactas; la escala visual aún debe probarse en Samsung.
- Idle, Walking_A, Running_A/B, Jump_Idle, Dodge_Forward, 1H_Melee_Attack_Slice_Horizontal, 1H_Melee_Attack_Chop y 1H_Melee_Attack_Slice_Diagonal.
- Las mallas de armas y escudos se ocultan para no fingir que hay un arma equipada antes de implementar el inventario real.
- Fallback al Hero original de Unsung en caso de error de carga. Material básico con textura CC0 para visibilidad inicial en WebGL móvil.

## Limitaciones sin disfraz

- Dodge_Forward es un clip de evasión, NO prueba visual de ROLL completo. La física nativa del roll sigue existiendo.
- Idle reemplaza visualmente la natación mientras se verifica si el catálogo FREE tiene clip adecuado; la física de natación de Unsung se conserva.
- No se ha validado el rendimiento Android, sombras, contacto pies/suelo, clips simultáneos ni sincronización de hit windows.
- Un build PASS no significa gameplay visual PASS. Esta rama no se despliega automáticamente a Pages, para mantener F0 estable.
