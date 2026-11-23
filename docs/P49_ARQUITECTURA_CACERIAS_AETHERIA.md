# HIGHFLY P4.9 — Auditoría de arquitectura y primera implementación de cacería

## Respaldo verificado
- Última publicación comprobada en GitHub Actions antes del cambio: P4.8.2 (run [45084450160](https://github.com/drakenhok01-code/HIGHFLY-FREE-FOUNDATION/actions/runs/45084450160), compilación + deploy **success**).
- Rama de resguardo exacta: `backup-p482-playable-20261122`, commit `c2a0627b284a51d6b1ee42cc8e73beb1825bfbcd`.
- P4.9 se desarrolla solo en `p49-three-hunting-spots-20261122`, aislada del sitio aprobado. No se modifica la rama `main`.

## Qué aprendimos de ClaudeCraft 0.45.8 (análisis de código, no assets)
Fuente: [levy-street/world-of-claudecraft, ef93e018](https://github.com/levy-street/world-of-claudecraft/tree/ef93e018f6196c5d9b8a0052eac6fb17d7b22a93).

1. [server/quest_command_wire.ts](https://github.com/levy-street/world-of-claudecraft/blob/ef93e018f6196c5d9b8a0052eac6fb17d7b22a93/server/quest_command_wire.ts) valida las órdenes de aceptar, entregar, abandonar y enlazar misiones antes de enviarlas al simulador. HIGHFLY adopta la *separación* entre interacción NPC, lógica de progreso y entrega, no copia el código.
2. [src/net/quest_snapshot_wire.ts](https://github.com/levy-street/world-of-claudecraft/blob/ef93e018f6196c5d9b8a0052eac6fb17d7b22a93/src/net/quest_snapshot_wire.ts) separa el registro fijo del ciclo de misiones mundiales y valida estados recibidos. HIGHFLY separa cacerías de NPC de la futura rotación de portales.
3. [src/game/corpse_loot_availability.ts](https://github.com/levy-street/world-of-claudecraft/blob/ef93e018f6196c5d9b8a0052eac6fb17d7b22a93/src/game/corpse_loot_availability.ts) separa botín disponible, derechos de recolección y recolección del cadáver. HIGHFLY ya separa `death → drop físico → USAR → Bolsa`.
4. [src/game/npc_cycle.ts](https://github.com/levy-street/world-of-claudecraft/blob/ef93e018f6196c5d9b8a0052eac6fb17d7b22a93/src/game/npc_cycle.ts) ordena NPC por cercanía y conserva la lógica de combate sin usar NPC como entidades atacables; HIGHFLY implementa interacción solo por proximidad.
5. El MMO usa servidor autoritativo. **P4.9 es una primera versión offline/single-player**: estados en localStorage, sin afirmar seguridad en red ni persistencia de cuenta.

**Derechos de uso:** la consulta de arquitectura no autoriza importar modelos con licencia «with the project only». HIGHFLY usa la base MIT de Unsung y el Knight KayKit FREE CC0 en el repositorio público. No se ha incorporado KayKit SOURCE de pago a Pages.

## Auditoría concreta de Unsung congelado
Fuente: [Leonxlnx/unsung-vale, 9f61b0d](https://github.com/Leonxlnx/unsung-vale/tree/9f61b0d80b18c6cf661f72372545b3f9214fb455).

- [src/game/enemies.js](https://github.com/Leonxlnx/unsung-vale/blob/9f61b0d80b18c6cf661f72372545b3f9214fb455/src/game/enemies.js) expone `KINDS`, `enemies.spawn`, combate, salud y evento `death`. Se agregan solo IDs prefijados `hf_` por una capa aditiva.
- [src/game/encounters.js](https://github.com/Leonxlnx/unsung-vale/blob/9f61b0d80b18c6cf661f72372545b3f9214fb455/src/game/encounters.js) conserva su campaña y encuentros original. HIGHFLY no modifica sus ubicaciones, grupos ni lógica.
- [src/game/game.js](https://github.com/Leonxlnx/unsung-vale/blob/9f61b0d80b18c6cf661f72372545b3f9214fb455/src/game/game.js) propaga eventos mediante `game.on(fn)` y `game.emit(type,data)`. P4.1 ya usaba `enemy/death` para loot; P4.9 escucha el mismo evento para EXP y contador de misiones.
- [src/game/people.js](https://github.com/Leonxlnx/unsung-vale/blob/9f61b0d80b18c6cf661f72372545b3f9214fb455/src/game/people.js) implementa distancia de interacción, conversación y retorno al juego. P4.9 añade nuevos NPC KayKit CC0 sin reescribir los del juego original.
- [src/world/layout.js](https://github.com/Leonxlnx/unsung-vale/blob/9f61b0d80b18c6cf661f72372545b3f9214fb455/src/world/layout.js) confirma 0 metros de nivel del mar, mesetas fijas y estanques elevados. La posición final de cangrejos se busca sobre tierra próxima al agua, con respaldo junto al estanque oriental cuando no se encuentra una costa transitable.

## Primer lote de contenidos P4.9
| Spot | Monstruo | NPC | Objetivo | Drop propio | EXP por muerte | EXP extra por entrega |
|---|---|---|---:|---|---:|---:|
| Bosque de los Susurros | Lobo del Bosque | Sera, exploradora | 3 | Piel de lobo | 12 | 50 |
| Praderas de Arvelia | Jabalí de la Pradera | Brann, granjero | 4 | Colmillo de jabalí | 14 | 65 |
| Costa del Valle | Cangrejo de la Orilla | Mira, pescadora | 3 | Caparazón de cangrejo | 10 | 50 |

Por ahora cada misión se acepta y entrega **una sola vez**; si un monstruo muere antes de aceptar la misión, da EXP y material, pero no cuenta para el encargo. El NPC y el futuro gremio podrán acceder al mismo registro de progreso.

- **Rendimiento:** máximo 3 ejemplares por spot (9 en total), activación cerca de 125 m, desactivación fuera de 165 m, reposición progresiva después de ~23 segundos. Son límites propuestos, sujetos a pruebas en S23 Ultra.
- **EXP:** HIGHFLY tiene progreso separado de resonancia original de Unsung. Las bonificaciones de equipo no alteran atributos base; se conserva el reparto 80 % nivel / 20 % entrenamiento real establecido en `attributeBreakdown`.
- **Loot:** cada criatura suelta un material propio y físico recogido con USAR; se guarda en la Bolsa real de HIGHFLY. Los íconos nuevos reutilizan TEMPORALMENTE pinturas y marcos existentes hasta aprobar arte específico.
- **Modelos:** los NPC comparten el rig KayKit FREE estilizado V6.6 en el demo público, diferenciados por colores. Lobos, jabalíes y cangrejos son mallas low-poly originales básicas de prueba; sustituir por modelos KayKit SOURCE adecuados únicamente en versión privada con licencia compatible.
- **Portales y mazmorras:** fuera de P4.9; diseñados para fases posteriores. No mezclar este encargo fijo con una misión temporal.

## Criterios de aprobación antes de declarar la versión jugable
1. GitHub Actions termina build, QA estática, prueba de misiones y smoke Chromium sin errores.
2. Cargan los 3 NPC, aparecen los 3 spots sobre terreno sólido y las criaturas tienen HP/daño reales.
3. Aceptar → matar N → botín USAR → Bolsa → volver al NPC → EXP extra y recompensa sin duplicados.
4. Las misiones originales de Unsung siguen funcionando.
5. Samsung S23 Ultra: verificar interacción touch, posiciones de zonas, visibilidad del NPC, sonidos y tasa real de FPS; **no afirmarlo aprobado por CI de escritorio**.
