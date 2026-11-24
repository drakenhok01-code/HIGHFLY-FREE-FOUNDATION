# HIGHFLY UNSUNG 11 — P5.2.0 Laboratorio de ciudades creado con planificación asistida por IA

Fecha: 2026-11-24.

## Respaldo inmutable a nivel de rama
- Última versión jugable aprobada P5.1.4: `backup-p514-last-playable-before-settlements-20261124` (creada desde `p514-moon-eclipse-final-20261124`).
- Controles de clima movidos a Opciones P5.1.5: `backup-p515-climate-options-before-settlements-20261124`.
- Laboratorio aditivo solamente: `p520-settlements-ai-lab-20261124`.
- NO tocar main, terreno Unsung, originales 8 agujas, historias, misiones, mapas de altura, agua, cascadas, cielos P5.1.4, físicas de escalera ni calidad gráfica.

## Plan geográfico conectado a la historia
1. **Arvelia**: el distrito urbano se busca a la espalda de Dawn Terrace, sin tocar la terraza, mirador, aparición del jugador ni la gran escalera. Gremio de Arden (Misiones), forja de Borin (Forja), mercado de Elisia (Bolsa), Posada del Alba (Personaje). Esta primera versión construye exteriores de arquitectura nativa con entradas abiertas y BVH, no interiores detallados.
2. **Campos de Arvelia**: al lado del área de jabalíes **pero fuera del radio de agresión y la posición de Brann**. Molino de Lia, granero, parcela de cultivo.
3. **Embarcadero de Lumeria**: se intenta colocar sobre superficie seca próxima a la costa real detectada para los cangrejos, dejando a Mira intacta. Lonja de Ren, almacén y punto de pesca. No se genera muelle flotante ni barco sin colisión.
4. **Puesto Minero del Umbral**: en la cordillera, alejado de las agujas y las escaleras de piedra. Fundición de Grom, depósito, mineral y horno.
5. **Campamento de los Susurros**: junto al bosque de lobos, a distancia segura de Sera y de los animales. Refugio de Mirel, talas.

## Sistemas enlazados
- Arquitectura: `MeshBuilder` y materiales nativos Unsung MIT; una malla y una BVH por asentamiento.
- Terreno: `groundHeight`, comprobación de aguas, alturas en esquinas, búsqueda determinista, omisión de colocaciones inseguras.
- Protección: origen Dawn, ocho Spires, escalera central y radios de las tres cacerías ya jugables.
- NPC: reutilización de la versión FREE KayKit CC0 del propio juego; no redistribuir KayKit SOURCE privado.
- Interacción: `USAR` y cuadro de diálogo que abre pestañas HIGHFLY existentes. No se afirma que un NPC tenga comercio nuevo ni misiones no implementadas.
- Profesiones: se registran nodos físicos reconocidos por las reglas HIGHFLY actuales (talar, minar, pescar, cultivar y fundir); requieren herramientas como siempre.
- Guardados: el laboratorio no altera salvados de jugador ni datos persistentes de ciudades. Lo que se ve es una distribución reproducible definida en código.
- Caza: se dejan sin duplicar ni reubicar los lobos, jabalíes, cangrejos, Sera, Brann y Mira. Se siguen respetando los cadáveres saqueables y la bolsa real.
- Los NPC originales de Unsung conservan su sistema de aparición, paseo y misiones.

## Cómo probar sin riesgo
- Es opt-in: al activar una compilación P520 con `?hfcities=1`, se instalan las estructuras.
- Sin el parámetro, la versión P520 se comporta como la base P5.1.5, sin crear distritos.
- Un reinicio sin ese parámetro borra las estructuras de prueba; no hay edición persistente del mundo.
- El laboratorio NO se publica en el sitio aprobado ni se fusiona sin QA de Samsung S23 Ultra.
- En GitHub Actions `highfly-p520-safe-build.yml` hay una construcción aislada descargable y una auditoría real de las matrices de terreno comprimidas. Si un edificio se omite, se registra en `P520_WORLD_LAYOUT_AUDIT.json`.

## Pendientes explícitos
- Verificar la cantidad y colocación real de edificios en el terreno del mapa original y sus entradas/techos.
- Prueba de jugador desde Dawn Terrace, descenso por las escaleras, acceso a Arvelia y recorrido de plaza-gremio-herrería.
- NPC visibles a distancia, sin pose T, diálogo y botón táctil USAR.
- Realizar acciones de pesca, tala, minería y herrería con herramientas legítimas, sin obsequios de depuración.
- FPS en dispositivo Android; objetivo de usuario 50 FPS estables, margen 45. No degradar calidad para forzar éxito.
- Optimizar geometría/culling/instancias si este primer lote produce caída de FPS.
- Edificios completos con interiores, comercio persistente, scripts de misiones adicionales, portales y mazmorras **no** son parte de P520.
- El editor WORLD FORGE se recupera como alternativa si la composición automática no satisface visualmente.
