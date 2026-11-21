# HIGHFLY — P1.2 | AUDITORÍA DE LOOT DINÁMICO, HEROICOS Y DERECHOS MULTIMEDIA
**Fecha:** 2026-11-21  
**Rama:** `audit-rpg-items-ancient-v36-20261121`  
**Código protegido:** backup Premium v3.6 `bf88ecdcef64337083146caad2390a6d147f30cf`  
**Fuente upstream fijada:** World of ClaudeCraft `v0.44.7` / `493c35a108cef6c8aa290e8793107b1cd117886e`.

> P1.2 es **reconstrucción de datos de código fuente** y clasificación de licencias. No es importación de contenido, prueba de funcionamiento Android, ni ejecución de los módulos TS de ClaudeCraft. No se ha editado código jugable.

## Invariantes HIGHFLY, sin excepciones

1. **Un solo Cazador Universal persistente.** Nunca forzar una clase ni cambiar personaje para equipar un objeto.
2. **Todo equipo nace +0**, cualquiera sea la rareza: Común, Poco común, Raro, Épico, Legendario o Mítico. También es +0 si se gana por quest, cae de un jefe, se fabrica, se compra a un NPC o se obtiene en evento.
3. **Mejora +1…+9** sólo mediante acto explícito del jugador. Al comerciar se mueve la misma instancia y se conserva el estado `+N`, rareza, stats y procedencia. El comercio entre jugadores todavía no está implementado.
4. **Armas** cambian visualmente sólo con adaptador 3D verificado. **Armaduras y joyas** son stat-only (loot, Bolsa, equipamiento, Atributos, combate y guardado) y **NO** cambian malla/casco/traje 3D.
5. Source code MIT no equivale a licencia de modelos, iconos, música y fuentes. Prohibido incorporar medios sin permisos verificados, y SOURCE de KayKit debe permanecer privado.

## P1.2: indicadores que sí pudimos verificar estáticamente

| Rubro | Evidencia reconstruida | Límite |
|---|---:|---|
| IDs fuente de objetos unificados | **1.626**, IDs únicos | Candidatos, no catálogo HIGHFLY implementado, no necesariamente total absoluto de todo el upstream |
| Base P1 ya auditada | 1.488 | No se destruyó ni cambió su significado |
| Nuevos trinkets no contabilizados | 16 | Se detectaron 18 registros generados; 2 IDs ya estaban en el catálogo anterior |
| Colecciones Crucible generadas | 33 equipos + 11 manuales | 44 IDs nuevos; recetas generadas aparte |
| Variantes `heroic_` generadas | **78** | Reconstruidas desde seis instancias y sus `MobTemplate.loot`; no ejecutado motor real |
| Nivel de origen heroico | 47 a fuente 22, 1 a fuente 25, 30 a fuente 27 | Nivel fuente para presupuesto de stats, **NO** enhancement +N |
| Tablas adicionales de jefes heroicos | 14 tablas, **171** filas | Grupos exclusivos y drops independientes diferenciados |
| Entradas de loot fuente indexadas | **916** | 587 originales + 76 inline/normalOnly + 82 spreads + 171 extras de jefe |
| IDs de objetos que aparecen en esas 916 entradas | **456** | NO significa 456 piezas únicas disponibles en HIGHFLY |
| Recetas comprobadas en archivos inspeccionados | **175 + 33** | 175 declaradas en un módulo y 33 generadas en Crucible. NO afirmar que 208 es el total global upstream |
| Grupos de medios descritos en `CREDITS.md` | **255** | Grupos de activos, NO cantidad de archivos individuales |
| Tramos de permisos CC0/"Yes" | 36 grupos | Cada recurso exacto debe verificarse contra fuente oficial |
| Tramos bloqueados para HIGHFLY independiente | 137 sólo original/fork, 69 permiso, 9 no comercial | No importar assets de estas clases |

## Resultado 1: los heroicos

[Archivo reconciliado de las 78 variantes generadas](HEROIC_VARIANTS_RECONCILED_V2.json). Se leyeron las seis listas de aparición heroicas de Hollow Crypt, Sunken Bastion, Gravewyrm Sanctum, Drowned Temple, Wildheart Basin y Nythraxis Raid Arena. Se resolvieron también arrays multilínea y llamadas `normalOnlyRow(...)`. Los 26 IDs de actores elegibles tienen definición en los tres módulos inspeccionados. No quedan expresiones de loot sin analizar **dentro de esa selección heroica**.

La función upstream `buildHeroicVariants` crea un ID `heroic_ + baseId` si existe un drop de equipo Raro, Épico o Legendario en mobs elegibles. El renderer y loot real pueden optar por el original cuando no existe mejora de nivel, según `heroicLootItemId`. Para HIGHFLY, **la jerarquía heroica no equivale a +N**: el ítem resultante tendrá `plus: 0`.

El raid Nythraxis tiene una tabla calculada oculta detrás de `...NYTHRAXIS_EQUIPMENT_LOOT`: [28 candidatos épicos y dos legendarios, más la distribución exacta](NYTHRAXIS_DYNAMIC_LOOT_RECONCILED.json). La primera tirada reserva un 3% para cada legendario y distribuye el 94% restante entre los 28 pesos épicos. La segunda tirada sólo opera en dificultad Normal; en Heroico es sustituida por el grupo especial. NO son tres slots de recompensa.

