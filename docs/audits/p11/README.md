# HIGHFLY — P1.1 | CATÁLOGO PRIORITARIO, EQUIVALENCIAS Y OBJETOS +0

**Fecha:** 2026-11-21  
**App aprobada:** Premium v3.6 — `bf88ecdcef64337083146caad2390a6d147f30cf`.  
**Estado de P1.1:** documentación y validación estática completadas, sin alterar código jugable. **P1 total no cerrado**: faltan todas las variantes heroicas/dinámicas y licencias de determinados medios.

## Regla oficial (confirmada por el usuario)

**TODOS los objetos nuevos de equipo nacen +0, sin excepción**. Si un monstruo suelta una pechera de hierro Rara, se obtiene **Pechera de hierro — Raro +0**. Si es Legendaria, **Legendario +0**. Igual para Mítico, fabricación, recompensa, evento o compra a NPC.

- Rareza = calidad y atributos de base definidos por sus reglas; no significa que venga mejorada.
- `+1 ... +9` = **exclusivamente una mejora hecha por un jugador**, consumiendo recursos y actualizando la misma instancia `instanceId`.
- Si esa pechera alcanza `+3` y el jugador la comercializa, el comprador recibe **exactamente ese ejemplar +3**, con la misma rareza, stats y procedencia; NO vuelve a +0 ni se convierte en un item nuevo.
- El intercambio entre jugadores es una funcionalidad **futura**, NO implementada en la v3.6.
- **Un solo Cazador Universal** que puede aprender diferentes skills sin restricciones de clases.
- Cambiar **arma** puede cambiar modelo visual tras adapter verificado. Equipar **armadura/accesorio** cambia únicamente ícono/ranura/bonos, jamás el modelo 3D por ahora.

## Datos reales reunidos

| Fuente | Disponible | Condición |
|---|---:|---|
| HIGHFLY v3.6 | 19 plantillas + 12 recetas | Código y referencias aprobados; sólo tres equipables |
| ClaudeCraft `v0.44.7` | 1.488 registros de objetos fuente (sin todos los heroicos) | MIT del código, medios por archivo aún por validar |
| Recetas ClaudeCraft | 175, con 106 materiales distintos | Referencias, no recetas transferidas automáticamente |
| KayKit FREE | 519 modelos de cuatro packs CC0 | No significa 519 equipamientos |
| Emberfall | 6 armas fuente, 9 piezas de configuración | Media independiente pendiente de permisos específicos |
| HIGHFLY P1.1 | **47 plantillas prioritarias**: 19 preservadas + 28 nuevas propuestas | **No** están activadas en app las 28 nuevas |
| Equipo P1.1 | 20 plantillas de arma/escudo/armadura/joya | **Todas** contemplan inicio +0 |
| Familias de armas | 11 estilos | Dagas dobles = dos instancias de la misma plantilla daga |
| Tesoros upstream | 32 familias / 96 variantes | 64 filas posiblemente consolidables, NO fusionadas a ciegas |

## Documentos entregados

1. [Política obligatoria +0 y conservación al comerciar](EQUIPMENT_BIRTH_PLUS_ZERO_POLICY.json)
2. [12 escenarios de aceptación](EQUIPMENT_LIFECYCLE_ACCEPTANCE_CASES.json)
3. [Catálogo prioritario con sourceRefs, derechos y modelos](HIGHFLY_PRIORITY_CATALOG.json)
4. [Catálogo prioritario CSV](HIGHFLY_PRIORITY_CATALOG.csv)
5. [Equivalencias semánticas y 32 familias Hoard](SEMANTIC_EQUIVALENCE_REVIEW.json)
6. [Equivalencias semánticas CSV](SEMANTIC_EQUIVALENCE_REVIEW.csv)
7. [Primera cadena de loot → mineral → lingote → forja → stats → save](FIRST_REAL_LOOT_CRAFT_EQUIP_SLICE.json)
8. [Gates técnicos de integración sin romper la v3.6](INTEGRATION_GATES_AND_V36_RISKS.md)
9. [Validador reproducible Node](verify-p11.mjs)

## Validación estática realizada en esta sesión

Se leyeron **en GitHub** los archivos de la rama y se comprobó que: los 47 IDs HIGHFLY son únicos y preservan los 19 aprobados; todas las plantillas de equipo nacen +0; la única identidad es `UNIVERSAL_HUNTER`; las armaduras/joyas no tienen meshes; los 11 estilos apuntan a plantillas existentes; todos los **38** enlaces fuente ClaudeCraft, **4** enlaces de armas Emberfall y **7** referencias a modelos FREE KayKit existen; 32 familias Hoard contienen 3 variantes cada una y esas **96** entradas están en el catálogo upstream; se mantienen los 12 escenarios de aceptación; plata y oro no se atribuyen falsamente al catálogo WOC de minerales.

**Resultado de comprobación estática en la sesión:** PASS sin errores.  
**IMPORTANTE:** NO se ejecutó el validador Node en Codespaces, NO se ejecutó el juego y NO se probó inventario/equipamiento/commerce con navegador. Los escenarios son expectativas para el próximo código real, no pruebas de gameplay superadas.

Para reproducir la validación del catálogo desde Codespaces:

```sh
git checkout audit-rpg-items-ancient-v36-20261121
node docs/audits/p11/verify-p11.mjs
```

## Hallazgos sobre modelos y fuentes

- **KayKit CC0 confirmado**: `sword_1handed`, `sword_2handed`, `dagger`, `axe_1handed`, `staff`, `wand`, `shield_round`. Hay 7 enlaces visuales explícitos en el catálogo prioritario; la presencia del archivo no prueba funcionamiento del rig de un estilo nuevo.
- **Sin modelo verificado en los cuatro packs FREE auditados**: arco tradicional, maza, orbe, lanza (Emberfall sí lista una lanza que necesita revisión multimedia/rig). No publicar modelos SOURCE privados.
- **Mineral de cobre y hierro en ClaudeCraft**: `copper_ore`, `iron_ore`. Minerales de plata/oro nuevos HIGHFLY son propuestas propias. La v3.6 sí posee cuatro **lingotes** distintos, pero sus recetas consumen `ore` genérico.
- **Relaciones ≠ duplicados exactos**: una espada de fuego Emberfall y una espada de aprendiz HIGHFLY comparten estilo, pero no se presupone que sean el mismo ítem. Lo mismo para las armaduras de una ranura, cuyo lore/stats distintos se conservan hasta revisión.
- **No importar clasificaciones de clases** del MMORPG de origen; nuestras plantillas son para cazador universal.

## Qué sigue

**P1.2, antes de finalizar P1:** verificar `buildHeroicVariants` y drops especiales que el catálogo de 1.488 aún no contabiliza totalmente; cerrar grupos RNG/quest/heroicos y procedencia multimedia sensible. Es un gate de veracidad, no excusa para cambiar la app aprobada.

**P2:** crear tabla maestra en español con definiciones únicas, receta/profesión/estación/loot/restricciones y plan de iconos; una sola economía. **P3:** las 12 correcciones UI/HUD aprobadas. **P4:** la primera integración funcional sin armadura visual. **P5:** economía/loot/oficios expansivos. **P6:** Ancient sólo cuando todo anterior funcione.

El archivo del juego y el respaldo no fueron editados en P1.1.
