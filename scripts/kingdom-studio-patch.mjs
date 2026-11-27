// K0.2: native Studio, retain all screens, no false-save claims.
import fs from 'node:fs/promises';
const root=process.argv[2]??'guildhall-native';
async function change(rel,fn){const p=root+'/'+rel,s=await fs.readFile(p,'utf8'),t=fn(s);if(s===t)throw Error('No se aplicó '+rel);await fs.writeFile(p,t)}
await change('apps/studio/src/shell/directory.ts',s=>{
 const labels={'World':'Mundo','Library':'Biblioteca','Build':'Construcción','Characters':'Personajes','Town':'Ciudad 3D','Hex map':'Mapa hexagonal','Pieces':'Modelos 3D','Palette':'Paleta de colores','Tile composer':'Constructor de prefabricados','Tile prefabs':'Biblioteca de prefabricados','NPC builder':'Creador de NPC','Grip editor':'Editor de agarres','Grip matrix':'Matriz de animaciones','Studio home':'Inicio del editor'};
 for(const [a,b] of Object.entries(labels))s=s.replaceAll('name: "'+a+'"','name: "'+b+'"');
 return s.replace('ALL_GROUPS.map((g) => ({ ...g, tools: g.tools.filter((t) => !t.dev) })).filter((g) => g.tools.length > 0)','ALL_GROUPS');
});
await change('apps/studio/src/env.ts',s=>s.replace('Read-only: explore freely, nothing is saved','Vista de prueba: los cambios no se guardan de forma permanente'));
await change('apps/studio/vite.config.ts',s=>s.replace('plan ? `/library/${plan.version}` : ""','plan ? `/HIGHFLY-FREE-FOUNDATION/kingdom-studio/library/${plan.version}` : ""'));
