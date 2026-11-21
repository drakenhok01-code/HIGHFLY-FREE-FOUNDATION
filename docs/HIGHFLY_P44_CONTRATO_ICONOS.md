# HIGHFLY UNSUNG — Contrato maestro de iconos P4.4

## Principio visual innegociable

Las ilustraciones de objetos y su **marco ornamental completo** se exportan juntos a **256 × 256 píxeles, relación 1:1, WebP (RGBA)**. El mismo objeto mantiene exactamente su ilustración, escala y fondo; **solo cambia el color del marco según su rareza**.

En toda la aplicación: `padding: 0` dentro del icono, nunca un segundo marco ornamental en CSS ni glow tapando la ilustración. No estirar en un eje: `object-fit: contain` y tamaño idéntico en X/Y. Los slots vacíos no cuentan como arte de rareza.

## Familias de arte

| Familia | Tamaño fuente | Marco | Salidas y funciones |
|---|---|---|---|
| Armas, armaduras, accesorios, pociones, materiales, botín y lingotes | **256 × 256** | Seis variantes de rareza **integradas** | Bolsa, equipo, forja y mensajes del Sistema |
| Oficios | **256 × 256** | Marco dorado de oficio común a todas las 15 profesiones | Lista y ficha de oficio |
| Habilidades / talentos | **256 × 256** | Arte de skill, recortado visualmente a círculo solo en HUD | Panel de habilidades, HUD y detalles |
| Misiones | Imágenes narrativas por misión | Sin marco de rareza | Panel de misiones |
| Logo HIGHFLY RPG FITNESS | Archivo fuente oficial grande; salida optimizada con proporciones originales | Sin marco de rareza | Pantalla de carga / encabezado |

Las rarezas activas son: Común blanco/gris `#EEF3FF`, Poco común verde `#27FF73`, Raro azul `#188EFF`, Épico violeta `#B43FFF`, Legendario dorado `#FFAE17`, Mítico coral rojo `#FF253F`. **Ancestral/reliquia** queda reservada para una futura fase, sin drops actuales.

## Medidas CSS de destino

| Ubicación | Tamaño CSS de presentación | Fuente recomendada |
|---|---|---|
| Bolsa · 6 columnas | **Dinámico**: ancho disponible del panel central ÷ 6, descontando separaciones y barra de scroll; cuadrado 1:1 | 256×256 |
| Bolsa · detalle seleccionado | Hasta **140×140 px**, hasta **124 px** en pantallas bajas | 256×256 |
| Personaje · icono equipado | **43×43 px**; en móvil ancho hasta 980 px **36×36 px** | 256×256 |
| Forja · resultado | **84×84 px** | 256×256 |
| Forja · recetas | **44×44 px** | 256×256 |
| Forja · ingredientes | **39×39 px** | 256×256 |
| Oficios · lista | **44×44 px** | 256×256 |
| Oficios · ficha | **78×78 px** | 256×256 |
| Habilidades · catálogo | **50×50 px**; en horizontal reducido **42–45 px** | 256×256 |
| Habilidades · destacada | **80×80 px**; móvil reducido **70 px** | 256×256 |
| HUD de combate | **Círculo escalable por editor HUD**, sin alterar la imagen original | 256×256 |

Estas son **medidas CSS**, no tamaños absolutos de pantalla física: el Samsung S23 Ultra varía viewport según barras de navegación y zoom. En 915×412 CSS px, la bolsa conserva seis columnas y la última fila debe ser accesible desplazando **solo la cuadrícula**.

## Pipeline de integración

1. Crear un icono maestro 256×256 WebP transparente o con fondo aprobado, centrado.
2. Para **ítems**, generar `items/{id}__{rareza}.webp` (o `armor` / `weapons`), sin alterar el objeto entre variantes.
3. Para **oficios**, generar `professions/{id}.webp` con el mismo marco dorado fijo.
4. Para **skills**, usar el icono cuadrado en catálogo; aplicar recorte circular únicamente al HUD.
5. Validar en la app real a tamaño reducido, en detalle, en equipo y en forja. Probar además selección táctil, scroll hasta la última casilla y persistencia después de equipar.
6. No publicar sprites de KayKit SOURCE privados en GitHub Pages público.

Ruta de generación: `scripts/highfly-p43-premium-art.py` seguida de `scripts/highfly-p44-align-art.py`. La fuente son los WebP aprobados existentes en `assets/highfly/premium/hf_user_icons_*.zip`.
