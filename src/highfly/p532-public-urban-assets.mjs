/** Immutable public HIGHFLY original urban model catalogue. Browser-safe, no Three.js import. */
export const PUBLIC_URBAN_ASSETS=Object.freeze([
 {id:'hf-fountain-stone',label:'Fuente de piedra con agua',icon:'⛲',cat:'Urbanismo HIGHFLY',kind:'decor',w:8,d:8,license:'MIT (original HIGHFLY)',sourcePack:'HIGHFLY original'},
 {id:'hf-streetlamp-bronze',label:'Farola de bronce encendida',icon:'🏮',cat:'Urbanismo HIGHFLY',kind:'decor',w:1.8,d:1.8,license:'MIT (original HIGHFLY)',sourcePack:'HIGHFLY original'},
 {id:'hf-wooden-signpost',label:'Poste de señalización',icon:'🪧',cat:'Urbanismo HIGHFLY',kind:'decor',w:2.6,d:1.4,license:'MIT (original HIGHFLY)',sourcePack:'HIGHFLY original'},
 {id:'hf-round-flowerbed',label:'Jardinera circular con flores',icon:'🌷',cat:'Urbanismo HIGHFLY',kind:'decor',w:4.5,d:4.5,license:'MIT (original HIGHFLY)',sourcePack:'HIGHFLY original'}
]);
export const PUBLIC_URBAN_IDS=new Set(PUBLIC_URBAN_ASSETS.map(a=>a.id));
