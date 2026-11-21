# HIGHFLY — P1 Auditoría RPG (índice de resultados)
**2026-11-21** · Proceso de auditoría, no implementación de objetos. `main` y backup v3.6 NO modificados.

## Qué quedó registrado

| Fuente | Evidencia actual | Qué aún NO implica |
| --- | --- | --- |
| HIGHFLY Premium v3.6 | 19 definiciones de ítems, 12 recetas, tres equipos iniciales y diez ranuras, seis rarezas y +0..+9, ocho iconos de oficio | No implica armaduras, accesorios y loot ya implementados |
| ClaudeCraft **v0.44.7** | 1.191 entradas de objetos en los registros principales + 201 en subregistros de Ignivar + 96 variantes de tesoros calculadas desde 32 piezas y tres grados = **1.488 candidatos fuente** | No es el total global ejecutable: faltan variantes heroicas generadas después y verificación de merge runtime |
| ClaudeCraft recetas | 175 recetas con ID, 106 materiales distintos usados, 175 outputs y 106 materiales localizados en el registro fuente por ID | No implica recetas HIGHFLY ni disponibilidad de los materiales en sus mundos |
| ClaudeCraft profesiones | 5 de recolección + 10 de fabricación, topes documentados en código fuente 0.44.7 | No implica que HIGHFLY deba incorporar automáticamente las 15 |
| KayKit FREE CC0 | 519 archivos GLB/GLTF de cuatro packs públicos oficiales con licencias CC0 comprobadas y SHA de blobs | Hay variantes de color, props, piezas de escenario; NO son 519 piezas de equipamiento ni incluyen KayKit SOURCE |
| Emberfall | Código MIT en commit `5d199ab4888e428b0dab80528a37ab8ac0107360`: 6 armas, 6 formas de skill, 6 reliquias, 3 armaduras, 2 consumibles; 7 modelos listados entre manifiestos V3/V6 y 7 audios en manifiesto | No es prueba de compatibilidad con rig HIGHFLY ni de permiso universal para todos los medios |

## Entregables (abrir en GitHub)

- [Catálogo HIGHFLY aprobado v3.6 JSON](../HIGHFLY_V36_BASELINE_ITEMS_RECIPES.json) y [CSV](../HIGHFLY_V36_BASELINE_ITEMS_RECIPES.csv)
- [ClaudeCraft 0.44.7, 1.488 objetos candidatos unificados CSV](WOC_V0447_UNIFIED_SOURCE_CANDIDATES.csv)
- [Resumen ClaudeCraft y límites de auditoría JSON](WOC_V0447_UNIFIED_SOURCE_SUMMARY.json)
- [Registros fuente 1](WOC_V0447_ITEMS_PART_1.json), [2](WOC_V0447_ITEMS_PART_2.json), [3](WOC_V0447_ITEMS_PART_3.json), [4](WOC_V0447_ITEMS_PART_4.json), [5](WOC_V0447_ITEMS_PART_5.json)
- [Detalle de subregistros y generación de tesoros](WOC_V0447_DYNAMIC_AND_NESTED.json)
- [175 recetas upstream con insumos y profesión](WOC_V0447_RECIPES_175.json)
- [Dependencias de los 106 materiales](WOC_V0447_RECIPE_MATERIAL_GRAPH.json)
- [Catálogo de 519 archivos KayKit FREE CC0 con blobs SHA](KAYKIT_FREE_4_PACKS_MODELS.csv)
- [Inventario Emberfall de armas/reliquias/modelos/audio](EMBERFALL_V08_ITEMS_ASSETS_AUDIT.json)
- [Matriz de 11 estilos de armas, armaduras, accesorios y faltantes](HIGHFLY_WEAPONS_ARMOR_GAP_MATRIX.md)
- [Auditoría inicial de licencias y riesgos](../RPG_AND_ANCIENT_AUDIT_2026-11-21.md)

## Calidad y advertencias

- Registros ClaudeCraft 0.44.7 identificados por `levy-street/world-of-claudecraft` y tag SHA `493c35a108cef6c8aa290e8793107b1cd117886e`.
- El campo `source_name` es **el nombre original para auditoría**, NO una propuesta de nombre definitivo en español. Los 96 ítems generados de tesoros y 2 entradas con nombres expresados indirectamente se dejan sin nombre literal en el CSV.
- Las coincidencias por ID son 0 dentro de los 1.488 candidatos, pero **duplicados semánticos y variantes visuales NO están resueltos**.
- El derecho de reutilizar el código MIT **no otorga derechos sobre medios** con otra licencia. Todos los modelos/audio/iconos ClaudeCraft están marcados `NOT_VERIFIED_NO_COPY` en el catálogo.
- Ningún archivo de KayKit SOURCE fue importado ni publicado.
- Se inspeccionaron archivos de código, manifiestos y licencias; NO se corrieron builds de juego, simulaciones de drops, pruebas Chromium ni Android.
- Las transacciones de v3.6 todavía requieren normalización de inventarios, `instanceId` para cada equipo y nivel/estación real por oficio antes de meter lotes grandes.

