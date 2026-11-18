# Matriz de movimientos y realidad física

| Movimiento | Unsung \`src/game/player.js\` | KayKit FREE (animación) | HIGHFLY Android F0 | Estado |
|---|---|---|---|---|
| caminar / correr / sprint | Física existente | Walking_A, Running_A | Joystick y CORRER conectados al Input | Requiere visual Samsung |
| salto | Salto y gravedad existentes | Jump_Start/Idle/Land | SALTO al Input | Requiere visual Samsung |
| doble salto | No existe en controlador original | El clip Jump no añade impulso físico | No implementado | AUSENTE |
| ROLL | Estado roll + cápsula + i-frames | Dodge_Forward/Backward/Left/Right (no son roll garantizado) | ROLL envía dodge | Revisar orientación, altura y suelo |
| DASH libre | No: dash original es ataque con sprint | Clip de dodge, no física DASH | Botón bloqueado | AUSENTE |
| natación | _swim, flotación, salida del agua | Clip de natación no confirmado en Knight FREE | Física original retenida | Requiere visual |
| ataque 1→2→3 | Tres hit windows/dmg reales | 1H_Melee_Attack_* | ATK al mismo Input | Requiere combate real |
| ataque aéreo picada | plunge implementado | Clip Jump/attack por sincronizar | ATK disponible | Requiere visual |
| trepar / escalar / talar / minar / pescar | No verificadas como acciones completas | Sin prueba de mecánica física | No implementadas | PENDIENTE |
| backflip | Animación original de caída en picada, NO backflip libre | No validado | No implementado | PENDIENTE |

**Rig**: \`Rig_Medium\` / \`Rig_Large\`, socket, retarget, pies contra cápsula 1.82 de Unsung, root motion y multiplicador de escala siguen pendientes de prueba GLB y WebGL. Ningún clip se registra como habilidad completada solo por existir.
