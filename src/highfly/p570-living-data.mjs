export const RESIDENTS=Object.freeze([
{id:'sera',name:'Sera',role:'Gremio',title:'Registro del aventurero',action:'talk',count:1,reward:20,text:'El poder no se hereda. Se construye. Inscribite en el gremio.'},
{id:'arden',name:'Arden',role:'Instructor',title:'Protección del camino',action:'kill',count:3,reward:45,text:'Derrotá tres enemigos en Arvelia y regresá.'},
{id:'galdren',name:'Galdren',role:'Herrero',title:'El primer mineral',action:'mine',count:2,reward:35,text:'Extraé dos minerales de las vetas marcadas por su color.'},
{id:'luthiel',name:'Luthiel',role:'Carpintero',title:'Madera del aprendiz',action:'chop',count:2,reward:30,text:'Talá dos árboles de recolección.'},
{id:'mira',name:'Mira',role:'Agricultora',title:'Nuestra primera cosecha',action:'harvest',count:1,reward:30,text:'Sembrá, regá y cosechá una parcela. Te entrego semillas al aceptar.'},
{id:'elisia',name:'Elisia',role:'Alquimista',title:'Hierbas para el taller',action:'harvest',count:2,reward:40,text:'Cosechá dos veces para aprender la importancia de las hierbas.'},
{id:'rowan',name:'Rowan',role:'Guardia',title:'Provisiones de la guardia',action:'fishing',count:2,reward:35,text:'Pescá dos veces en las aguas de Arvelia.'},
{id:'neria',name:'Neria',role:'Custodia de la llama',title:'Eco de la Novena Voz',action:'talk',count:1,reward:25,text:'El Valle fue restaurado. Pero una novena voz resuena: el Fénix está despertando.'}
]);
export const freshLiving=()=>Object.fromEntries(RESIDENTS.map(n=>[n.id,{status:'available',progress:0,affinity:0}]));
export function advanceLiving(state,action,amount=1){for(const n of RESIDENTS){const q=state[n.id];if(q?.status==='active'&&n.action===action){q.progress=Math.min(n.count,q.progress+amount);if(q.progress>=n.count)q.status='ready'}}return state}
export function talkLiving(state,id){const n=RESIDENTS.find(q=>q.id===id),q=state[id];if(!n||!q)return 'none';if(q.status==='available'){q.status=n.action==='talk'?'ready':'active';q.progress=n.action==='talk'?n.count:0;return 'accepted'}if(q.status==='ready'){q.status='done';q.affinity=Math.min(100,q.affinity+10);return 'reward'}return q.status}
export function affinityLiving(state,id,kind){const q=state[id];if(q)q.affinity=Math.max(-100,Math.min(100,q.affinity+(kind==='kind'?2:-2)));return q?.affinity??0}
export function mineralFor(seed,index){const rows={1:['copper','iron'],2:['copper','iron'],3:['copper'],4:['copper','iron'],5:['silver','iron'],6:['copper','iron','silver'],7:['copper','iron','silver','iron','silver'],8:['iron','silver']};const r=rows[seed]??rows[2];return 'ore_'+r[index%r.length]}
