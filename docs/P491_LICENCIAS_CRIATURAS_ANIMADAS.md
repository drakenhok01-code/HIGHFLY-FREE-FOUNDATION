# HIGHFLY P4.9.1 — Animales reales, licencia verificada y reutilización responsable

Esta versión elimina **todas** las representaciones falsas de cangrejo, lobo y jabalí (SphereGeometry / ConeGeometry / CylinderGeometry). Se cargan tres GLB con esqueleto real mediante GLTFLoader, clonados mediante SkeletonUtils.clone, y sus acciones reales se reproducen con AnimationMixer. El motor original MIT de Unsung sigue siendo dueño de detección, colisiones, IA, HP, daño, perseguir, retorno, muerte y eventos. Las misiones HIGHFLY y el loot físico P4.9 quedan acoplados a esos eventos, sin copiar medios de ClaudeCraft con permiso restringido.

## Catálogo de 3 GLB reutilizables

| Criatura | ID HIGHFLY | Nombre GLB | Origen tercero verificado | Licencia | Clips confirmados | Git blob SHA-1 |
|---|---|---|---|---|---|---|
| Lobo | hf_wolf | wolf.glb | [Quaternius animated creatures](https://quaternius.com) conservado en [World of ClaudeCraft v0.45.8](https://github.com/levy-street/world-of-claudecraft/blob/v0.45.8/public/models/creatures/wolf.glb); origen identificable en `scripts/assets/specs/characters.json` de WOC, `Wolf.glb` del pack Quaternius | CC0 1.0 histórico | 12: Attack, Death, Eating, Gallop, Gallop_Jump, Idle_HitReact_Left/Right, Jump_ToIdle, Walk, Idle_2_HeadLow, Idle_2, Idle | `00d69a6c127752c2506c66bc93db9a10f4a73df0` |
| Cangrejo | hf_crab | crabenemy.glb | [Quaternius animated creatures](https://quaternius.com); fuente reconocida como `quaternius_creatures/CrabEnemy.glb` en `scripts/assets/specs/characters.json` de WOC | CC0 1.0 histórico | 10: Bite_Front, Bite_InPlace, Dance, Death, HitRecieve, Idle, Jump, No, Walk, Yes | `ceb814db15ad267caeabadfb4da0299eccc807aa` |
| Jabalí | hf_boar | gobkit_Boar.glb | [Gobkit Animal Pack B](https://gobkit.itch.io/gobkit-free-animal-pack-vol-2); [espejo que documenta el mismo origen](https://github.com/zttimmerman/project-whiskeyjack/blob/main/assets/briefs/gobkit_Boar.yaml) | CC0 1.0 | 4: idle, walk, attack, dead | `f57ae4b2a4fa6df29e6feaf5fb9a7e39ec5ff73d` |

El build rechaza **cualquier archivo** cuyo blob SHA difiera. El validador estático sigue bloqueando todos los modelos, ZIP y medios no auditados, con una excepción explícita para estos tres GLB de CC0. Los modelos Quaternius son de material histórico CC0; la [QAL publicada el 28/08/2026](https://quaternius.com/license.html) se aplica a nuevas publicaciones bajo esa licencia y no es una autorización automática para reempaquetar materiales de licencia desconocida.

**No se importan** los modelos modificados `wolf_basic.glb`, `wild_boar.glb` (sin aprobación específica), `greyjaw.glb`, sonidos de ClaudeCraft o KayKit SOURCE de pago. El sonido `mob_*` de World of ClaudeCraft es CC BY-NC 4.0 con subvención comercial solo para ClaudeCraft, por lo que no se incorpora a HIGHFLY.

## Qué reutilizamos en lugar de inventar otro RPG

**ClaudeCraft 0.45.8 — sistema analizado:**
- `src/sim/content/zone1.ts`: `forest_wolf` (nivel 1–2, agro 10, 45% de colmillo; 1.7% de botas y 0.3% de bolsa), `wild_boar` (nivel 2–3, agro 9, espinas 2, 60% de cuero, 30% de comida y 2% de pantalón). Son referencias para futura economía HIGHFLY, **no se han importado como ítems nuevos no aprobados**.
- `src/sim/content/world_quest_zone_hunts.ts`: la misión local consulta los enemigos que el mundo **ya tiene**, no crea monstruos falsos para cada misión.
- `src/sim/respawn_policy.ts`: los camps se equilibran frente a la velocidad de abatimiento y se controla la reaparición.
- `src/game/corpse_loot_availability.ts`: el botín es una instancia recuperable separada de la muerte y del progreso de misión.

**HIGHFLY en P4.9.1:**
- Los tres enemigos son **modelos 3D reales con mallas, huesos y animaciones**.
- La capa Unsung conserva golpes, daño, agro/chasquidos, persecución y retorno al spot. No se portó el motor MMO servidor-autoritativo de ClaudeCraft.
- Las cacerías solo aparecen al acercarse (hasta 3 por spot y hasta 9 en total), se despawnean fuera de 165 m y se reponen después de ~23 s.
- El loot es el actual de HIGHFLY: piel de lobo, colmillo de jabalí, caparazón de cangrejo, caída física recogible con USAR y Bolsa. **No** se trasladaron las tablas avanzadas del MMO ni las monedas; requerirían integrar y aprobar IDs, iconos, fabricación, niveles y economía.
- Las misiones cuentan kills aunque el monstruo también aparezca en mundo abierto. Solo se puede cobrar una vez por misión.
- El modelo Gobkit es de autor distinto al de ClaudeCraft: no se copia el `wild_boar.glb` del MMO ni el modelo de RPG Builder (licencia de software/Assets Store distinta).

## Estado y verificación

- Modelo fuente validado a nivel binario: GLB v2, skin, bones, clips, SHA, extensión meshopt para los dos Quaternius.
- En ejecución: `GLTFLoader` + `MeshoptDecoder` + `SkeletonUtils.clone` + `AnimationMixer` con transición idle/walk/run/attack/hurt/death.
- GitHub Actions debe pasar pruebas unitarias, compilación Vite, QA del menú y publicación de `/preview-p491/`. **La prueba del mundo 3D completo sobre Samsung todavía necesita una revisión de usuario; no se afirma validada por QA estática.**

## Próximos controles en teléfono

Probar que se vean como animales y no como piedras/geometría; caminar/agro, persecución, golpe, muerte, caída física y reaparición; contador de misiones y Bolsa; FPS en Samsung S23 Ultra horizontal. La versión principal y P4.8.2 quedan resguardadas.
