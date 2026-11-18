# HIGHFLY — FREE FOUNDATION V0.1

**Android Samsung S23 Ultra horizontal primero.** Mundo, ciudades, biomas, agua, cielos, colisiones, navegación y entorno de [Unsung Vale](https://github.com/Leonxlnx/unsung-vale) son la base definitiva. No reconstruir, sustituir ni simplificar el mundo.

## Estado actual: F0 experimental, aún no aprobado como demo 3D

Esta rama construye el **Unsung original** desde el commit congelado \`9f61b0d80b18c6cf661f72372545b3f9214fb455\` **en GitHub Actions**, sin importar el historial privado. Añade un joystick táctil simple, cámara libre derecha, ATK, salto, ROLL, USAR, CORRER, fullscreen y ajuste persistente de bruma de 35%. DASH aparece bloqueado porque aún no existe como mecánica HIGHFLY independiente; no fingimos que esté implementado.

**No incluye todavía** personaje KayKit FREE, equipo visible, segundo salto, menús RPG, skills Emberfall ni sistemas de ClaudeCraft. Se agregan únicamente después de pruebas reales en Android.

## Repositorio y despliegue

- Rama de desarrollo: \`free-foundation-v01\`. \`main\` no recibe funciones sin aprobar.
- Actions: \`.github/workflows/pages.yml\`. GitHub Pages debe usar **Build and deployment → Source: GitHub Actions**.
- URL prevista después de un Actions exitoso: https://drakenhok01-code.github.io/HIGHFLY-FREE-FOUNDATION/
- \`npm run qa:static\` y \`npm run qa:gameplay\` funcionan sin red; \`npm run build\` necesita Internet para clonar el Unsung público congelado; \`npm run qa:dist\` inspecciona los binarios reales antes del deploy.

## Control legal

Todo el audio de Unsung se revisa contra \`CREDITS.md\` por archivo; se exige 129 OGG, 62 CC BY 4.0 y 67 CC0. El build publica manifest de hashes SHA-256, textos de licencia MIT y créditos completos. Se rechaza cualquier drift en las tres modificaciones de URLs de \`src/world/terrain.js\`. Nada de SOURCE/EXTRA, \`dist\` previo, materiales privados ni medios restringidos.

La visualización en Samsung, apariencia real de niebla, físicas y fps están **pendientes de QA real**: no se confunden pruebas unitarias con ejecución WebGL.

## F0.1 — diagnóstico del primer video Samsung

El mundo Unsung cargó en un teléfono real, pero el primer HUD no obtuvo aprobación de joystick 360°. Se reforzó su stick analógico con captura de puntero, diagonales normalizadas, centro muerto y pruebas automáticas para ocho direcciones; **hasta un nuevo video Android su resultado continúa pendiente**. Para diagnosticar la dirección entregada al Input original: agrega `?hfinputdebug=1` a la URL de Pages; aparece `JOYSTICK 360° X=... Y=...` y el giro del héroe. No se modificaron el terreno, los edificios, el agua ni la cápsula física.

## F0.2 · Corrección 18/11/2026
KayKit FREE Knight se intenta cargar por defecto. Si falla, muestra ⚠ en pantalla y restaura Unsung original. Comparación original: `?hfchar=unsung`. Diagnóstico del joystick y coordenadas: `?hfinputdebug=1`. El mouse-lock y los clicks derivados de toques quedan aislados en el Input. El CI valida las ocho direcciones con la cápsula física **real** de Unsung, giros de cámara, combate y lista exacta de animaciones del GLB. Ver `docs/AUDITORIA_MOVIMIENTO_F02.md`. Persisten pruebas visuales Android y sistemas de natación/parkour/dash.
