# HIGHFLY F0.2 · Auditoría de movimientos (18 noviembre 2026)
Criterio: separar física real, animación GLB existente y pendientes. El CI publica **KAYKIT_ANIMATION_INVENTORY.json** con la lista exacta de animaciones del Knight FREE CC0 (no SOURCE).

| Acción | Física Unsung | KayKit FREE | Estado |
|---|---|---|---|
| Caminar, girar, laterales, diagonales | Movimiento cámara-relativo | Walking_A (más variantes si constan en GLB) | Simulación cápsula 8 direcciones |
| Correr / sprint | Existente | Running_A/B | Integrado para prueba |
| Salto, caída, aterrizaje | Existente | Jump_Idle / Jump_Land | Adaptación visual inicial |
| Doble salto, backflip autónomo | Ausente | Jump_Full_Long NO implementa doble salto | NO |
| ROLL / evasión | Roll 0.62s con i-frames 0.06–0.44 | Dodge_Forward ≠ rolido completo | Visual provisional |
| DASH independiente | No, Unsung dash es golpe en sprint | Dodge no es dash físico | NO, botón bloqueado |
| Ataque 1–2–3 | Daño real, hit-windows y stamina | Tres 1H_Melee_Attack_* | Mapeado, validar impactos/arma |
| Ataque pesado / picada | Heavy / plunge funcionales | 2H_Melee_Attack_Slice / Jump_Full_Long | Visual provisional |
| Bloquear / desviar / parry | Mecánicas parciales originales | Block* clips candidatos | No integrado |
| Arco, magia, habilidades, lanzas | No en HIGHFLY F0.2 | Buscar Ranged*/Spellcast* entre nombres inventariados | No integrado |
| Flotar y desplazarse en agua | Física _swim original | **NO hay natación animada verificada en Knight FREE** | No es nado completo |
| Trepar, escalar, parkour, vault | No implementado | Animaciones no validadas | NO |
| Sentarse, recostarse, levantarse, gesto, recogida | No implementado | Verificar Sit*/Interact/PickUp en JSON real | No integrado |
| Picar, talar, pescar, fabricar, cocinar | No implementado | Acción y sistema faltantes | NO |
| Daño / muerte | Player original | Block_Hit / Death_A | Animación inicial |

**Unsung:** se conservan terreno, ciudades, físicas, enemigos y combo. **KayKit FREE:** auditado el modelo Knight/glb de origen oficial con SHA-256, pero todavía NO todos los kits FREE ni el SOURCE. **Emberfall:** estudiar estados de skill, ataques, VFX, audio y eventos; todavía no se han importado ni auditado todos sus medios individualmente. **ClaudeCraft:** estudiar sistemas y estados, NO importar media sin licencia permisiva propia. **SOURCE:** integrar solo en privado tras revisión específica. La compilación y las pruebas de un Player aislado NO equivalen a jugar en WebGL Android.