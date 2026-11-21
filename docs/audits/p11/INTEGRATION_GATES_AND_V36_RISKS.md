# P1.1 — Gates de integración para HIGHFLY Premium v3.6

**Base protegida:** `bf88ecdcef64337083146caad2390a6d147f30cf`  
**Personaje:** exactamente **uno, universal**, persistente; no clases.  
**Regla inviolable del usuario (21/11/2026):** cualquier arma, escudo, pieza de armadura o accesorio obtenido por loot, jefe, fabricación, misión, evento o NPC **nace +0**, independientemente de su rareza. El `+1…+9` es producto exclusivo de la mejora del jugador. Al comerciar, debe conservar exactamente el estado mejorado.

## Estado del trabajo

Esta fase prepara el catálogo y establece el contrato; **NO modifica todavía el gameplay**, ni coloca modelos 3D de armadura, ni habilita transacciones online. El catálogo prioritario contiene 19 IDs ya presentes y 28 candidatos; faltan iconos y balance para los nuevos. Las 1.488 entradas upstream sirven como **candidatos de contenido**, no como objetos integrados.

## Gate 0: respaldos y rama

- `main`, backup v3.6 y backup F0.14.8 permanecen intactos. Los archivos P1.1 van en `audit-rpg-items-ancient-v36-20261121`.
- No copiar modelos/audio/iconos de ClaudeCraft con derecho no verificado. No publicar KayKit SOURCE privado.

## Gate 1: plantillas originales, no trasplantes

- Preservar `training_sword`, `training_shield`, `training_greatsword`, pociones, materiales genéricos legados y 60 iconos premium aprobados.
- Catalogar `hf_*` nuevos como **candidatos** hasta completar stats, slots, fuentes de loot, recetas y arte legal. Ninguna equivalencia semántica de ClaudeCraft autoriza copiar su modelo/icono; datos de juego MIT y arte con licencia independiente.
- Dagas dobles: **dos instancias individuales de daga** (mano izquierda y derecha). NO duplicar el `templateId` por un estilo de combate.
- Diferenciar **mineral de cobre, hierro, plata y oro**. Los dos primeros existen como IDs en la fuente ClaudeCraft 0.44.7; plata y oro son propuestas originales HIGHFLY. Los cuatro lingotes YA existen como IDs HIGHFLY pero las recetas v3.6 consumen `ore` genérico y necesitan actualización y migración.
- Seis rarezas HIGHFLY; `rarity` NUNCA determina `plus`.

## Gate 2: salvar y migrar instancias únicas

**Archivos de código que deberán cambiar cuando comience P4** (no editados en P1.1):
1. `src/highfly/rpg-core.mjs`: `ITEM_DEFS` pasa a catálogo central; `normalizeRpgState` debe conservar todos los nuevos IDs. Guardado backward-compatible con `SAVE_KEY='highfly-rpg-f014-v1'` y schema v3.6.
2. `src/highfly/rpg-itemization.mjs`: `GEAR_IDS` ahora sólo incluye espada, escudo y mandoble; las `gearTraits` guardan arrays de `{id,rarity,plus}` **sin instancia única**. Migrar a `instanceId` y tratar equipo como objetos individuales sin perder inventarios existentes.
3. `src/highfly/rpg-equipment.mjs`: `EQUIP_ITEM_DEFS` contiene tres objetos, `normalizeEquipped` descarta desconocidos. Registrar ranuras nuevas *stat-only*, pero NO importar partes de armadura visuales. Alinear mapping `feet→boots`, `legs→pants`, `shoulder→shoulders`, `neck→necklace`.
4. `src/highfly/premium-rpg.mjs`: `attrs=()=>attributeBreakdown(level,training)` **no recibe bonuses**, mientras `equipmentBonuses` calcula stats por separado. La UI debe mostrar los bonos correctamente Y el juego aplicarlos a combate; no sólo pintarlos.
5. `src/highfly/premium-rpg.mjs` `syncEquipment`: hoy llama `game.hero.equip(index)` por cualquier transacción; actualizar rig **sólo cuando cambian arma/escudo**. Casco, pechera, botas, anillo y collar no deben disparar cambios de malla.
6. `src/highfly/premium-assets.mjs`: conservar URLs de iconos existentes; expandir sólo con archivos auditados y aprobados, nunca con imágenes genéricas o sustituir las 60 aprobadas.

**Estrategia de upgrade y comercio:** plantilla estable + instancia con `instanceId`, `rarity`, `plus`, stats; loot/craft/shop/quest invocan constructor que asigna incondicionalmente `plus:0`. `enhanceGear` del jugador puede modificar el mismo `instanceId` y consumir piedras. Transferir entre dos inventarios mueve la MISMA instancia, con `plus` original y sin re-roll. Comercio online es **futuro**, no existe actualmente.

## Gate 3: primera integración P4, por vertical slice

1. Monstruo inicial da un material real; no reutilizar automáticamente la probabilidad de ClaudeCraft.
2. Recolección minera entrega `hf_ore_copper` o `hf_ore_iron` según el tipo de veta; antes de mezclar plata/oro, crear y probar sus fuentes.
3. Fundición produce **el lingote correcto**, nunca cuatro lingotes de un mismo mineral genérico.
4. Forjar una pechera con costes originales HIGHFLY (balance pendiente). El equipamiento nace +0; puede salir Raro o Legendario según regla de obtención.
5. Equipar pechera muestra icono, ranura y atributos; el 3D permanece IGUAL.
6. Equipar/cambiar espada altera únicamente el arma y mantiene los stats de la pechera.
7. Guardar, recargar, mejorar +1...+9 y desequipar sin duplicados ni pérdida de bonificaciones.
8. Pruebas móviles en Samsung S23 Ultra horizontal y desktop; medir FPS y errores, sin declarar QA completado sin ejecución real.

## Gate 4: QA obligatorio

Casos diseñados en [EQUIPMENT_LIFECYCLE_ACCEPTANCE_CASES.json](EQUIPMENT_LIFECYCLE_ACCEPTANCE_CASES.json): loot Raro +0, Legendario +0, Mítico +0; forja y tienda +0; recompensa +0; mejora explícita +3; transferencia conserva +3; armadura stats sin cambio visual; desequipar; guardado; cazador universal.

**Pendientes P1 sin resolver al 100 %:** todas las variantes heroicas generadas en ejecución (`buildHeroicVariants(ITEMS,MOBS)`), tablas dinámicas/inline de loot, permisos multimedia por archivo, deduplicación semántica manual definitiva. **No afirmar que P1 global está terminado.**

**Ancient** se reserva para P6. Nunca crear un séptimo color de rareza para ello.
