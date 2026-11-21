# HIGHFLY RPG — P2 | CATÁLOGO MAESTRO V1
**Fecha:** 21 de noviembre de 2026.  
**Rama aislada:** `p2-highfly-master-catalog-20261121`.  
**Estado:** Catálogo original y lógica de dominio aislada preparada; **NO importado todavía en el juego**.  
**Backup visual Premium v3.6:** `bf88ecdcef64337083146caad2390a6d147f30cf`.

## Resultado concreto

| Entrega | Cantidad | Estado real |
|---|---:|---|
| Plantillas HIGHFLY en español | **47** | 19 originales preservadas, 28 nuevas propuestas |
| Equipamiento con stats y rarezas | **20** | Tres equipables en v3.6; 17 nuevos definidos fuera del gameplay; uno de esos 17 (amuleto) necesita decidir ranura |
| Recetas con insumos reales | **32** | 12 **idénticas a v3.6**, 20 nuevas aún no activadas |
| Profesiones clasificadas | **15** | Ocho visibles mediante IDs de iconos en v3.6, siete futuras o sin icono |
| Modalidades de armas en roadmap | **11** | Dagas dobles = dos instancias individuales de la misma daga |
| Manifestación de loot/obtener por plantilla | **47** | Referencias, no drops live; tasas de HIGHFLY sin definir |
| Atributos HIGHFLY de equipo nuevo | **17 modelos de base stats** | **Balance propuesto**, no stats jugables activos |
| Iconos multimedia nuevos | **0 archivos** | Se conservaron mappings existentes; no se inventó ni copió arte no auditado |
| Código nuevo | **1 módulo JS puro** | No conectado al runtime, no modifica combate ni HUD |

**Regla central:** al crear un nuevo equipo, SIEMPRE `plus:0`, sea Común, Raro, Legendario o Mítico. La rareza cambia sus stats **sin regalar mejora**. Únicamente una acción de mejora posterior del jugador puede dar `+1…+9`. Un eventual intercambio conserva el **mismo `instanceId`** y su `+N`.

**Un único Cazador Universal.** Habilidades físicas usan Energía, mágicas usan Maná. Sin clases obligatorias. Armaduras y joyas son **stats + iconos** sin cambios de modelo 3D. Solamente las armas pueden cambiar visualmente una vez verificada la compatibilidad.

## Entregables principales

1. [Catálogo maestro JSON — 47 plantillas](MASTER_CATALOG_47.json)
2. [Catálogo maestro CSV — legible](ITEMS_47_READABLE.csv)
3. [Recetas y oficios JSON — 32 + 15](RECIPES_32_AND_PROFESSIONS.json)
4. [Recetas CSV — 32](RECIPES_32_READABLE.csv)
5. [Profesiones CSV — 15](PROFESSIONS_15_READABLE.csv)
6. [Obtención, procedencia e iconos de las 47 plantillas](ACQUISITION_AND_ASSETS_47.json)
7. [Plan de migración y prevención de pérdidas de partidas](INTEGRATION_AND_SAVE_MIGRATION.md)
8. [Motor de dominio aislado](../../../src/highfly/p2/catalog-domain.mjs)
9. [Suite de tests Node](../../../tests/catalog-p2.test.mjs)
10. [Registro de las 31 pruebas aisladas](ISOLATED_TEST_RESULTS_31.json)

## Un ejemplo REAL del contrato (todavía no es gameplay)

Una **Pechera de hierro** tiene stats base HIGHFLY propuestas: `defense: 10`, `VIT: 2`.
- Una nueva instancia `Raro +0` proyecta Defensa **12.40**, VIT **2.48**.
- Una nueva instancia `Legendario +0` proyecta Defensa **14.80**, VIT **2.96**.
- Si alguien mejora la Rara a `+3`, su Defensa sería **13.45** y su VIT **2.69**, con el mismo `instanceId`.
- Equiparla no cambia el aspecto del héroe, solo estadísticas. Los bonus deberán reflejarse tanto en la pantalla Atributos como en combate en P4.

