# HIGHFLY F0.8 — Un personaje KayKit universal (FREE) y combo Unsung intacto

## Diagnóstico y reparación
La variante F0.7 mostraba una cabeza demasiado grande y un cuerpo raro. Se habían superpuesto una malla FREE original de proporciones chibi, copia CPU de skinning, luces y un segundo renderer WebGL. Ese enfoque no recuperaba la estilización HIGHFLY Anime V6.6.

**Reparación:** Reutilizar el algoritmo matemático V6.6 conservado en la rama privada P6.8: una deformación espacial CONTINUA y consistente para los vértices de los seis cuerpos skinned + las posiciones de sus 41 huesos. Luego adaptar pistas posición/rotación/escala de los 76 clips embebidos del GLB FREE a esa misma pose de reposo. No usar SOURCE privados dentro del repositorio público.

La malla usa ahora `HERO_VERT` exportado desde `src/anim/hero.js` original de Unsung. Es el mismo shader de skinning empleado por el héroe de Unsung, con muestreo de textura CC0 KayKit. Una sola escena, una sola cámara y un solo contexto; sin CPU, overlay ni PBR externo.

## Qué es realmente jugable
- Un solo `Player` Unsung, un solo actor KayKit; no nueve clases ni party
- Movimiento, correr, caminar, salto simple y joystick nativo HIGHFLY + Unsung
- ROLL físico de Unsung, duración y i-frames intactos, con visual 360°
- DASH físico HIGHFLY con frenada y i-frames, antes validado con cápsula y colisiones
- ATK 1→2→3: `Player.attack`, `comboStep`, hit windows y daño originales; visual KayKit más cinta de filo
- 76 clips originales FREE retargeteados y consultables mediante `availableActions`; NO significa que 76 skills, natación animada, escalada, fabricación o parkour sean ya jugables

## Criterios de aceptación obligatorios
- 41 huesos del glTF KayKit FREE
- seis mallas de cuerpo renderizadas por GPU (cabeza, torso, brazos y piernas)
- cociente de altura de cabeza / cuerpo estilizado entre .17 y .35
- 76 clips, 8.712 tracks preservados en esta versión
- 14 estados que cubren ROLL, DASH, 3 combos, salto, correr, etc.
- la **tubería multipaso real de Unsung** debe renderizar el cuerpo frente a la espada, no solamente una escena THREE independiente
- compilar legal: solo FREE CC0, Unsung MIT, sonidos acreditados; no copiar paid SOURCE ni medios ClaudeCraft
- prueba final de dispositivo S23 Ultra sigue siendo necesaria (no se simula en CI)

## Resultado CI de laboratorio 18/11/2026
**PASS**: 76 clips, 14 estados, 41 huesos, 6 partes, headRatio .294, 8.712 pistas, 1.314 píxeles distintos de cuerpo en pipeline Unsung, ROLL 180° en mitad de acción y estela de espada. La física en el mundo plano conserva ATK 1→2→3, DASH, ROLL e i-frames.

La compilación de laboratorio puede aprobar y Android todavía fallar por hardware, FPS o carga de mundo. Nunca etiquetar esa prueba como validación Samsung.