## Acciones P1 todavía abiertas

1. Auditar tablas de botín y probabilidades por enemigos/jefes, incluyendo los ítems heroicos generados.
2. Determinar licencia exacta de cada medio candidato y posibles equivalencias de activos; media no verificada se mantiene bloqueada.
3. Resolver duplicados **semánticos** entre los cuatro proyectos (misma función, diferentes IDs).
4. Revisar paquetes CC0 adicionales para arco, maza, orbe y armaduras separables, y comprobar animaciones/anclajes.
5. Crear diccionario propio en español de objetos HIGHFLY y decidir alcance por etapa (P2).
6. Después P3: 12 correcciones de menús/HUD, con pruebas aisladas. Después P4 objetos jugables. Después P5 loot/oficios/economía. **Ancient P6, no antes.**

**No cambiar la v3.6 aprobada, la F0.14.8 estable ni el backup.**

## Ampliación de P1: loot y contrato de personaje universal

**Decisión de implementación aprobada:** [un personaje universal, armas visibles y armaduras exclusivamente como equipamiento de atributos](UNIVERSAL_CHARACTER_STAT_ONLY_ARMOR_CONTRACT.md). No colocar mallas de casco/pechera/guantes sobre el avatar hasta una expansión futura voluntaria. El único mesh que cambia por equipo es el de armas con adaptadores verificados. El aumento de stats debe persistir y reflejarse en personaje, atributos y combate.

**Botín de ClaudeCraft v0.44.7:**
- [Tabla maestra preliminar: 587 filas con ID de monstruo/objeto y probabilidades por fuente](CLAUDECRAFT_V0447_LOOT_EVIDENCE_MASTER.csv)
- [Resumen de cobertura, referencias de ítems y limitaciones](CLAUDECRAFT_V0447_LOOT_EVIDENCE_MASTER_SUMMARY.json)
- [Detalle directo de 501 drops literales](CLAUDECRAFT_V0447_LOOT_LITERAL_ROWS.csv) y [recuento parcial de definiciones de monstruos](CLAUDECRAFT_V0447_LOOT_SCOPE_SUMMARY.json)
- [86 drops derivados por funciones de rift](CLAUDECRAFT_V0447_RIFT_LOOT_EXPANDED.json)
- [Fuentes de monstruos: parte 1](CLAUDECRAFT_V0447_MOB_LOOT_PART_1.json), [2](CLAUDECRAFT_V0447_MOB_LOOT_PART_2.json), [3](CLAUDECRAFT_V0447_MOB_LOOT_PART_3.json), [4](CLAUDECRAFT_V0447_MOB_LOOT_PART_4.json), [5](CLAUDECRAFT_V0447_MOB_LOOT_PART_5.json)

**Botín de Emberfall:** [verificación de drops de XP, oro, pociones y armas élite, y de su recogida](EMBERFALL_LOOT_REVIEW.json). Las armaduras/reliquias de Emberfall son equipos de configuración comprables, no evidencia de monstruos que las dropeen.

**Datos importantes:** el resumen parcial de mobs incluye una entrada `DELVE_MOBS` marcada como FETCH_ERROR en parte 1; quedó resuelta al inspeccionar `src/sim/content/delves/mobs.ts` en **parte 5**. `RIFT_MOBS` es un spread de `ADDS`, `TRASH`, `BOSSES`; también están desglosados en parte 5. Las filas 587 son las EXTRAÍDAS, no un censo completo de loot dinámico; todavía hay tablas heroicas y casos inline por reconciliar.

**Control legal:** P1 no importa medios de ClaudeCraft ni SOURCE privado. Los modelos y los iconos premium sólo se utilizan tras verificaciones específicas. Las probabilidades de fuentes ajenas no son balance definitivo HIGHFLY.

**Orden conservado:** completar P1 (dinámicos/heroico + duplicados semánticos) → P2 catálogo traducido y clasificado → P3 12 mejoras de UI/HUD → P4 armaduras *stat-only*, armas y materiales jugables → P5 economía, loot y oficios → P6 Ancient.
