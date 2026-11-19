# HIGHFLY F0.12.1 — Laboratorio paralelo de oficios

**Base:** F0.12 Flow Combat commit \`6e4e6246...\`. **Rama:** \`f0121-professions-action-qa\` (sin despliegue Pages).

## Auditoría previa
- TALAR: \`1H_Melee_Attack_Chop\` + detección de árboles, pero sin materiales/inventario.
- MINAR: \`1H_Melee_Attack_Chop\`; el raycast de roca no demuestra que exista mineral.
- PESCAR: previo clip \`1H_Ranged_Shooting\` con arco, no caña; solo preview.
- CULTIVAR, REGAR, COSECHAR, FUNDIR y FORJAR: ausentes antes de este laboratorio.

## Qué incluye el laboratorio
- Recursos sintéticos *explícitamente etiquetados* \`tree\`, \`ore\`, \`fishSpot\`, \`soil\`, \`furnace\`, \`forge\`.
- Inventario simulado propio \`_hfProfession.inventory\`, herramientas virtuales explícitas \`_hfProfession.tools\`. No crea, equipa ni entrega herramientas mágicamente.
- Comienzo de la acción → animación → validación de disponibilidad y costes → resultado *una sola vez*.
- Cancelar moviéndose, saltando o atacando no entrega recursos. Un recurso agotado no puede volver a dar loot.
- \`SEMBRAR\` (sembrar) consume semilla; riego → crecimiento temporal → cosecha restablece parcela.
- Minar genera mineral, fundir consume mineral para producir lingotes, forjar consume lingotes para producir una **pieza base ilustrativa**, no un arma equipada.
- El botón universal admite contexto donde existan nodos etiquetados; árboles no etiquetados y rocas naturales siguen sin convertirse mágicamente en materiales.
- Las ocho acciones usan clips originales KayKit verificados. *PESCAR usa Use_Item como postura provisional*; FORJAR usa Chop como golpe provisional. **No hay caña, martillo o pico visible en la mano**, ni animaciones propias de cada herramienta aún.

## Límite claro
Los nodos de profesión usados en tests son *sintéticos*, y **el mapa público actual no cuenta todavía con esas etiquetas, estaciones, cultivos o inventario persistente**. Esta rama prueba la lógica real sobre Player y GLB en CI, **no es un sistema de oficios jugable listo**. Próximo paso: crear un patio de pruebas de oficios visual 3D, herramientas reales auditadas y persistencia.

## Oficios que convendría agregar después
Cocina, carpintería, alquimia/herboristería, sastrería, peletería, joyería, encantamiento, arquería/cuerdas. Cada uno debe definirse mediante un banco, herramienta, materiales, receta, animación y producto.
