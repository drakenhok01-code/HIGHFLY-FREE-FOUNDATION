// P564: proposed identities, deliberately separate from actual region seed assignment.
export const LEVEL_CAP=99;
export const CITY_IDENTITIES=Object.freeze([
 {id:'arvelia',name:'Arvelia',theme:'Pueblo de los Inicios',recommended:[1,15],activities:['gremio','caza básica','recolección','fabricación inicial']},
 {id:'valdoria',name:'Valdoria',theme:'Aldea agrícola',recommended:[12,25],activities:['cultivo','cocina','ganadería','protección de cosechas']},
 {id:'sylvaris',name:'Sylvaris',theme:'Aldea forestal',recommended:[20,40],activities:['tala','carpintería','caza','campamentos enemigos']},
 {id:'puertaria',name:'Puertaria',theme:'Puerto pesquero',recommended:[30,50],activities:['pesca','cangrejos','mercancías perdidas','cuevas costeras']},
 {id:'ferrondral',name:'Ferrondral',theme:'Pueblo minero',recommended:[40,60],activities:['minería','fundición','herrería','cuevas']},
 {id:'lumeria',name:'Lumeria',theme:'Ciudad comercial',recommended:[50,75],activities:['comercio','caravanas','fabricación','piratas']},
 {id:'auralis',name:'Auralis',theme:'Santuario ancestral',recommended:[65,85],activities:['alquimia','encantamiento','espíritus','ruinas']},
 {id:'valtheria',name:'Valtheria',theme:'Ciudad fortificada',recommended:[80,99],activities:['guardia','élites','defensa','jefes']}
]);
// Design metadata only: level recommendations never gate travel. Actual progression implementation is separate.

// Proposed assignment from real geography and existing structures; preserve numeric seeds.
export const CITY_BY_SEED=Object.freeze(Object.fromEntries(
 [[1,'sylvaris'],[2,'arvelia'],[3,'puertaria'],[4,'valdoria'],[5,'auralis'],[6,'lumeria'],[7,'ferrondral'],[8,'valtheria']].map(([seed,id])=>[seed,CITY_IDENTITIES.find(c=>c.id===id)])
));
