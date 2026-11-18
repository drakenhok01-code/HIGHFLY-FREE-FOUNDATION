# F0.6 · Gate de aceptación en el MUNDO REAL

La prueba anterior `qa-kaykit.html` solo validaba un modelo en escena Three sin el mundo. Daba falsos positivos cuando Android mostraba únicamente la espada.

La nueva `qa-world-browser.mjs` abre la aplicación de verdad usando `?hfskin=cpu`, inicia partida, captura la escena de mundo con la cámara y renderer originales, compara imagen con espada sola y con el cuerpo CPU de seis piezas. Exige diferencia de al menos 250 píxeles y 180 en región central.

**Si CI falla no promover.** No confundir test sobre Chromium SwiftShader con Samsung S23 Ultra; queda QA real de dispositivo.

Código original del mundo y físico de Unsung permanecen intactos.
