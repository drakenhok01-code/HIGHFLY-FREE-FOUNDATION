# HIGHFLY — Matriz de reutilización y compatibilidad con personaje KayKit único

**Contrato objetivo** (no implementación completa): `playerId` estable, `Rig_Medium` canónico, sin clases, sin party; atributos propios HP/MANA/ENERGIA; habilidades desbloqueables por aprendizaje; arma, secundaria, cabeza, torso, manos, piernas y pies como slots; guardar/cargar independiente de visuales.

| Fuente | Material real verificado | Aplicable a HIGHFLY | Pendiente para persona única |
|---|---|---|---|
| Unsung Vale (MIT) | Player/capsule, 8 direcciones, cámara relativa, sprint, salto, ROLL 0.62s, combo 1-2-3, ataques pesados, `_swim` flotación; 129 audios CC0/CC-BY | Mundo/colisiones/código físico | natación animada, escalada, equipamiento |
| KayKit Adventures FREE CC0 | 5 personajes GLB, 27 modelos GLTF, Knight 76 clips, mano derecha `handslot.r`, espada CC0 | Personaje Knight, poses 1H, ROLL temporal, DASH visual | QA Samsung y adaptación de cada arma |
| Complete KayKit SOURCE v7 | Inventario privado previo: 28.667 archivos en 23 packs, 4.383 GLTF, 109 GLB, 48 armas Fantasy Weapons; 16 bundles GLB de Character Animations 1.1 | Consultar catálogo privado local, futura integración privada | Sin bytes SOURCE en este repo; clip interno/retarget por verificar |
| Emberfall (código MIT) | `src/actors.js` ActorSystem con máscara de torso y piernas, 76 clips por personaje; `public/assets/models-v6/manifest-v6.json` Knight/Rogue/Mage redondeados con hashes y bones; 3 armas elementales GLB en manifest-v3; audio sintético documentado | Estudiar e implementar mezcla móvil/casteo/armas desde código permitido | Auditar cada recurso antes de importarlo y QA Android |
| ClaudeCraft | MIT code, numerosos assets de licencias específicas distintas, editor/NPC/combat/assets | Diseño/sistemas y estudio | No importar media `With the project only`, NC, ni desconocida |
| Felix WFC / Guildhall / Superhex / Tianjie | prototipos previos de terreno/cámara/movimiento, fuente no comprobada actualmente | ideas técnicas | completar inventario y QA por motor; no copiar por presunción |

## 14 familias de movimientos y su condición
| Acción | KayKit Knight FREE confirmado | Física HIGHFLY |
|---|---|---|
| caminar, atrás, lateral, correr | Walking_A/B/C, Walking_Backwards, Running_A/B, Running_Strafe_Left/Right | Sí, movimiento y cámara relativa |
| salto, aterrizaje | Jump_Start/Idle/Land, Jump_Full_Short/Long | Salto simple, no doble salto |
| ROLL/esquiva | Dodge_Forward/Backward/Left/Right | Original Unsung i-frames; visual provisional |
| DASH multidireccional | Dodge_Forward provisional | F0.3 impulso .24s, cooldown .78s, i-frames breves |
| espada ligera | 1H_Melee_Attack_Chop/Slice/Horizontal/Stab | Combo 1-2-3 con daño base original |
| arma pesada y doble empuñadura | 2H_Melee* / Dualwield* | clips existen, equipo/hitbox pendiente |
| disparar | 1H/2H_Ranged* | clip existe, sin arco/proyectil equipado |
| magia y lanzamiento | Spellcast_Long/Raise/Shoot/Spellcasting | clip existe, skills aún pendientes |
| bloquear y daño | Block, Blocking, Block_Attack, Block_Hit, Hit_A/B | parcial |
| recoger/interactuar | PickUp, Interact, Use_Item, Throw | clips existen, falta sistema |
| sentarse/levantarse | Sit_Chair*, Sit_Floor*, Lie* | clips existen, sin silla física |
| danza/emotes | Cheer, Unarmed* | solo clips |
| nadar/bucear | NO hay nado animado entre los 76 Knight | flotar/avanzar en agua, no brazadas |
| trepar/escalar/parkour | NO hay clips validados en Knight | no implementado |

**Reglas de trazabilidad:** cada acción y equipo obtiene `source/commit/path/license/hash/rig/socket/clip/physics/status/qa_android`. No se cruza SOURCE privado al repositorio público.
