# HIGHFLY P3.1-A — Catálogo visual piloto, 16 objetos × 6 rarezas

**Rama aislada** desde `p3-highfly-rarity-equipment-ui-lab-20261121` (`54ff6eb6eea1`). Primera muestra con **16 IDs reales y 96 iconos WebP de 256 × 256** generados y entregados al usuario como archivos de conversación.

## Entrar al catálogo visual

En la conversación HIGHFLY P3.1 del 21-11-2026 se entregaron dos archivos:
- **`HIGHFLY_P31_ABRIR_CATALOGO_16X6.html`**: HTML autocontenido. Se descarga y se abre en Chrome/Edge sin descomprimir.
- **`HIGHFLY_P31_CATALOGO_16X6_COMPLETO.zip`**: `index.html` + 96 WebP, manifiesto con SHA256, CSV y reporte QA. Descomprimir y abrir `HIGHFLY_P31_CATALOGO_16X6/index.html`.

**Ninguno de esos binarios fue subido a este repositorio ni publicado por GitHub Pages.** Esta rama contiene contratos, pruebas y generador reproducible; NO es URL pública de una app alojada.

## Decisiones P3.1

- Seis rarezas **originales de P2**, en este orden: Común, Poco común, Raro, Épico, Legendario, Mítico. No restringir la interfaz a las cuatro de ejemplo.
- Imagen base exactamente igual; el generador `scripts/p31-frame-recolor.py` recolorea píxeles cálidos del **marco perimetral** (ancho 35 px) y conserva intactos los píxeles centrales y el fondo. El marco dorado interior del WebP está estilizado, y entre imágenes de origen hay diferencias de diseño que aún necesitan validación visual; **no confundir el resultado con retoque artístico definitivo**.
- Inventario de la muestra: 4 armas, 4 armaduras, 2 accesorios, 6 materiales. Los materiales muestran seis marcos **únicamente como prueba gráfica**: no cambia la rareza fija definida en P2, ni se concede loot aleatorio a dichos materiales.
- Todo equipo obtenido cae `+0`; la rareza es independiente del nivel de mejora.
- Sin modelo de armadura 3D, sin activación de loot, sin romper v3.6, sin cambios a `premium-assets.mjs`, `scripts/f0-build.mjs`, guardados o Pages.
- La app piloto ofrece seis columnas, buscador, filtros por categoría, tamaño mostrado 64/90/128, ampliación a 256, detalle y CSV de IDs.
- Local: integridad de los 96 WebP (dimensiones, hashes, centro preservado, seis variaciones distintas) y prueba de DOM sintética **16 filas / 96 imágenes / búsqueda** satisfactorias. **Chromium bloqueó por política de administrador** la navegación a file:// y localhost; no afirmar prueba visual en navegador.
- Revisar cómo se ven las seis rarezas por tipo de objeto, especialmente diferencia de ornamentación entre pack original y 16 arte P2.2 y el cuero en bruto, antes de incorporar al juego.

## Próximo lote

Ampliar misma matriz progresivamente a los **47 IDs** del catálogo P2 (sin generar rarezas de gameplay en materiales por accidente), y luego a nuevos IDs sólo cuando estén definidos con icono, licencia y equivalencia semántica. P3.2 UI real y P4 loot/inventario quedan independientes.

`docs/catalog/p31/P31_PILOT_16X6.json` es la fuente de la matriz. `scripts/p31-frame-recolor.py` puede reproducir el tratamiento de marco con Pillow y NumPy; no importa arte privado.
