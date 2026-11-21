# HIGHFLY — Auditoría RPG y sistema Ancient (pasada P0–P1)
**Fecha:** 2026-11-21  
**Estado:** Auditoría inicial de código y registros; no es una certificación completa de assets ni una prueba jugable.  
**Base inmutable:** `bf88ecdcef64337083146caad2390a6d147f30cf` (Premium v3.6)  
**Backup verificado:** rama `backup-v36-approved-video-review-20261121` → SHA anterior.  
**Rama de trabajo:** `audit-rpg-items-ancient-v36-20261121`.  
**Cambios en gameplay:** ninguno.

## 1. Fuentes efectivamente verificadas

| Fuente | Referencia examinada | Resultado y límites |
| --- | --- | --- |
| HIGHFLY-FREE-FOUNDATION | commit aprobado v3.6 | Código principal de inventario, ítems, equipo, mejoras, oficios, UI, licencias y pruebas; catálogo JSON separado en esta rama |
| World of ClaudeCraft | **tag v0.44.7**, `package.json` confirma versión 0.44.7 | Archivos `src/sim/content/items.ts`, `profession_items.ts`, `recipes.ts`, `professions.ts`, `src/sim/data.ts` y `CREDITS.md` |
| Emberfall | `we1jia/emberfall` rama principal (README v0.8) | `src/content.js`, `src/builds.js`, `src/profile.js`; manifiestos de modelos y audio, licencia raíz |
| KayKit FREE | licencias CC0 en archivos incluidos en Emberfall + referencias oficiales CC0 | Tres personajes presentes en `models-v6/manifest-v6.json`, no inventario de TODO KayKit FREE |
| KayKit SOURCE | **NO inspeccionado ni copiado** en esta rama pública | Reservado a expansión privada. Prohibido publicar assets SOURCE aquí |

**Identificación importante:** `liyue-aigc/emberfall-rpg` es otro proyecto, no el Emberfall de referencia HIGHFLY. El correcto es `https://github.com/we1jia/emberfall`.

## 2. HIGHFLY: datos confirmados en v3.6

- `src/highfly/rpg-equipment.mjs`: **3** objetos equipables con adaptadores de equipamiento (espada de aprendiz, escudo, mandoble). Existen **10** slots definidos, no 10 piezas de armadura implementadas.
- `src/highfly/rpg-core.mjs`: **19** IDs de ítems contando los 3 de equipo; **12** recetas declaradas.
- `src/highfly/premium-assets.mjs`: **8** nombres de profesiones mapeados a iconos: Recolección, Minería, Tala, Pesca, Cocina, Alquimia, Fundición, Forja.
- `src/highfly/professions.mjs`: acciones de recolección y transformación, NO demuestra todavía una progresión por niveles para cada oficio.
- `src/highfly/rpg-itemization.mjs`: **6** rarezas, nivel de mejora de **+0 a +9** para 3 IDs de equipo; `trait` almacena `id`, `rarity`, `plus`. Se consume piedra para mejorar, núcleo para ascender de rareza.
- `src/highfly/rpg-core.mjs`: guardado `SAVE_KEY = highfly-rpg-f014-v1`, normalizador de estado `schema:4`, Bolsa de 36 hasta 72 casillas.
- `src/highfly/premium-assets.mjs` declara un paquete de 60 iconos aportados por el usuario. La **presencia de ZIP** en el árbol y esta declaración **no prueba** haber validado cada bitmap ni su resolución.
- La lista exacta de las 19 definiciones y 12 recetas está en `HIGHFLY_V36_BASELINE_ITEMS_RECIPES.json`. Todo campo de soporte visual se marca pendiente de comprobación cuando corresponde.

### Brechas concretas del código actual

