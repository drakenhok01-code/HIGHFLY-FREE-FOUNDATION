# HIGHFLY P5.3.9 — Arvelia corregida (rama de pruebas GitHub Pages)

- Base verificada: P5.3.8 World Forge 4.6; respaldo: `backup-p538-arvelia-pages-20261125`.
- Editor 3D nuevo: World Forge 4.7; aplicación RPG: mismo plano `hf-world-forge-layout-p539-v1`, copia sin borrar de P538/P537.
- Controles PC: WASD y flechas desplazan la cámara en relación a su orientación; Shift acelera; mouse derecho + arrastre gira cámara; mouse central + arrastre desplaza; rueda acerca/aleja.
- Pendiente: activa por defecto `🧱 Pendiente AUTO: SÍ`. Modelos completos se asientan sobre una terraza de tierra derivada del relieve *original* de Unsung, con transición más amplia según desnivel. El permiso se amplía hasta **24 metros de diferencia de altura bajo la huella**; acantilados mayores, agua, plaza y arquitectura original siguen protegidos. No se alteran físicamente los datos fuente del mapa.
- Motivo del bloqueo de importación de P538: en el navegador del usuario el modelo `kaykit-blacksmith` no cargó; P538 rechazaba de manera transaccional el pueblo completo. **No hay evidencia de que sea premium**: pertenece al catálogo oficial KayKit Medieval Hexagon FREE CC0.
- Solución P539: la **herrería de Eastbrook** usa `kaykit-home-a` (Casa A 3D CC0) temporalmente. Se retiene `highflyWantedPrefab:'kaykit-blacksmith'` en el plano. Otras casas se sustituyen por modelos FREE pre-verificados cuando falla su archivo, recalculando ubicación y tamaño antes de guardar.
- **Pendiente por reemplazar a futuro**: aspecto exacto de la herrería y detalles artesanales de forja; P539 conserva sus coordenadas, NPC Borin y diálogos, no los modelos originales de ClaudeCraft restringidos.
- NPC: Sera (gremio), Borin (herrería), Galdren (capilla), Mila (mercado). Mismos avatares KayKit Knight FREE CC0; 2 encargos conversacionales HIGHFLY. No se afirma que haya combate nuevo o recompensas materiales.
- Publicación permitida solo después de pruebas estáticas, `npm run build`, `npm run qa:dist` y Chrome real: importar pueblo y comprobar WASD, giro derecho, desnivel real. Cada ejecución empaqueta P537+P538+P539 por separado en GitHub Pages, presupuesto inferior a 900MB. Vercel excluido.