Estos cálculos siguen el multiplicador de v3.6; NO se deben presentar como atributos ya aplicados hasta integrar equipo.

## Ejemplo de economía / recetas

**Antiguo** `ingot_iron`: 3 x `ore` genérico. Se preserva para no romper partidas.  
**Nuevo, propuesto** `p2_smelt_iron`: 3 x `hf_ore_iron` → 1 x `ingot_iron`.  
**Nuevo, propuesto** `p2_armor_iron_chest`: 6 x `ingot_iron` + 2 x `hf_smithing_flux` → **Pechera de hierro +0** (rareza generada por separado).

La misma separación existe para minerales de cobre/plata/oro. No se convierte el material genérico antiguo en un metal específico arbitrario.

## Comprobación ejecutada en esta conversación

Se cargó directamente el **código JS nuevo** junto al catálogo JSON y las recetas que ahora están en GitHub, y se ejecutaron **31 casos de la suite P2: 31 PASS, 0 FAIL**, en V8 con funciones de aserción equivalentes a las del test Node (NO es una ejecución del runner Node): 47 IDs/32 recetas, seis rarezas, inyección +9 bloqueada, valores de stats, dos dagas distintas, equipamiento repetido rechazado, mineral específico obligatorio, recetas legacy intactas, transferencia preservando identidad y +3, amuleto fuera del HUD y otras reglas de P2.

**No se ejecutaron en Codespaces** el comando Node, el build ni pruebas Android/navegador. Por eso la suite [`tests/catalog-p2.test.mjs`](../../../tests/catalog-p2.test.mjs) queda lista como test de regresión reproducible, pero sin atribuirle resultados que todavía no tiene.

```bash
git checkout p2-highfly-master-catalog-20261121
npm run qa:catalog:p2
```

## Bloqueos expresos y decisiones por resolver antes de P4

1. Solo tres equipos tienen transacciones/visuales de equipar funcionales v3.6; el resto son **P2 data**, no drop vivo.
2. Uno de los objetos, `hf_amulet_basic`, **no tiene ranura aprobada**. No se ha añadido ninguna a la UI.
3. Dagas izquierda/derecha son ahora dos ejemplares únicos en el contrato, pero la animación dual y el modelo deben probarse con el personaje real.
4. Se han encontrado rutas de iconos en el código, **pero no los archivos `public/highfly` en el árbol GitHub auditado**. Es imprescindible verificar los recursos del despliegue aprobado, sin reemplazar/alterar los 60 iconos de referencia del usuario.
5. La promesa `instanceId` requiere un **migrador sin pérdida** de los viejos `gearTraits` con conteos; no hay que borrar copias ni resets de mejoras existentes. Consulta [plan de migración](INTEGRATION_AND_SAVE_MIGRATION.md).
6. El código de comercio es **simulación pura**, no un servidor/mercado. Los modelos y audios de ClaudeCraft con permisos no libres quedan excluidos.
7. Las **20 recetas nuevas** y su balance son propuestas P2, sujetas a futuras pruebas; las 12 anteriores no han sido modificadas.
8. Antique/Ancient permanece para P6: no se importa como rareza extra.

## Próximo gate

**P2.1:** revisión final del catálogo/lotes e iconos físicos, estabilidad de stats propuestos y compatibilidad de materiales.  
**P3:** UI/HUD premium de los 12 apartados sobre una rama separada y con respaldo.  
**P4:** integración real del primer bucle mineral → fundición → arma/armadura +0 → Bolsa → equipo → bonus combate/atributos → guardado.  
**P5:** monstruos, mundo y economía.  
**P6:** Ancient.  
**P7:** SOURCE privado.

**El propósito es construir HIGHFLY RPG, no solo acumular listados de objetos de otros juegos.**
