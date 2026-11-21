# HIGHFLY P2 → P3/P4 | Contrato de integración sin romper v3.6

**Estado:** plan técnico, NO aplicado al código jugable.  
**Base aprobada:** `bf88ecdcef64337083146caad2390a6d147f30cf` — backup `backup-v36-approved-video-review-20261121`.  
**Rama P2:** `p2-highfly-master-catalog-20261121` (derivada de auditoría P1.2, nunca del `main` activo).  
**Ley HIGHFLY:** todo equipo **NUEVO** siempre se crea **+0**, de todas las rarezas, incluso en jefes/forja/recompensas/tienda. Las mejoras +1…+9 son exclusivamente del usuario y viajan con la misma instancia al comercializarse.

## 1. Lo que P2 aporta ahora

- [`MASTER_CATALOG_47.json`](MASTER_CATALOG_47.json): 19 plantillas existentes preservadas + 28 HIGHFLY nuevas, 20 plantillas de equipamiento, base stats HIGHFLY separadas de licencias/asset IDs upstream, slots, estados reales y filtros legales. **17 piezas nuevas de equipo** requieren implementación, incluido **un amuleto bloqueado por decisión de ranura**.
- [`RECIPES_32_AND_PROFESSIONS.json`](RECIPES_32_AND_PROFESSIONS.json): 12 recetas v3.6 **congeladas** + 20 recetas P2 **en propuesta**; 15 oficios/disciplinas catalogados, **8 con icono de profesión declarado** en v3.6.
- [`ACQUISITION_AND_ASSETS_47.json`](ACQUISITION_AND_ASSETS_47.json): enlaces de loot fuente y estados de recetas/arte, **sin copiar probabilidades de ClaudeCraft**, sin GLBs no verificados y sin activar drops.
- `src/highfly/p2/catalog-domain.mjs`: lógica **pura y desconectada de producción** para validar catálogo, crear equipo siempre +0, proyectar stats, previsualizar ingredientes, contabilizar dos dagas distintas y simular conservación de una pieza mejorada al transferir. **NO** importada por la app ni por su bootstrap.
- `tests/catalog-p2.test.mjs`: regresión automatizada. Ejecutar `npm run qa:catalog:p2` en Codespaces. La lógica se revisó mediante casos aislados; el comando de Codespaces y el navegador no se ejecutaron en esta sesión.

## 2. Migración de guardado sin perder equipo ni progresos

Estado REAL v3.6:
- `src/highfly/rpg-core.mjs`: `SAVE_KEY = 'highfly-rpg-f014-v1'`, `schema:4`, `ITEM_DEFS` 19, `RECIPES` 12.
- `src/highfly/rpg-itemization.mjs`: 3 `GEAR_IDS`; `gearTraits.bag[itemId]` es un array de rasgos `{id,rarity,plus}` por copia, **sin `instanceId`**; `gearTraits.equipped[slotId]` tiene rasgos de equipado.
- `src/highfly/rpg-equipment.mjs`: 10 ranuras, pero sólo tres `EQUIP_ITEM_DEFS` admitidos. `normalizeEquipped` descartará armadura no registrada; esto exige cambio explícito, no parche de un solo campo.

Migración propuesta P4 (debe hacerse de forma **atómica y testeada**):
1. **Leer** el guardado v3.6, sin sobrescribirlo, y generar un snapshot/backup de recuperación.
2. Por cada pila antigua de espada/escudo/mandoble, crear **una identidad única por copia**. Para cada índice del array `gearTraits.bag[id]` conservar exactamente la `rarity` y el `plus` anterior. Las copias excedentes respecto al array deben inicializarse en **+0** sin inventar ganancias.
3. Por cada pieza antigua equipada, convertirla en una instancia propia y mantener exactamente su rareza/mejora. No duplicarla en la Bolsa; en particular, la espada predeterminada de `right_hand` NO es una espada adicional en los contadores de la Bolsa.
4. **Nunca reiniciar un objeto antiguo +3 a +0 durante la migración.** La regla +0 se aplica a **nuevos ejemplares creados**, no destruye mejoras existentes hechas por el jugador.
5. Registrar el nuevo `schema:5` y utilizar una clave de guardado de prueba separada hasta validar idempotencia, conteos, ranuras, loot, upgrade, ascension y rollback.
6. Los contadores históricos de `ore` y `ingot` **permanecen**: no convertir 8 `ore` antiguos en 8 minerales de plata/otro metal. Las cuatro nuevas recetas de fundición consumen `hf_ore_copper`, `hf_ore_iron`, `hf_ore_silver` y `hf_ore_gold` respectivamente.
7. Integrar las nuevas plantillas **sólo** cuando `ITEM_DEFS`, ranuras, persistencia, equipar/desequipar y artes estén listos y testeados juntos.

