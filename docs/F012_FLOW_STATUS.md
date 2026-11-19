# HIGHFLY F0.12 — Flow Combat + HUD 4 recursos + buceo 3D

**Branch:** `f012-flow-combat-hud-dive-lab`
**Backup inalterado:** `backup-f0116-stable-2026-11-18` @ `04f3f8b554c648e5be59a449bdad0031d70186a9`.

## Cambios realizados
- Un solo jugador y cápsula física nativa de Unsung, ahora con velocidad de movimiento independiente del arrastre aplicado durante ataque. Mantiene las ventanas de daño originales.
- Pulsación corta de ATK: ataque único. Mantener: combo normal fluido. Deslizar ATK: dirección elegida independientemente del joystick de movimiento.
- Golpes normales sin coste de Energía; técnicas especiales permanecen con coste. Bonificación de daño solo para gestos válidos; cadenas secretas definidas por arma, con orden y timing obligatorio.
- Modos probados en el KayKit GLB real: espada, mandoble, dos espadas, espada/escudo, puños, lanza, bastón. Siete estilos × tres pasos × normal/cuatro direcciones = 105 verificaciones de clips reales.
- En modo dos espadas, dos trazos nacidos de extremos de **dos modelos de armas diferentes**, alternando lado izquierdo/derecho. Dagas dobles no añadidas aún.
- Interfaz Android superior izquierda con HP rojo, Energía dorada, Maná azul (preparado para skills) y Oxígeno cian (funcional). Misiones debajo.
- Buceo con cámara y joystick, profundidad limitada por fondo/superficie, oxígeno dependiente de inmersión y daño por ahogamiento. El crol/buceo tiene torso más horizontal; Quaternius conserva brazos/piernas y excluye torso incompatible.

## Límites verificados
- Tests completos en GitHub CI: 23/23 pre-build + 55/55 controller, WebGL real y Huawei/Samsung-like touch 915×412.
- El render de nado inclina el cuerpo ~1.07 radianes sin volteo de cabeza; es una candidata visual, no motion-capture ni IK avanzado.
- Los cuatro gestos direccionales reutilizan clips auténticos del GLB: no existen todavía cuatro nuevos cortes artísticamente únicos por arma. Efectos siguen extremos geométricos reales.
- Las rocas y la escalada de todo el mapa no tienen prueba física exhaustiva: laboratorio de montaña pendiente.
- Latencia/tacto/fluidez en Samsung S23 Ultra necesitan validación por el usuario: Chromium CI no reemplaza un ensayo real en Android.
- No incorpora KayKit SOURCE de pago ni recursos de licencia no apta; solo CC0/MIT permitidos.

**Conclusión:** candidato F0.12 listo para validación humana, no aprobado aún como release definitiva.