1. **Identidad de instancia ausente**: `defaultTrait` y `validTrait` no crean un `instanceId`; tampoco registran fabricante, componentes, calidad, evolución ni historial. No es todavía un sistema Ancient ni una trazabilidad suficiente para comercio individual.
2. **Materiales genéricos**: las recetas de lingote de cobre, hierro, plata y oro consumen todos `ore`, cambiando solo la cantidad. Existen IDs específicos de lingote, pero NO aparecen IDs `ore_copper`, `ore_iron`, `ore_silver`, `ore_gold` en el catálogo base.
3. **Profesión no exigida por la operación**: `canCraft` controla insumos y máximo del output, pero no verifica habilidad, estación o aprendizaje de oficio. `RECIPES` incluye `Marroquinería` en el sello de expansión, que no figura entre los 8 iconos/oficios principales.
4. **Inventarios separados**: `craftPotion` recibe inventario de profesiones y escribe resultado en inventario RPG. Exige un contrato de transacciones para evitar divergencias y duplicaciones cuando se añadan metales y drops.
5. **Limitaciones visuales deliberadas**: la nota de `rpg-equipment.mjs` restringe modelos visibles a armamento con soporte KayKit Knight FREE. No presentar casco, pechera, guantes, etc. como armaduras 3D ya equipables.
6. **Falta de catálogo de fuentes y derechos por ID**: el manifiesto raíz `ASSET_MANIFEST.json` contiene `records: []`, con una nota de generación en build; no es suficiente como auditoría SKU por SKU.
7. **Lo que todavía no probamos**: persistencia en navegador real, generación de loot, equipamiento en todos los slots, deduplicación entre fuentes, capturas Chromium y Android. NO etiquetar esas pruebas como superadas.

## 3. ClaudeCraft **exactamente** v0.44.7 (no 0.45.8)

Código examinado con `ref=v0.44.7` en `levy-street/world-of-claudecraft`.

### Profesiones confirmadas
**Recolección (5):** `mining` (100), `logging` (100), `herbalism` (100), `fishing` (200), `farming` (100).  
**Fabricación (10):** `engineering`, `alchemy`, `cooking`, `leatherworking`, `tailoring`, `inscription`, `enchanting`, `jewelcrafting`, `weaponcrafting`, `armorcrafting`. Todas tienen máximo de skill **125** en `CRAFT_RING`.

### Catálogo inspeccionado
- `src/sim/content/items.ts` → **296** entradas literales bajo `BASE_ITEMS`.
- `src/sim/content/profession_items.ts` → **137** entradas literales bajo `PROFESSION_ITEMS`.
- `src/sim/content/recipes.ts` → **175** IDs únicos declarados en ese archivo, repartidos en tablas de recetas. Inspección estática, no validación de craft de extremo a extremo.
- `src/sim/data.ts` fusiona **35** conjuntos/variables de ítems y genera variantes heroicas después. Por lo tanto, **433 no es el total global**: se refiere exclusivamente a los dos primeros catálogos revisados. No atribuir a 0.44.7 los totales de una versión posterior.
- El código enseña esquemas aprovechables de receta, oficio, estación, especialización y procedencia. Las estadísticas, nombres y relaciones con clases NO son automáticamente compatibles con el cazador universal de HIGHFLY.

### Permisos de medios
`LICENSE` es MIT para **código**, pero `CREDITS.md` declara que arte, audio, modelos y tipografías tienen licencias individuales:
- `Yes` / CC0 o equivalente: reutilización condicionada a comprobar la entrada exacta.
- `Yes, attribution required`: incluir créditos y aviso.
- `With the project only`, `No, permission required`, NC o contenido sin registrar: **BLOQUEADO** para importación a HIGHFLY.
- KayKit FREE, Quaternius, Kenney y varias texturas aparecen marcados CC0 en el registro; verificar cada archivo y su hash antes de copiarlo.

## 4. Emberfall: repositorio correcto

Referencia: `https://github.com/we1jia/emberfall` (rama `main`, README v0.8; sin fijar aún SHA de auditoría).

