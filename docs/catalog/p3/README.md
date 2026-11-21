# HIGHFLY P3.0 — Sistema visual de rarezas + Laboratorio de inventario (AISLADO)

**Base:** `p22-highfly-visual-icons-20261121` (`f2a15da97477`). **Fecha:** 2026-11-21.

## Decisión fundamentada en el catálogo existente

El motor P2 declara **exactamente seis rarezas**: `Común`, `Poco común`, `Raro`, `Épico`, `Legendario`, `Mítico`. No introducir `Inusual` ni eliminar `Mítico`. La función ya existente `projectedGearStats` aplica multiplicadores por rareza, independientemente del +N. Todo ejemplar recién obtenido debe crearse mediante `spawnGear(...)` con `plus:0`; el nivel +1…+9 es una acción explícita del jugador. El marco pintado dentro de cada WebP permanece dorado; un CSS externo **no borra** esa decoración ni hace que los marcos nuevos y antiguos sean idénticos.

## Cambios de código en esta rama

- `src/highfly/p3/rarity-view.mjs`: 6 tokens cromáticos, accesibilidad con textos, +0, catálogo visual 47/47, 10 ranuras, atributos por rareza, bloqueo del amuleto sin ranura y preservación de URLs antiguas.
- `src/highfly/p3/icon-frame.css`: aro cromático **exterior** que se superpone visualmente al mismo icono, sin editar los 60 WebP del usuario, ni recolorear el dibujo con filtros. Adapta tamaños a Android horizontal.
- `tests/catalog-p3.test.mjs`: pruebas separadas de P2/P2.1/P2.2 y sin ejecutar el juego.
- Workflow GitHub Actions limitado a la rama experimental. **No se modifica main, Pages, premium-assets, HUD, CSS de producción, guardados ni gameplay.**

## Laboratorio gráfico (archivo de conversación)

Se creó y validó sintácticamente un **laboratorio HTML offline** entregado en la conversación: `HIGHFLY_P3_LAB_INTERACTIVO.zip`. Incluye los 47 iconos reales P2.2 y v3.6, filtro por Bolsa, rarezas, icono grande, atributos calculados, 10 ranuras y equipar/quitar simulado. Requiere descomprimir y abrir `HIGHFLY_P3_LAB/index.html` en el navegador local. **Los archivos HTML del laboratorio y WebP del ZIP no se subieron a esta rama**: el GitHub contiene el contrato y las pruebas unitarias, no una aplicación P3 desplegada. La captura de navegador automatizado no estuvo disponible en este entorno; se comprobó sintaxis JS, HTML, unicidad de 47 referencias y presencia de imágenes.

## Para P3.1 y P4

1. Aprobar el acabado de los marcos: ¿marco interior original exacto para los 16 nuevos o basta el anillo exterior de rareza? La opción precisa exige retoque ARTÍSTICO de los sprites nuevos, no CSS.
2. Integrar los 28 binarios WebP a una rama probada con `scripts/p22-import-icons.mjs`, sin reemplazar los 19 originales ni imágenes privadas.
3. Aplicar `rarity-view.mjs` al inventario real, Bolsa, equipo, tooltips, comparación y guardar instancias; las pruebas de save y touch son condición antes de activarlo en la app.
4. Mantener armaduras, accesorios y amuleto como estadística solamente, sin mallas 3D; decidir slot del amuleto explícitamente.
5. Conservar toda la lógica v3.6 y las 32 recetas aprobadas hasta pruebas.

**Status:** `UI_DOMAIN_AND_OFFLINE_DEMO_ONLY`; no claims de interfaz real de HIGHFLY jugable.
