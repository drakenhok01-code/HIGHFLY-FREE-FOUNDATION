# WORLD FORGE — KINGDOM BUILDER / Studio Supreme
Fecha: 2026-11-27. Alcance: editor independiente, sin cambios al RPG.
## Decisión
Reutilizar el monorepo Guildhall V2 y su Studio completo (MIT; recursos declarados CC0, revisar licencias por pack). Referencia experimental ya usada por HIGHFLY: upstream ef56b1cdf247f8839bf7fbb289713b15dbacae8c. Verificar compatibilidad del commit con el Studio actual antes de fijar la versión definitiva.
Respaldo K0.1: backup/kingdom-k01-compiled-20261127, commit 5672333bc54f97190718bb8afa8c9ee4e6fe90d6; compilación QA exitosa, no desplegada. Sus módulos Unsung se reservan para el puente de etapa 3.
## Módulos originales
Town (visualizador 3D, ampliar a edición), Hex map, Pieces, Palette, Tile composer, Tile prefabs, NPC builder, Grip editor y Grip matrix. Fuente: apps/studio/src/shell/directory.ts, screens.ts, shell/router.ts. Palette y ambos Grip se excluyen del showcase original por dev:true; no basta con mostrar el enlace: necesitan adaptar datos y guardado. El editor de rutinas y acciones de NPC es una ampliación, no un editor completo upstream.
## K0.2 Native Studio
- Montar upstream en entorno aislado; preservar licencias y versión exacta.
- Mantener los nueve módulos, modelos reales y render original. No sustituir por modelos de muestra.
- Compilar una distribución estática propia, comprobar rutas profundas, modelos, rigging, texturas, paleta y acciones. GitHub Pages sólo tras verificar cómo preservar el sitio jugable o disponer de publicación separada.
## K0.3 Proyecto común y español
- Interfaz, mensajes de error, catálogo, etiquetas y ayudas en español; conservar IDs técnicos estables.
- Persistencia IndexedDB por proyecto, exportación/importación JSON, validación de esquema, respaldo y deshacer. La API original sólo guarda en localhost y el showcase es de sólo lectura. Reemplazar guardado y lectura con adaptador persistente; no convertirlo en un falso éxito.
- Un proyecto contiene metadatos, semilla y parámetros del generador, teselas, transformaciones y cambios manuales por ID, prefabs completos, modelos referenciados por pack y licencia, materiales/paletas, recetas de NPC, equipo, agarres, clips, puntos de actividad, rutas y bloqueadores. Definir formato versionado y migraciones. Mantener hexágonos durante las etapas 1 y 2.
- Edición de islas: creación libre y modificación de isla generada; seleccionar, mover, rotar, eliminar, sustituir barrios y teselas, añadir conjuntos y personajes. Los cambios deben sobrevivir al cambio de módulo y a recargar la página.
## K1.0 FREE
Todos los módulos funcionan en español con importación/exportación de un proyecto, sin archivos SOURCE. Pruebas de ida y vuelta, guardado y render 3D en escritorio; publicar Pages aislado tras aprobar.
## K2.0 SOURCE
Repositorio privado separado o ejecución local protegida, importar proyecto FREE sin pérdida. Biblioteca SOURCE v7 y variantes nuevas; verificar licencias individuales, conservar referencias estables. No publicar archivos fuente en Pages público.
## K3.0 Unsung Bridge
Exportación no destructiva: mantener escena original con hexágonos y producir otra sin mallas base hexagonales, conservar posiciones relativas, adaptar alturas, agua, caminos, paletas, NPC, clips, equipo, puntos de interacción y colisiones. Validar importación con el juego de prueba y rendimiento Android; no fusionar ni desplegar el RPG automáticamente.
## Criterio de aceptación transversal
Un mismo proyecto se abre en los nueve módulos, conserva los cambios tras cerrar y reabrir y exporta con referencias recuperables. Ninguna función anunciada como lista sin prueba de navegador. No confundir importación de un plano con compatibilidad jugable.
