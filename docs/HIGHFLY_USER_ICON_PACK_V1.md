# HIGHFLY — ICONOS PREMIUM V1, integración en F0.14.8

Fuente: `HIGHFLY_ICONOS_PREMIUM_V1_60_PNG_WEBP.zip` aportado por el usuario. Siete paquetes ZIP guardan **exactamente** los 60 WebP originales de 256 × 256, sin volver a generarlos ni alterar los bytes.

El build comprueba SHA-256 de cada archivo ZIP y extrae cada WebP a `public/highfly/user-icons/<categoria>/<id>.webp`. El proyecto usa el mismo artwork en catálogo, Bolsa, Personaje y Forja cuando comparten un ID.

## ID actuales y función
- Bolsa/Forja: diez objetos de material/consumible/especial `items/*` y tres equipamientos reales (`weapons/sword`, `weapons/greatsword`, `armor/shield`).
- Habilidades: `skills/attack,dash,roll,heavy,pulse,heal`; mismos seis en catálogo, detalle y ranuras.
- Oficios: ocho `professions/*` (recolección, minería, tala, pesca, cocina, alquimia, fundición, forja).
- Navegación: nueve `navigation/*` para pestañas.
- Las ranuras vacías de armadura muestran previews atenuados con etiqueta «Vacío». No se convierten en equipamiento real.

## Reservados, sin mecánica
`items/leather`, `skills/parry`, `skills/impact_jump`, ocho `skills-advanced/*`, armas `weapons/axe,bow,dual_daggers,spear,staff,wand_orb` y otras ilustraciones de armadura. **No se habilitan habilidades ni loot**, y no se modifica el registro de objetos existentes.

Las imágenes traen marco oro/violeta integrado. En esta versión el CSS desactiva el zoom 4x y evita duplicar un segundo marco alrededor de cada pintura. Se conserva el KayKit 3D real, las misiones, el gameplay, las cantidades, las recetas y el backup F0.14.8.
