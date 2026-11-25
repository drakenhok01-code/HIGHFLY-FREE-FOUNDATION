/* HIGHFLY P5.3.0 · Catalogue for exact MIT Unsung Vale procedural buildings and props.
 * The models below are produced from the actual original Unsung MeshBuilder functions
 * in src/world/arch/kit.js, never approximated generic cubes.
 */
export const UNSUNG_ORIGINAL_ASSETS=Object.freeze([
 {id:'unsung-lantern',label:'Farol de Unsung',category:'Accesorios',icon:'🏮',w:1.6,d:1.6,kind:'decor'},
 {id:'unsung-bench',label:'Banco de Unsung',category:'Accesorios',icon:'🪑',w:2.8,d:1.7,kind:'decor'},
 {id:'unsung-planter',label:'Macetero de mármol',category:'Accesorios',icon:'🪴',w:2,d:2,kind:'decor'},
 {id:'unsung-trough',label:'Jardinera de piedra',category:'Accesorios',icon:'🌷',w:6,d:1.7,kind:'decor'},
 {id:'unsung-armillary',label:'Esfera astronómica',category:'Accesorios',icon:'🌐',w:3.4,d:3.4,kind:'decor'},
 {id:'unsung-pavilion',label:'Pabellón original',category:'Arquitectura',icon:'🏛️',w:12,d:12,kind:'building'},
 {id:'unsung-arcade',label:'Arquería de piedra',category:'Arquitectura',icon:'🏛️',w:11,d:2,kind:'building'},
 {id:'unsung-tower',label:'Torre de Unsung',category:'Arquitectura',icon:'🏰',w:9,d:9,kind:'building'},
 {id:'unsung-hall',label:'Salón monumental',category:'Arquitectura',icon:'⛪',w:25,d:15,kind:'building'},
 {id:'unsung-stairs',label:'Escalera monumental',category:'Arquitectura',icon:'🪜',w:9,d:13,kind:'building'},
 {id:'unsung-balustrade',label:'Balaustrada de mármol',category:'Accesorios',icon:'▥',w:9,d:2,kind:'decor'},
 {id:'unsung-spire',label:'Aguja ornamental',category:'Arquitectura',icon:'🔱',w:9,d:9,kind:'building'}
]);
export const UNSUNG_ORIGINAL_IDS=new Set(UNSUNG_ORIGINAL_ASSETS.map(x=>x.id));
export function buildUnsungOriginal(id,b,{kit,arch}){
 switch(id){
  case 'unsung-lantern':kit.lantern(b,3.25);break;
  case 'unsung-bench':kit.bench(b,2.6);break;
  case 'unsung-planter':kit.planter(b,.85);break;
  case 'unsung-trough':kit.trough(b,5.4);break;
  case 'unsung-armillary':kit.armillary(b,1.2);break;
  case 'unsung-pavilion':kit.pavilion(b,{r:4.3,colH:4.9,n:8,detail:1});break;
  case 'unsung-arcade':b.at(-4.8,0,0,0,q=>kit.arcade(q,9.6,{bay:3.2,colH:4.8,detail:1}));break;
  case 'unsung-tower':kit.tower(b,{r:3.2,h:22,sides:8,stages:2,top:'spire',spireH:10,detail:1,foot:2});break;
  case 'unsung-hall':kit.hall(b,{w:23,d:13,h:16,bays:5,detail:1,foot:3});break;
  case 'unsung-stairs':b.at(-6,0,0,0,q=>arch.stairs(q,12,2.4,8));break;
  case 'unsung-balustrade':b.at(-4,0,0,0,q=>arch.balustrade(q,8,{height:1.2,detail:1}));break;
  case 'unsung-spire':kit.tuningSpire(b,15);break;
  default:throw Error('Unknown Unsung original prefab '+id);
 }
}
