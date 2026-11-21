# HIGHFLY P2.2 — 47 iconos coherentes, arte nuevo aislado

**Base:** `p21-highfly-real-icons-equivalences-20261121` (`33f991d91057`) · 21/11/2026.

## Qué está REALMENTE preparado

- **19 IDs v3.6:** mismos bindings, arte y lógica aprobados. **0 reemplazos.**
- **28 IDs nuevos P2:** cada uno tiene nombre y ruta candidata específica. Se entregó un paquete binario separado del repositorio con **28 WebP de 256 × 256** y PNG de referencia de 512 × 512.
- **Origen artístico de los 28:** 16 ilustraciones nuevas, 8 adaptaciones cuidadosas del arte original, 4 imágenes aprobadas reutilizadas sin modificar sus bytes de origen. No se copiaron imágenes restringidas de ClaudeCraft ni KayKit SOURCE.
- **Límites:** el paquete visual NO equivale a integración en menú, Bolsa, recetas, loot o 3D. **No se ha importado el ZIP a esta rama GitHub ni se han probado assets nuevos en Android.** Las imágenes requerirán aprobación visual antes de activar.
- **Validación del paquete local:** 173 comprobaciones completadas: 28 IDs, 47 mappings, dimensiones 256 WebP, 512 PNG, hashes, ausencia de duplicados, transparencia de nueva producción y verificación de cuatro fuentes originales exactas. El archivo `QA_RESULTS_P22.json` viaja en el ZIP.
- **Importante:** las 16 PNG de 512 del lote generado se han escalado desde el recorte fuente de la lámina, por tanto NO aportan detalle nativo adicional respecto a su archivo WebP de 256.

## Contrato para integración

Se guardan [las 47 correspondencias](P22_VISUAL_BINDINGS_47.json) y [los 28 SHA-256 de los archivos](P22_ASSETS_28_SHA256.json). Los 28 ID nuevos utilizan rutas independientes: `highfly/user-icons/{items|weapons|armor}/hf_<id>.webp`. Nunca se reemplaza el icono de espada, escudo, lingote o profesión existente.

**Cuando el ZIP se haya descargado desde esta conversación y subido a Codespaces**, en la rama P2.2:

```bash
node scripts/p22-import-icons.mjs ./HIGHFLY_P22_WEBP256_LISTO_PARA_INTEGRAR.zip
```

El importador verifica **cada hash** y deja los archivos en `assets/highfly/p22/`, sin tocar archivos aprobados, ninguna ruta activa del menú ni `scripts/f0-build.mjs`. Para hacerlos jugables todavía hace falta P4 (rutas del build, bindings de arte por ID, inventario, equipping y save). Conservalos en una rama privada si en el futuro entran materiales de un pack con restricciones.

**Precauciones de fidelidad:** `hf_rough_hide` usa como candidata la imagen de cuero original, que podría representar piel curtida en vez de cuero en bruto; las piezas de hierro mantienen detalles decorativos dorados del set premium; el icono de colmillo exhibe dos colmillos ilustrativos. Revisar estos detalles antes de hacer pública la integración.

**Invariantes:** Cazador Universal, equipo nuevo siempre `+0`, armaduras y joyas sólo stats (no nuevas mallas), 32 recetas P2 no alteradas, v3.6 intacta y ningún recurso privado exportado.
