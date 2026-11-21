# HIGHFLY — CONTRATO ARQUITECTÓNICO: UN CAZADOR UNIVERSAL Y ARMADURAS SOLO ESTADÍSTICAS
Fecha: 2026-11-21. Aprobación de diseño del usuario. **Este documento especifica P2/P4; no declara que esas armaduras estén implementadas en P1.**

## Decisión cerrada

**Existe exactamente un único Cazador Universal persistente.** No se implementa party ni cambio de personaje o clases. El jugador puede aprender distintas skills y usar estilos de arma si sus adaptadores mecánicos son reales.

**Visual 3D, versión actual:**
- **Armas**: sí cambian visualmente al equipar, SOLO para estilos con mesh y animación confirmados.
- **Armaduras, accesorios y joyas**: NO cambian ni reemplazan el cuerpo, traje, cabeza, pelo ni armadura visual del KayKit. No se descargan ni renderizan GLB para equiparlas. Se muestran como iconos de objetos en Bolsa/Personaje.
- **Monstruos**: pueden entregar armaduras como loot funcional; equiparlas aumenta estadísticas y muestra los datos en Personaje/Atributos. Ninguna parte necesita convertirse en mesh para que la estadística funcione.

## Implementación por capas (sin copiar clases de ClaudeCraft)

**1. Plantilla** `itemDefs[id]`, reutilizada entre copias: ID, nombre español, subcategoría, slot, stats, valor, rarezas permitidas, icono original y procedencia/licencia. Un modelo 3D para armadura NO es requisito.
**2. Instancia individual**, obtenida por loot o forja: `instanceId`, `templateId`, `rarity`, `plus`, `stats` o semilla de propiedades, `source`, `crafter` (opcional), `createdAt` opcional. Dos petos iguales no pierden identidad; mejora y comercio operan sobre `instanceId`.
**3. Inventario único**: materiales apilables por `templateId`; equipos por instancia. La profesión puede generar materiales, pero la Bolsa y el equipo comparten la misma fuente de datos. Evitar doble inventario divergente.
**4. Loot**: tabla por `mobId/zoneId/levelBand`; RNG determinista o testeable; filtrar si drop de misión requiere misión activa. Asignar y persistir instancia **una vez**; no otorgar loot repetido por evento de muerte duplicado.
**5. Equipar**: validar ranura compatible, posesión real, estado del inventario; mover una instancia a un slot y devolver la anterior a la Bolsa, de forma atómica. Revertir sin cambios cuando la operación falla.
**6. Estadísticas**: una sola función pura `equipmentBonuses(equippedInstances, definitions)` suma atributos de armas, escudos, armaduras y accesorios según rareza y +N. El valor final debe quedar visible en Atributos y aplicado al combate; nunca modificar permanentemente los puntos BASE por equipamiento. Desequipar revierte únicamente el bono.
**7. Visual**: el adaptador de rig observa **solo** `right_hand`/`left_hand`, sin aplicar geometrías para slots `helmet, chest, gloves, shoulders, pants, boots, ring, necklace`. En pantalla sigue existiendo **el mismo personaje**.
**8. Guardado/migración**: versión de schema nueva, compatible con `SAVE_KEY='highfly-rpg-f014-v1'` y los objetos v3.6 existentes; nunca borrar `gearTraits` ni recompensas antiguas en una carga migrada.

## Compatibilidad con código v3.6 existente (inspección, no supuesto)

- `src/highfly/rpg-equipment.mjs` ya declara 10 ranuras: `helmet, chest, gloves, right_hand, necklace, shoulders, pants, boots, left_hand, ring`.
- `EQUIP_ITEM_DEFS` contiene **solo** `training_sword`, `training_shield`, `training_greatsword`.
- `normalizeEquipped` borra objetos no definidos en `EQUIP_ITEM_DEFS`: **antes de activar armaduras debe registrarse cada plantilla y su slot**.
- `equipmentBonuses` ya suma bonificaciones por cada slot presente; funciona como punto de extensión para equipo no visual, pero necesita integrar atributos `STR, AGI, VIT, PER, INT` y los modificadores usados realmente en combate.
- `src/highfly/rpg-itemization.mjs` restringe `GEAR_IDS` a las tres piezas iniciales; añadir armaduras **exige** ampliar su normalizador para que no desaparezcan rareza y +N tras guardar/cargar. Hoy las `gearTraits` no poseen `instanceId` individual.
- `src/highfly/rpg-core.mjs` `normalizeRpgState` persiste items/equipped/gearTraits pero valida items solo contra `ITEM_DEFS`. No otorgar equipo nuevo hasta tener definiciones y migración verificadas.
- `src/highfly/premium-rpg.mjs` computa `attrs=()=>attributeBreakdown(level,training)` SIN pasar bonos a ese desglose, aunque calcula `bonuses=()=>equipmentBonuses(...)` para otro panel. **Es obligatorio conectar la UI de Atributos con los bonos reales** si habrá STR/AGI/etc en armaduras; no basta con escribir stats en JSON.
- El `syncEquipment` de la UI llama `game.hero?.equip?.(index)` tras transacciones. Para **armaduras/joyas** debe evitar recargar/cambiar la apariencia del héroe; sólo los cambios reales de arma deberían actualizar el rig.
- Actualmente `gearTraits` transfiere variantes por array e índice; migrar a IDs de instancia bajo pruebas antes de inventar 100 equipos.

## Lote piloto posterior a P3 (P4)

Implementar un casco, pechera, guantes, hombreras, pantalón y botas de una familia inicial, más un collar y un anillo; cada objeto con **icono aprobado**, stats y método real de obtención (loot o crafting). No crear ni equipar mallas 3D para esas ocho piezas.

**Amuleto**: solicitado en el prompt, pero hoy NO existe su ranura en `EQUIP_SLOTS`. La UI necesita una decisión explícita de distribución del slot sin mover arbitrariamente el HUD aprobado. No bloquear la primera familia por esta ampliación.

## QA obligatoria

1. Loot armadura ➜ Bolsa sin duplicados, persistente tras recargar.
2. Equipar casco ➜ cambia stats, NO cambia modelo/animación/cámara/joystick.
3. Equipar una espada ➜ cambia el modelo visual y stats, sin perder casco.
4. Desequipar casco ➜ recupera en Bolsa y remueve bonos exactamente.
5. Intercambiar dos petos de rareza/mejora distintas conserva ambas identidades.
6. Guardar, recargar y migrar un save v3.6 sin pérdida de espada ni pociones.
7. Permitir al cazador equipar cualquier pieza permitida por nivel/ranura, **sin `requiredClass`** de ClaudeCraft.
8. En Android horizontal el icono, la rareza y los atributos se ven; 3D mantiene **un personaje**.
9. Ningún icono premium aprobado se reemplaza con placeholders ni se importa SOURCE a Pages.

**Orden:** P1 auditar → P2 catálogo → P3 pulido UI/HUD → P4 piloto stat-only → P5 loot/economía completos → P6 Ancient. Diseño de Ancient fuera de alcance actual.