Las [14 tablas de jefes heroicos](HEROIC_BOSS_TABLES_NORMALIZED.json) contienen 171 filas de origen (incluidos 10 grupos `weightedLootGroup` normalizados; y grupos definidos literalmente). Se conservan las distinciones entre garantía grupal, tirada independiente y chance grupal inferior a 100%. Las 13 referencias que parecían ausentes quedaron resueltas al extraer los trinkets generados.

## Resultado 2: IDs y recetas ocultos en generadores

- [18 trinkets generados por helper](WOC_DYNAMIC_TRINKETS_18.json): 16 no figuraban como IDs en la primera extracción y 2 ya estaban.
- [Crucible Collections](CRUCIBLE_GENERATED_COLLECTIONS.json): 11 perfiles x 3 slots = 33 piezas épicas, 11 manuales y 33 recetas por función. El grupo de 12 patrones (incluida una fórmula) tiene **30% de probabilidad de entregar como máximo un patrón** en cada jefe donde esté activo. Los perfiles del código upstream traen restricciones de clase: HIGHFLY **no** las trasladará.
- [Catálogo fuente ampliado con 1.626 IDs](WOC_V0447_EXPANDED_UNIFIED_1626.csv), incluyendo procedencia y aclaración del `+0` en nuestro sistema.
- [76 filas de loot recuperadas](BASE_LOOT_INLINE_AND_NORMAL_ONLY_RECOVERY.csv): 41 elementos expresados en arrays de una línea y 35 usando `normalOnlyRow`. Son entradas que el extractor literal anterior había omitido.
- [82 filas derivadas de spreads](DYNAMIC_SPREAD_LOOT_RESOLVED_82.json): 58 de Nythraxis y 24 de patrones Crucible (12 opciones x 2 jefes). También se documentó un falso positivo del extractor previo (`petScaleRanks` no es loot).
- [Tabla única de 916 entradas de loot fuente](LOOT_SOURCE_EVIDENCE_916.csv). Las 916 filas son evidencia de autoría, **no un sistema de drops definitivo para HIGHFLY** ni probabilidades aprobadas.

## Resultado 3: permisos legales, documentados por el upstream

Fuente exacta: `levy-street/world-of-claudecraft/CREDITS.md`, tag v0.44.7, cuyo texto aclara que MIT aplica al **código**, y que el registro multimedia prevalece para imágenes, GLBs, SFX y música.

[Tabla de 255 grupos y su decisión HIGHFLY](CLAUDECRAFT_MEDIA_RIGHTS_MATRIX.csv) y [resumen legal de las categorías](MEDIA_LICENSE_CLASSIFICATION.json).

- **36 grupos "Yes" CC0**: solo candidatos, se recomienda verificar la licencia de la fuente original antes de traer el archivo a HIGHFLY.
- **137 "With the project only"**: puede tener sentido en forks directos de ClaudeCraft pero queda **excluido de HIGHFLY independiente**.
- **69 "No, permission required"**: prohibido copiar salvo permiso escrito.
- **9 "Non-commercial only"**: no adecuados para el uso comercial que pueda tener la app.
- 3 con atribución específica y 1 OFL se mantienen fuera de nuestra selección inicial por simplicidad de licencias.
- Recursos no listados en `CREDITS.md` no se vuelven libres por omisión.

[Licencias y procedencia de Emberfall](EMBERFALL_MEDIA_RIGHTS_REVIEW.json): el código original es MIT; personajes KayKit y texturas Poly Haven documentados como CC0; su propio audio sintetizado se documenta en `docs/art-assets.md`; otras mallas y medios siguen sujetos a verificación concreta.

## Validación de datos y límites

El control de consistencia de los manifiestos realizado en la sesión pasó **20 comprobaciones principales**: 1.626 IDs únicos y 1.488 IDs históricos preservados; 916 filas de drops cuyos IDs de recompensa existen en la tabla ampliada; 78 heroicos y sus tres niveles de fuente; 14 tablas/171 filas y ninguna referencia de objeto faltante; 18 trinkets; 33+11+33 Crucible; tabla de permisos 255; invariantes del cazador único y nacimiento +0.

Se incluyó un validador Node reproducible: [`verify-p12.mjs`](verify-p12.mjs).

```bash
git checkout audit-rpg-items-ancient-v36-20261121
node docs/audits/p12/verify-p12.mjs
```

**Importante:** el código Node quedó escrito, pero NO se ejecutó en Codespaces y NO es una prueba de gameplay. Ningún objeto de las 1.626 referencias fue agregado al juego por esta fase. Los informes citados prueban concordancia estática, no permisos individuales de modelos nuevos ni ejecución 3D.

## Qué queda fuera de este subalcance P1.2

- Censo de **todos** los caminos de recompensas fuera de mobs de las instancias analizadas: quests de mundo, mercados, progresiones/eventos y rendimientos detallados de nodos de recursos. No decir que los 1.626 IDs o las 916 filas son "todo el upstream".
- Verificación individual de los ficheros multimedia a importar, sobre todo modelos no originados directamente en un pack oficial CC0.
- Revisión final de equivalencias semánticas, balance de atributos y diseño de iconos premium.
- Tests de Android horizontal, FPS, UI y efectos reales de bonos; pertenecen a integración futura en rama de gameplay.

**Siguiente paso recomendado: P2** con tabla maestra HIGHFLY propia, usando el catálogo priorizado de P1.1 (47 candidatos) como primer lote, preservando iconos actuales y sin copiar las restricciones de clases upstream. Luego P3 pulido aprobado, P4 equipamiento stat-only, P5 ciclo completo de loot/economía. P6 Ancient continúa separado.
