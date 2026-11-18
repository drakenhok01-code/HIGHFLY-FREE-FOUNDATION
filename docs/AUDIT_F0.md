# F0: auditoría inicial documentada — 2026-11-18

## Unsung original congelado

Repositorio: \`Leonxlnx/unsung-vale\` commit \`9f61b0d80b18c6cf661f72372545b3f9214fb455\`. Git tree comprobado: 239 blobs y ~41.8 MB de datos. Mundo y mapa autoritativos en \`src/world/{terrain,layout,water,waterfalls,arch,flora,rocks,boats,dressing,...}\` y \`public/world/{core_h.bin,region_h.bin,world.json}\`. F0 NO modifica la geometría ni la física.

Código MIT (copyright de colaboradores). Su licencia excluye explícitamente \`public/audio\`: 129 OGG enumerados en \`CREDITS.md\`, **62 CC BY 4.0 y 67 CC0**. Al compilar se revisan créditos y SHA-256 de cada binario. Fuente nativa: \`src/game/player.js\`: caminar, correr, sprint, salto en suelo, esquiva rodada con invulnerabilidad de 0.06–0.44s durante roll 0.62s, natación/flotación y ataque aéreo en picada. Combo 1→2→3 verdadero (18/21/36 daño nominal antes de modificadores). La habilidad llamada \`dash\` en Unsung es ataque giratorio al esprintar, NO el dash independiente solicitado para HIGHFLY. **Doble salto ausente de la física original.**

## KayKit FREE y Emberfall

KayKit FREE oficial Adventurers, licencia CC0. Candidato de jugador \`Knight.glb\` ~3.66 MB, 76 clips según manifiesto de inspección de Emberfall, \`handslot.l\`/\`handslot.r\`, altura visual 2.4375 unidades. Clips reales incluyen \`Idle\`, \`Walking_A\`, \`Running_A\`, \`Jump_Start\`, \`Jump_Land\`, esquivas \`Dodge_Forward/Backward/Left/Right\`, \`1H_Melee_Attack_*\`. Son clips, **no garantizan** física, sincronización de daños ni retargeting. También existe \`sword_1handed.gltf\` y su \`.bin\` en el pack CC0; aún sin equipamiento funcional.

Emberfall \`src/skill-effects.js\` contiene VFX geométricos para fuego/rayo/agua y \`src/audio.js\` invoca \`skill-fire/lightning/water.wav\`. \`docs/art-assets.md\` declara sonidos sintetizados por \`tools/generate_audio.py\`; los medios individuales deben confirmar autoría, hash y términos antes de incluirse. Su código original tiene licencia MIT; aún NO integrado.

## ClaudeCraft y HIGHFLY privado

\`levy-street/world-of-claudecraft/LICENSE\` autoriza código MIT; su propio \`CREDITS.md\` dice que la licencia MIT **no** se extiende a medios. BLOQUEADOS: \`No, permission required\`, \`With the project only\` (no trasladar sin permiso), CC BY-NC, iconos premium CraftPix, marcas y archivos sin registro. El repositorio privado \`HIGHFLY-UNSUNG-ANDROID\` tiene scripts que empaquetan KayKit SOURCE; NO se copia su historial, build o modelos. Su aprendizaje útil: evitar rotación duplicada del ROLL y renderizar el mapa nativo dentro de un único menú cuando llegue F4.

## Estatus real

F0 prepara compilación reproducible en Actions y control de licencias. Pruebas unitarias NO demuestran jugabilidad en Samsung; correr el workflow, abrir Pages, entrar al mundo y probar cámara/colisiones/bruma son criterios todavía pendientes.
