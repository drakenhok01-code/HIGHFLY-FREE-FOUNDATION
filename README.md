# HIGHFLY — FREE FOUNDATION V0.1

**Android Samsung S23 Ultra horizontal primero.** Mundo, ciudades, biomas, agua, cielos, colisiones, navegación y entorno de [Unsung Vale](https://github.com/Leonxlnx/unsung-vale) son la base definitiva. No reconstruir, sustituir ni simplificar el mundo.

## Estado actual: F0.4 · KayKit FREE + comprobación WebGL real + dash + sprint + catálogos

Esta rama construye el **Unsung original** desde el commit congelado \`9f61b0d80b18c6cf661f72372545b3f9214fb455\` **en GitHub Actions**, sin importar el historial privado. Añade joystick táctil 360°, cámara libre, ATK, salto, ROLL, USAR, CORRER con toque para alternar, DASH direccional independiente, fullscreen y bruma persistente al 35%. La prueba de navegador Chromium carga el KayKit Knight GLB y valida sus animaciones, espada y socket; la jugabilidad en Samsung permanece pendiente.

**Ya incluye** KayKit FREE Knight y una espada CC0 visible; **no incluye todavía** equipamiento intercambiable, segundo salto, menús RPG, skills Emberfall ni sistemas de ClaudeCraft. Estas funciones quedan pendientes de QA e integración por etapas.

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

## F0.3 · Correcciones 18/11/2026
KayKit Knight FREE ahora tolera la sanitización de nombres del GLTFLoader (`handslot.r` / `handslot_r`): no falla toda la carga por un único socket faltante. La espada CC0 incluida en el Knight queda visible. CORRER es **toggle al tocar**; el joystick continúa libre para un dedo, cámara independiente en el otro. DASH es una acción nueva (tecla V en PC) con física de cápsula Unsung, dirección analógica, cooldown de 0.78s, costo de 16 energía e invulnerabilidad limitada. La animación DASH usa Dodge_Forward temporalmente; NO es aún un set 4-direccional dedicado. Se preservan mundo Unsung, terreno y colisiones. Verificación gráfica Android obligatoria. Error específico del KayKit visible en el aviso para diagnóstico.

## F0.4 · Inventarios y smoke WebGL real

- [Catálogo FREE en GitHub Pages](https://drakenhok01-code.github.io/HIGHFLY-FREE-FOUNDATION/catalogo.html) — 32 assets de Adventurers 1.0 indexados con commit fijo y URLs oficiales; solo Knight GLB está integrado de momento.
- [Auditoría de un personaje universal](docs/MATRIZ_REUSO_PERSONAJE_UNICO.md) — sin nueve clases ni party; rig, sockets, skills y equipo.
- QA real Chromium/Three WebGL: carga GLB Knight, recorre 14 estados, renderiza espada/9 mallas, 76 clips, mano derecha. Este smoke es aislado: no sustituye QA de escena completa en Samsung.
- SOURCE v7: inventario del usuario procesado de forma privada; **nunca se importa ni se publica en este repo FREE**.

## F0.7 prueba: visual KayKit en capa 3D transparente
El laboratorio añade una segunda pasada WebGL con **la misma cámara** sobre el mundo Unsung, solo para la visualización de KayKit. La física, estado, combos y ROLL siguen en Unsung. `?hfskin=overlay` fuerza esta vía; en Android sería la opción por defecto, `?hfskin=direct` la desactiva. La segunda pasada puede dibujar el personaje delante de objetos que deberían ocultarlo: es solución de compatibilidad provisional, no integración final del depth buffer. No publicar sin WebGL QA y Samsung.

## F0.8 — reconstrucción limpia del personaje (rama de pruebas)
Un **KayKit FREE CC0 Knight** con rig intacto de 41 huesos y **76 clips** retargeteados a un cuerpo estilizado usando el método continuo de HIGHFLY Anime V6.6. Se retiraron CPU skinning, el segundo WebGL/canvas, luces redundantes y superposiciones. El render ahora utiliza exactamente el shader de piel del héroe original de Unsung (un único renderer y depth buffer). Se conservan Player físico original, ATK 1→2→3 con hit windows, ROLL 360, DASH y salto. Los 76 clips están disponibles como catálogo visual; sus acciones físicas adicionales deberán integrarse y ensayarse antes de afirmarlas jugables. NO incluye SOURCE de pago.

## F0.8.1 — HUD limpio y comparación de aspecto
Eliminado el aviso fijo de confirmación «HIGHFLY · KayKit FREE ✓» del centro superior. Los estados de diagnóstico siguen en `window.__highflyHeroStatus` y en consola. El aspecto HIGHFLY Anime V6.6 se mantiene por defecto. Para comparar con el modelo original FREE KayKit *chibi* con casco, sin deformación Anime V6.6, abrir `?hfstyle=original`. Para el aspecto estilizado con casco y capa usar `?hflook=armored`. Ambas opciones usan una sola cápsula Unsung, el mismo ATK 1→2→3 y el mismo GLB CC0; la opción original solo modifica la apariencia. Animaciones de natación, escalada y parkour siguen no implementadas.
