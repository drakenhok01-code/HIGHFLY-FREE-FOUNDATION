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

## F1 — rama aislada KayKit FREE

La rama f1-kaykit-free-lab descarga solo Knight.glb CC0 del GitHub oficial a una revisión inmutable y verifica SHA-256 junto con su licencia. El personaje se activa con ?hfchar=kaykit al compilar esta rama. La cápsula, mundo, cámara, física y daño 1–2–3 siguen en Unsung. Las armas visuales del personaje están ocultas hasta equipamiento real. No significa PASS 3D en Samsung ni modifica la URL pública F0 hasta aprobar la rama.
