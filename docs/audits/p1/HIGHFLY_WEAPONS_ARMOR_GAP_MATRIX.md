# HIGHFLY P1 — Matriz de armas, armaduras, accesorios y materiales
**Fecha:** 2026-11-21. **Base:** `bf88ecdcef64337083146caad2390a6d147f30cf`.  
**Estado:** Auditoría estática de repositorios y licencias. Este archivo NO modifica gameplay ni prueba compatibilidad física del personaje.

## Prioridad: once estilos iniciales

| Familia solicitada | HIGHFLY v3.6 | Modelo libre hallado | Estado real / acción requerida |
|---|---|---|---|
| Espada de una mano | **Espada de Aprendiz**, definición + equipamiento | KayKit FREE `sword_1handed.gltf` CC0 | Mantener adapter actual; completar variantes y pruebas |
| Mandoble | **Mandoble de Aprendiz**, definición + equipamiento | KayKit FREE `sword_2handed.gltf` CC0 | Mantener adapter; ampliar catálogo |
| Daga | Sin plantilla equipable | KayKit FREE `dagger.gltf` CC0 | Crear plantilla/adaptador; probar anclaje, animación y colisión |
| Dagas dobles | Sin plantilla equipable | KayKit FREE `dagger.gltf` CC0 (dos instancias visuales posibles) | **No** asumir dual equip ya probado; adaptar dos manos y combos |
| Hacha | Sin plantilla equipable | KayKit FREE `axe_1handed.gltf` y `axe_2handed.gltf` CC0 | Crear plantilla con una y dos manos según adapter |
| Lanza | Sin plantilla equipable | Emberfall `Lightning_Spear.glb` modelo propio según manifiesto | Licencia de medio por archivo y ajuste del rig pendientes; NO importado |
| Arco | Sin plantilla equipable | **No** se encontró arco convencional en los 4 packs KayKit auditados; hay `crossbow_1handed` y `crossbow_2handed` CC0 | Buscar arco con procedencia verificada o desarrollar uno original; NO confundir ballesta con arco |
| Bastón | Sin plantilla equipable | KayKit FREE `staff.gltf` CC0 | Adapter y habilidades/animaciones pendientes |
| Vara u orbe | Sin plantilla equipable | KayKit FREE `wand.gltf` CC0; **ningún orbe confirmado** en los 4 packs | Vara: integrar adapter. Orbe: buscar o diseñar legalmente |
| Maza o martillo | Sin plantilla equipable | **No confirmado** en estos cuatro packs KayKit FREE | Auditar modelos CC0 de otras fuentes; no copiar de ClaudeCraft con arte restringido |
| Escudo | **Escudo de Aprendiz**, definición + equipamiento | KayKit FREE `shield_round.gltf`, `shield_square.gltf` y variantes CC0 | Mantener el escudo actual y ampliar formas |

La presencia del modelo NO prueba aún grip, animación, daño real, equipamiento simultáneo o funcionamiento Android.

## Equipo de personaje y accesorios

HIGHFLY define diez ranuras: casco, pechera, guantes, hombros, pantalón, botas, mano derecha, mano izquierda, collar y anillo.

- **En el código aprobado solo están implementadas tres plantillas equipables**: espada, mandoble y escudo. NO declarar armaduras/collar/anillo visuales como existentes o equipables.
- Los modelos KayKit FREE de **personaje** tienen trajes y partes de apariencia integradas en el GLB; no es equivalente a disponer de piezas de armadura desmontables e intercambiables en tiempo real.
- El prompt solicita **amuleto**, que NO existe como ranura dedicada de `EQUIP_SLOTS` en v3.6. Diseñar la ampliación sin modificar la base aprobada.
- La auditoría fuente de ClaudeCraft identifica categorías de armadura, anillos, collares y mano secundaria; son **datos de referencia**, NO modelos licenciados para extraer de ese proyecto.
- Faltan las familias funcionales y sus efectos propios: tela, cuero, metal, joyería y accesorios.

