# HIGHFLY P2.1 — Iconos reales y equivalencias sin romper v3.6

**Fecha:** 21/11/2026 · **Rama base P2:** `p2-highfly-master-catalog-20261121` (`e85909130589`).  
**Alcance:** auditoría de empaquetado WebP, correspondencias visuales y semánticas; NO hay cambio de gameplay, HUD, personaje, recetas, guardados, imágenes ni páginas publicadas.

## Resultado

| Clasificación de las 47 plantillas HIGHFLY | Cantidad |
|---|---:|
| Referencias v3.6 conservadas sin modificaciones | **19** |
| Nuevas con ruta de arte reservado por el usuario, sólo candidatas | **15** |
| Nuevas sin ilustración idónea / arte pendiente | **13** |
| **Total** | **47** |

**Hay siete ZIP originales en GitHub con el manifiesto de 60 archivos WebP**, preservados con SHA-256 en `scripts/f0-build.mjs`. La carpeta `public/highfly/user-icons` **es salida de compilación**, no tiene por qué figurar en el árbol de archivos fuente. El build extrae **36 iconos físicos activos y 24 reservados**. `premium-assets.mjs` puede crear más de 36 bindings por reutilización de imágenes, no por 60 objetos jugables. El proceso existente además produce **cuatro variantes de lingotes** desde `items/ingot.webp` mediante `scripts/highfly-metal-variants.py`.

En esta auditoría comprobé las rutas, el código de build y la presencia de los ZIP en el árbol remoto; **no inspeccioné todavía los bytes internos de los ZIP** desde el conector. La suite P2.1 de GitHub Actions verificará SHA, nombres, WebP y tamaño. Incluso si eso pasa, una imagen **no se aprueba visualmente** sin mirar sus dibujos y comprobar que representan el objeto exacto.

## Archivos

- [ICON_BINDINGS_47.json](ICON_BINDINGS_47.json) — 47 decisiones; origen de imagen, estado, equivalencia, riesgos, bloqueo de integración y +0.
- [ICON_BINDINGS_47.csv](ICON_BINDINGS_47.csv) — lectura rápida por objeto.
- [ICON_ZIP_MANIFEST_60.json](ICON_ZIP_MANIFEST_60.json) — siete archivos ZIP, 60 rutas físicas esperadas, hashes oficiales del build, cuatro derivados de metal.
- [SEMANTIC_EQUIVALENCE_GATES.json](SEMANTIC_EQUIVALENCE_GATES.json) — nueve familias de equivalencia que NO deben convertirse en duplicaciones o fusiones automáticas.
- [tests/catalog-p21.test.mjs](../../../tests/catalog-p21.test.mjs) — pruebas reproducibles en Node y ZIP de verdad.
- [GitHub Actions — P2.1 offline](../../../.github/workflows/catalog-p21.yml) — sólo tests, **sin despliegue**.

## Resoluciones precisas antes de P3/P4

**19 actuales:** mantener TODOS sus enlaces y sus iconos tal como están. No cambiar la espada, pociones, menú, material genérico, variantes de lingotes ni estilos.

**15 candidatos:** usar las imágenes reservadas sólo tras evaluación de contenido visual. Atención: `weapons/dual_daggers.webp` representa doble daga, no necesariamente una sola; `weapons/wand_orb.webp` no hace idénticos dos objetos distintos; `items/leather.webp` puede ser cuero trabajado y no cuero en bruto. Casco/pechera/anillo genéricos tampoco certifican hierro/cobre.

**13 pendientes:** NO dibujar siluetas o placeholders falsos. Son maza, pantalón de hierro, amuleto, cuatro minerales específicos, colmillo, seda, huesos, tela, hilo y fundente. Todas las rutas faltantes quedan marcadas explícitamente.

**Reglas de P2:** mantener 47 objetos, 32 recetas, 19 definiciones v3.6, Cazador Universal, mejoras +0 al crear, un único `instanceId` por pieza, armaduras y joyas *stat-only*, sin copiar recursos con permisos restrictivos. P2.1 no habilita loot ni comercio ni modelos SOURCE.

## Validación y siguiente paso

GitHub Actions de esta rama ejecuta:

```bash
node --test tests/catalog-p2.test.mjs tests/catalog-p21.test.mjs
```

La prueba P2.1 comprueba **ZIPs reales en entorno runner**; no equivale a test WebGL ni Android. El próximo gate es revisar imágenes reservadas una a una, producir los 13 iconos verdaderamente faltantes con el mismo lenguaje visual que el pack, y aprobar bindings antes de tocar el menú. **No activar el lote 28 por simple presencia de un ZIP.**
