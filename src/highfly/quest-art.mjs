/** HIGHFLY F0.14.9 – a thematic illustration for every REAL Unsung quest.
 * Visual composition uses approved original HIGHFLY paintings. Quest IDs,
 * not their order in the HUD, decide which static picture gets shown.
 * Hero, objective/progress, buttons and rewards remain live game components.
 */
import {assetUrl} from './premium-assets.mjs';
const THEMES={
 primary:['approved-hero','auralis','El Camino a la Corte de los Pétalos','#d3a3ff',48,50],
 scales:['quest-petal','bells','Campanillas de las Mesetas','#ffdc85',50,48],
 amber:['world-petal','crystal','Ámbar en la Pradera','#8fdbff',30,46],
 kept:['approved-hero','relic','Reliquias de los Cantores','#fac88d',75,41],
 nine:['quest-petal','bells','Las Nueve Campanas','#ffd08b',70,46],
 answer:['approved-hero','spire','Respuestas a los Ecos','#d299ff',51,48],
 vellum2:['world-petal','map','Los Planos Lejanos','#92e7ed',75,51],
 count2:['quest-petal','notes','La Melodía Completa','#e8b4ff',38,45],
 names:['forge-chamber','enemy','Los Cuatro Enemigos con Nombre','#ff999e',70,35],
 rings:['approved-hero','rings','Las Pruebas Ancestrales','#ffd789',47,49],
 vellum:['world-petal','map','Marcas del Cartógrafo','#eadab2',20,43],
 count:['quest-petal','notes','Las Notas Perdidas','#dfc4ff',28,40],
 seeds:['quest-petal','flower','Semillas de la Corte de los Pétalos','#ffbfd5',38,55],
 stair:['approved-hero','stairs','La Guardia de la Escalera','#dfb4ff',63,50],
 voices:['approved-hero','notes','Voces del Coro','#e6d4ff',43,44],
 lamps:['forge-chamber','lantern','Faroles de la Corte de las Linternas','#ffcd85',79,52],
 water:['world-petal','water','Lo que el Agua se Llevó','#90ebfc',61,61],
 debt:['forge-chamber','enemy','La Deuda Dorada','#fdb17b',66,50],
 windfall:['quest-petal','pear','La Cosecha del Huerto','#ffe39c',50,49],
};
const SHAPES={
 auralis:'<path d="M50 6l14 21-14 29-14-29zM50 40q-19-28-40-23 6 30 33 42Q15 58 8 50q14 32 42 40 28-8 42-40-15 8-35 9 28-13 33-42-22-5-40 23z" />',
 bells:'<path d="M26 58Q22 27 41 18l3-7h12l3 7q20 11 16 40l8 12H17zM33 76h34M48 75v10M22 91h56" />',
 crystal:'<path d="M50 4l31 34-12 51H31L19 38zM50 4l-9 45 9 40 13-40zM19 38l22 11 40-11" />',
 relic:'<path d="M10 42l10-22h60l10 22v44H10zM10 42h80M37 42v44M63 42v44M40 57h20v17H40zM50 50l6 7-6 7-6-7z" />',
 spire:'<path d="M39 91V43L50 9l11 34v48zM28 91V56l11-14M72 91V56L61 42M50 17v56M12 91h76" />',
 map:'<path d="M10 21l27-12 26 13 27-13v67L63 87 37 74 10 86zM37 10v64M63 22v65M20 40l13 10 16-8 19 9 16-13" />',
 notes:'<path d="M37 12v58q-6-6-14-2-12 7-5 16 10 12 21-3V30l35-8v36q-9-7-17 0-11 10-3 18 14 8 22-8V5z" />',
 enemy:'<path d="M24 86Q13 59 24 35L13 11l25 13 12-10 12 10 25-13-11 24q12 24 0 51H24zM29 51l15 5-15 4M71 51l-15 5 15 4M36 72h28" />',
 rings:'<circle cx="50" cy="50" r="41"/><circle cx="50" cy="50" r="28"/><circle cx="50" cy="50" r="13"/><path d="M50 1v18M50 81v18M1 50h18M81 50h18" />',
 flower:'<path d="M50 50Q23 5 7 28q-4 29 43 22Q29 75 44 93q26 9 7-43Q78 78 92 57q3-26-41-7Q85 28 69 8q-22-13-19 42z"/><circle cx="50" cy="50" r="10" />',
 stairs:'<path d="M13 91v-16h20V59h16V43h17V27h20V9h7v82zM13 75h20M33 59h16M49 43h17M66 27h20" />',
 lantern:'<path d="M32 28h36l7 50H25zM25 28l25-19 25 19M34 78h32M50 2v12M44 41h12v27H44z" />',
 water:'<path d="M50 8q6 23 26 43t3 35q-20 17-48 0Q15 70 31 51T50 8zM10 80q10-7 20 0t20 0 20 0 20 0" />',
 pear:'<path d="M45 32Q28 11 18 32 10 49 23 71q14 26 27 18 16 8 27-18 13-22 5-39Q70 10 54 32zM50 32l-3-27M50 17q22-13 31 0-13 18-31 0z" />',
};
const htmlSafe=x=>String(x).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
export const QUEST_ART_IDS=Object.freeze(Object.keys(THEMES));
export function questArtData(id){
 const p=THEMES[id]??THEMES.primary;
 return {id:THEMES[id]?id:'primary',asset:p[0],subject:p[1],alt:p[2],color:p[3],x:p[4],y:p[5]};
}
export function questArtwork(id){
 const q=questArtData(id),img=assetUrl(q.asset);
 const emblem=SHAPES[q.subject]??SHAPES.spire;
 // Layered scenery and emblem are decorative; name/progress and interaction
 // are produced elsewhere from live game quest state.
 return '<div class="hf-rpg-quest-scene" data-hf-quest-art="'+htmlSafe(q.id)+'" role="img" aria-label="'+htmlSafe(q.alt)+'">'+
 '<img class="hf-rpg-quest-scenery" alt="" draggable="false" src="'+img+'" style="object-position:'+q.x+'% '+q.y+'%"/>'+
 '<div class="hf-rpg-quest-scene-glow" style="--hf-quest-glow:'+q.color+'"></div>'+
 '<svg aria-hidden="true" viewBox="0 0 100 100" class="hf-rpg-quest-emblem" style="--hf-quest-glow:'+q.color+'"><g fill="'+q.color+'" fill-opacity=".30" stroke="'+q.color+'" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">'+emblem+'</g></svg>'+
 '<span class="hf-rpg-quest-scene-filigree" aria-hidden="true">✧</span></div>';
}