## Materiales, oficios y recetas: prioridad de integración

- HIGHFLY aún usa el material genérico `ore` para fabricar cuatro lingotes distintos; deben existir minerales individualizados con fuentes y estaciones reales antes de ampliar la economía.
- En ClaudeCraft v0.44.7, las **175** recetas con ID identificadas enlazan **106** ingredientes únicos, y **todos** sus productos e ingredientes fueron localizados por ID en el catálogo estático+tesoros de la auditoría P1.
- Los materiales `junk` del código fuente NO deben clasificarse automáticamente como basura vendible en HIGHFLY; algunos son reactivos de oficio.
- Nombres, tasas, calidad y escalas de ClaudeCraft deben **adaptarse al cazador universal** y a la progresión HIGHFLY, nunca copiar clases originales como restricciones.
- Tabla de profesiones: HIGHFLY mapea 8 iconos, ClaudeCraft define 5 recolecciones + 10 artesanías. Decidir qué nuevos oficios realmente aportan recetas materiales reales antes de ampliar la UI.
- La cadena de trabajo será `origen/recolección → inventario único → receta + nivel/estación → fabricación → equipar/consumir/vender`, seguida de tablas de loot real por monstruo/zona.

## Derechos, duplicados y arte

- **KayKit FREE CC0** verificado por `LICENSE.txt` en cuatro repositorios oficiales, 519 archivos GLB/GLTF indexados; sin copias binarias ni SOURCE privado en HIGHFLY.
- **ClaudeCraft v0.44.7**: MIT para el código, pero `CREDITS.md` excluye muchos iconos/modelos/audio de reutilización independiente; todos los medios sin verificación por archivo se mantienen bloqueados.
- **Emberfall**: MIT en raíz, modelos KayKit CC0 documentados; armas Blender generadas en proyecto sujetas a comprobación de condiciones de redistribución individual. No se copió audio ni modelos.
- **Exactos por ID**: no se encontraron colisiones entre los 1.488 registros fuente identificados; este NO es un resultado de deduplicación semántica entre nombres o modelos. `REUSE FIRST` exige revisar equivalencias antes de crear nuevos `itemId` HIGHFLY.
- **Iconos premium**: preservar los actuales. Antes de crear nuevos, verificar el ZIP original y dimensiones CSS por menú. Objetos de distinta materia (cobre/hierro/plata/oro) deben tener imágenes diferenciables, con rareza manejada por capa visual.

## Próximo gate de calidad

1. Completar variantes heroicas generadas dinámicamente en ClaudeCraft (no contadas en 1.488), más tablas de drop con probabilidades comprobadas.
2. Confirmar opciones CC0 para arco, maza/martillo, orbe y piezas de armadura separables.
3. Completar equivalencias y deduplicación semántica, mantener registros de licencia por **asset** y no solo por repositorio.
4. Construir catálogo HIGHFLY en español sin trasplantar cientos de nombres/ítems externos al juego.
5. Después, completar las **12 correcciones UI/HUD** de la v3.6 en rama aislada; sólo entonces integrar un primer lote jugable, con pruebas Android y de guardado.

**Fuentes consultadas:**
- ClaudeCraft `https://github.com/levy-street/world-of-claudecraft/tree/v0.44.7`
- Emberfall `https://github.com/we1jia/emberfall/tree/5d199ab4888e428b0dab80528a37ab8ac0107360`
- KayKit FREE `https://github.com/KayKit-Game-Assets`
- HIGHFLY base `https://github.com/drakenhok01-code/HIGHFLY-FREE-FOUNDATION/tree/bf88ecdcef64337083146caad2390a6d147f30cf`

**ANCIENT:** fuera de alcance de estas tareas. Mantener su idea arquitectónica en reserva; no implementar ni poblar el catálogo con equipo Ancient.
