# HIGHFLY F0.12.2 — Correcciones de ataque direccional, pendientes, oxígeno y editor HUD

**Rama:** `f0122-directional-attack-hud-slope-oxygen`  
**Backup anterior intacto:** `backup-f0116-stable-2026-11-18`.  
**Base de F0.12:** `6e4e6246b5da5a3d115ea938a5231a48d6a3883e`.  
**Referencia:** video de usuario `1000470843.mp4` (~210 segundos, S23 landscape).

## Causas encontradas y correcciones
1. **ATK direccional llegaba tarde.** La dirección se registraba en `pointerup` incluso si el ataque normal había empezado a los seis frames. F0.12.2 procesa el gesto en `pointermove` con umbral 13 px, muestra una pista textual, y propaga `highflyAbilityAim.attack` en el mismo frame de `pressed.attack`. La pulsación sostenida empieza ahora tras nueve frames y no pisa los gestos direccionales.
2. **Cortes duales compartían el mismo clip.** Se asignaron clips reales diferentes al gesto izquierdo y derecho (sin inventar animaciones). El VFX sigue las puntas físicas independientes de cada espada. Pequeña guía procedural adicional para distinguir las cuatro direcciones, que comparten a lo sumo tres clips reales por estilo.
3. **Subida rápida atacando en montaña.** La física de Unsung tiene corrección de altura automática del terreno y el Flow Combat reinyectaba velocidad a cada frame. Dos barreras: filtrar pendiente de terreno >45° antes del integrador y rechazar escalones ascendentes físicamente imposibles tras el integrador. No modifica el mundo original, ni el botón TREPAR explícito.
4. **ATK sin gasto de Energía:** ataque normal 1/2 cuesta 3 puntos, golpe 3 cuesta 5 puntos; los ataques pesados conservan su coste original. El movimiento puede seguir fluyendo sin coste excesivo.
5. **Oxígeno demasiado rápido:** 100 O₂, consumo sumergido 2/s normal (50s), 3/s al nadar rápido (33,3s), regeneración 16/s (6,25s desde cero). El oxígeno no baja fuera de la inmersión.
6. **HUD:** diseño comprimido en dos columnas a 330×101px, manteniendo HP/EN/MP/O₂ y misiones debajo. Editor HUD en botón superior derecho, permite arrastrar la tarjeta y los botones, escalar con +/−, guardar posiciones normalizadas en localStorage y restaurar con RESET. No necesita cuenta ni nube.

## Verificación
- CI final de código `e24e54657cc050b3ab792f125189c980af5e5731`: 23/23 tests de origen, 58/58 tests de Player sintético; 105 clips de 7 modos de arma comprobados en WebGL real.
- Chrome Android simulado: ATK-izquierda registrado **antes de soltar** el dedo, HUD visible 330×101px, arrastrar y guardar posición persiste después de recargar.
- QA de subida de pendiente de 60° durante tres segundos de ATK sostenido supera el umbral anti-exploit.
- Aún requiere verificación de la sensación de la secuencia de ataques y de las rocas reales en Samsung; tests no prueban fluidez subjetiva ni todas las alturas del mundo.
- No se cambió F0.12 de respaldo ni el laboratorio paralelo F0.12.1 de profesiones. No hay recursos de pago SOURCE en el repositorio público.

## Cómo probar
- Deslizar ATK horizontal o verticalmente **sin levantar el dedo hasta que se vea el texto** de dirección.
- Mantener ATK: combo normal 1-2-3; movimientos/direcciones independientes mediante joystick izquierdo.
- Escalar montaña muy inclinada sin TREPAR mientras se pulsa ATK: NO debe ganar altura de forma acelerada.
- Bucear 10 segundos: O₂ debe perder solo ~20 puntos normalmente, no agotarse.
- Pulsar HUD → arrastrar botones/tarjeta → +/− para escala → GUARDAR; recargar, comprobar persistencia. RESET restaura la distribución.
