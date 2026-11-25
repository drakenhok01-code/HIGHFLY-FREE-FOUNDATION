# HIGHFLY P5.3.8 — Eastbrook terrestre → Arvelia

Estado: código de prueba integrado. Compilación, QA de navegador, FPS Android y Pages no confirmados.

Base estable: p537-ground-fit-clean-pages-20261125
Backup: backup-p537-before-eastbrook-20261125
Rama experimental: p538-eastbrook-land-npcs-pilot-20261125

## Incluido
- Referencias urbanas de Eastbrook v0.44.7 de la auditoría P534, solo planificación y posiciones relativas del código MIT. No se copiaron modelos ni diálogos ClaudeCraft.
- Banco, herrería, taberna, capilla, botica, gremio Unsung. Mercado y dos viviendas opcionales.
- Sin puerto, muelle, barco, casa de muelle o agua de ClaudeCraft.
- NPC FREE: Sera, Borin, Galdren y Mila. Modelos de la base KayKit FREE existente y nombres HIGHFLY.
- Dos encargos originales interactivos y persistentes: La llama de Arvelia (Sera/Borin/Sera) y Guardianes del camino (Galdren/Mila/Galdren). No incluyen todavía conteos de enemigos, XP ni recompensas.
- Editor P538: botón Importar Arvelia, autosugestión al entrar, terreno/árboles/obstáculos evaluados, guardado aislado, sin alterar P537.
- RPG P538: usa el mismo layout guardado que el editor; si es la primera vez, intenta generar copia del plano P537 + Arvelia sobre el suelo nativo. Si la colocación es inviable, conserva el plano anterior.
- Conservar los materiales, curvas y nivelación del terreno de P537.

## Advertencias y límites
- Árboles: el editor dispone del índice completo del bosque; la generación alternativa directa desde el RPG necesita QA de colisión visual para asegurar equivalencia. La importación desde el editor es la vía recomendada.
- Sin screenshot ni validación final de lotes cerca de las escaleras; la prueba de Chrome está configurada, no se confirma completada.
- No se introducen modelos Tidehold, texturas, audio ni media restringida a World of ClaudeCraft. KayKit FREE es CC0; source code ClaudeCraft y Unsung MIT, con créditos pertinentes.
- No mezclar ni desplegar en el Pages estable P537 antes de una prueba real Android.

## QA
Workflow: .github/workflows/highfly-p538-arvelia-qa.yml
Tests: tests/p538-eastbrook-land.test.mjs y tests/p538-browser-eastbrook.mjs.
No actualizar P537 ni sus enlaces; si la integración necesita revertirse basta volver a la rama de backup.