## 3. Cómo deben verse y computarse las mejoras

**Rareza ≠ mejora.** Ejemplo de la *propuesta de balance P2*, no stats reales de gameplay:

| Objeto original HIGHFLY | Rareza | Mejora | Defensa calculada | VIT calculada |
|---|---|---:|---:|---:|
| Pechera de hierro | Raro | +0 | 12.40 | 2.48 |
| Pechera de hierro | Legendario | +0 | 14.80 | 2.96 |
| Pechera de hierro (mejorada por jugador) | Raro | +3 | 15.55 | 2.69 |

Los valores P2 utilizan la función actual `enhancedStats`: factor `1 + indiceRareza*0.12 + mejora*0.035`. Para el atributo VIT, `attributeBreakdown` actual trunca el bono. En P3/P4 deberemos decidir formato de visualización (bonos decimales vs total entero) sin mentirle al jugador. **Todavía no están activas esas estadísticas**.

La armadura y la joyería permanecen **STATS_ONLY_NO_3D**. La entidad de personaje nunca se reconstruye al equipar pechera/casco/botas. Si cambia el arma principal o la mano izquierda, el cambio visual se produce **sólo cuando la malla y rig sean compatibles**. El arte debe quedar separado de la simulación de equipo.

En `src/highfly/premium-rpg.mjs`, el cálculo actual de atributos usa `attributeBreakdown(level,training)` sin pasar `equipmentBonuses`, aunque el método permite `attributeBreakdown(level,training,equipment)`. El futuro P4 deberá conectar bonus de equipo a UI Y combate y comprobar reducción/suma real, no solamente dibujar números.

## 4. Bloqueos intencionales

- **Amuleto** `hf_amulet_basic`: *definido* pero no equipable; v3.6 no tiene ranura propia. No ocupar `necklace` a escondidas ni agregar controles premium sin autorización. El collar sí usa la ranura existente.
- **Dagas dobles**: dos `instanceId` reales `hf_dagger_basic`, una por mano. Datos habilitan ambas ranuras, pero la animación dual y el kit 3D no están verificados: el gameplay actual no se altera.
- **Arco, lanza, maza, orbe**: no se adjudica un modelo existente sólo por parecerse; la mayoría no tienen malla verificada en los cuatro packs FREE. No sustituir un arco por una ballesta sin indicarlo.
- **Iconos premium**: `src/highfly/premium-assets.mjs` declara 60 iconos, incluyendo reservados, pero al inspeccionar el árbol GitHub de la rama de referencia no aparecieron archivos `public/highfly/user-icons`. Por eso el catálogo distingue **referencia de código** de **imagen material disponible** y no publica un icono ficticio. Conservar todo el diseño v3.6 y verificar el flujo de build/despliegue de imágenes en P3.
- **Licencia**: los datos de origen provenientes de ClaudeCraft son analogías referenciales; no copiar imágenes, modelos, audio o textos narrativos de derechos prohibidos. KayKit SOURCE comprado se deja **privado**.
- **Comercio**: `previewTransferInstance` es una demostración pura. No autentica cuentas, firma pagos, bloquea concurrencia ni opera un mercado real. Un servidor deberá validar propietario y transacción única más adelante.

## 5. Gates para dar por cerrada una integración real

1. Los 19 objetos anteriores y 12 recetas anteriores funcionan tal cual tras migrar; **cero pérdida de save**.
2. 47 plantillas cargables y 20 equipos con atributos y procedencia, sin errores ni iconos falsos.
3. Primer ciclo **veta de hierro → mineral de hierro → lingote de hierro → pechera de hierro → Bolsa → equipar → Defensa/VIT → guardar/cargar** funcionando de verdad.
4. Cada objeto creado de cualquier origen/rareza está en **+0**, excepto ejemplares mejorados **posteriormente por un jugador**.
5. Los mismos `instanceId` persisten al equipar/desequipar y vender cuando exista mercado. No se duplican ítems.
6. Personaje universal, sin clases, mismo modelo 3D con armaduras; armas visibles solo con adapter compatible.
7. QA en navegadores PC y Android horizontal (Samsung S23 Ultra objetivo), FPS y errores en consola, sin presentar pruebas no ejecutadas como superadas.

**P2 es la definición verificable de contenidos y lógica aislada; el cambio al juego jugable corresponde a P3/P4.**