- `src/content.js`: **6 armas** `fire-sword`, `fire-greatsword`, `lightning-spear`, `lightning-halberd`, `water-staff`, `water-scepter`.
- `src/builds.js`: **6** reliquias configurables para formas de habilidad y **3** armaduras equipables: `ash-mantle`, `glacier-robes`, `storm-vest`. No copiar nombres ni balance como identidad final.
- `src/profile.js`: **2** suministros de campamento: `damage-tonic` y `ward-charm`.
- `public/assets/models-v3/manifest-v3.json`: `Fire_Sword.glb`, `Lightning_Spear.glb`, `Water_Staff.glb` con procedencia Blender original; `Mage.glb` KayKit bajo CC0.
- `public/assets/models-v6/manifest-v6.json`: Knight, Rogue_Hooded y Mage, todos con **76 animaciones declaradas** cada uno, derivados de KayKit CC0 (manifiesto, no prueba 3D ejecutada en HIGHFLY).
- `public/assets/audio/manifest.json`: **7 archivos WAV listados**, declara síntesis original sin samples externos; verificar el audio final y sus condiciones antes de integrarlo.
- `LICENSE`: MIT para código; hay avisos adicionales para assets KayKit. Revisar cada dependencia multimedia y mantener avisos.
- No se verificó aquí un sistema de 10 profesiones ni un banco de recetas comparable al de ClaudeCraft.

## 5. Arquitectura acordada para EQUIPO ANCIENT

**Ancient no se agrega al enum de rarezas.** Mantener `rarity` = Común / Poco común / Raro / Épico / Legendario / Mítico y agregar `craftLine: 'standard'|'ancient'` a la **instancia** de equipamiento.

Contratos que deberá soportar la migración:
- **Plantilla** (`itemId`): ícono/modelo/slots/estadísticas base/receta.
- **Instancia** (`instanceId`): rareza, +0..+9, rol, fabricante, procedencia, fecha de creación, calidad, materiales, componentes instalados, historial de eventos y nivel de evolución.
- **Progresión Ancient** (`ancient`): identificador de línea artesanal, núcleo, etapas y componentes con slots habilitados, especialización, receta de cada evolución, potencial balanceado.
- **Transacción atómica**: validar insumos, oficio, estación, receta, bloqueo de instancia y capacidad; luego consumir/transformar y guardar con seguridad.
- **Identidad permanente**: evolucionar una espada NO genera otro `instanceId`; sólo cambia su estado y añade un evento al historial.
- **Comercio**: mover la misma instancia, nunca recrearla por `itemId`; decidir vinculaciones y restricciones con reglas explícitas.
- **Mecanismos anti pérdida/duplicación**: migración reversible con copia de seguridad, guardado versionado y tests de entrada/salida; ningún cambio en la key de v3.6 sin migración.

**Ejemplo ilustrativo, NO contenido inventariado:** `Filo del Alba`, primera espada Ancient, sólo se registrará como objeto obtenible cuando exista una receta balanceada completa, materiales con fuentes reales, estaciones, requisitos y pruebas de obtención.

## 6. Orden responsable del siguiente trabajo

1. Extender catálogo a los otros 33 conjuntos importados por ClaudeCraft y determinar entradas generadas, sin sumar valores de distintas versiones.
2. Examinar dependencias de los 12 crafts HIGHFLY; separar ingredientes reales, productores, oficio y estación.
3. Fijar SHA exacto de Emberfall y revisar sus recursos por archivo; auditar paquetes KayKit FREE faltantes y evitar publicar SOURCE.
4. Aplicar los ajustes UI/HUD de v3.6 sobre rama aislada **sólo después** de pruebas de regressión; no tocar respaldo ni F0.14.8.
5. Implementar migración a instancias con UUID/identificador estable, luego prototipo Ancient de **una sola espada**, con pruebas de fabricación, evolución, guardado, equipar/desequipar y comercio.

## Evidencia reproducible

- HIGHFLY: `https://github.com/drakenhok01-code/HIGHFLY-FREE-FOUNDATION/tree/bf88ecdcef64337083146caad2390a6d147f30cf/src/highfly`
- ClaudeCraft v0.44.7: `https://github.com/levy-street/world-of-claudecraft/tree/v0.44.7/src/sim/content`
- Licencias ClaudeCraft: `https://github.com/levy-street/world-of-claudecraft/blob/v0.44.7/CREDITS.md`
- Emberfall: `https://github.com/we1jia/emberfall`

**Estado de esta entrega:** informe técnico y catálogo base en rama auditada. **NO** se modificó código jugable, se hicieron builds ni se certificó funcionamiento de Android o Chromium.
