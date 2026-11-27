// K0.4 — terrain presets, accessible theme picker and map sizing.
import fs from 'node:fs/promises';
const root=process.argv[2]??'guildhall-native';
function once(s,a,b){if(!s.includes(a))throw Error('Ancla ausente: '+a);return s.replace(a,b)}
async function edit(p,f){const a=root+'/'+p,s=await fs.readFile(a,'utf8');await fs.writeFile(a,f(s))}
const presets={
 equilibrada:{files:1500,coast:1,hills:5,rain:1,forest:.21,cliffs:1},
 arvelia:{files:1500,coast:.75,hills:3,rain:1.05,forest:.24,cliffs:.55},
 puertaria:{files:1800,coast:1.65,hills:3,rain:2.25,forest:.14,cliffs:.45},
 ferrondral:{files:1800,coast:.85,hills:9,rain:.35,forest:.12,cliffs:1.65},
 sylvaris:{files:1600,coast:.9,hills:4,rain:1.35,forest:.58,cliffs:.75},
 valdoria:{files:2000,coast:.65,hills:2,rain:1.45,forest:.1,cliffs:.35},
 lumeria:{files:2200,coast:1.15,hills:3,rain:1.1,forest:.18,cliffs:.65},
 auralis:{files:1500,coast:1.25,hills:6,rain:1.5,forest:.35,cliffs:1.1},
 valtheria:{files:1800,coast:1.1,hills:6,rain:.75,forest:.18,cliffs:1.5}
};
const shared='packages/ui/src/viewer/kingdom-presets.ts';
await fs.writeFile(root+'/'+shared,'export const KINGDOM_PRESETS: Record<string,Record<string,number>> = '+JSON.stringify(presets,null,2)+';\nexport function kingdomPreset(theme:unknown){return typeof theme==="string"&&Object.hasOwn(KINGDOM_PRESETS,theme)?KINGDOM_PRESETS[theme]:undefined}\n');
await edit('packages/world/src/hex/island.ts',s=>{
 s=once(s,'  hills?: number','  hills?: number\n  /** Coastal bluff frequency, 1 = original. */\n  cliffs?: number');
 s=once(s,'  hills: 5,','  hills: 5,\n  cliffs: 1,');
 return once(s,'+ 0.6 * mm > 0.32 ? 2 : 0','+ 0.6 * mm + 0.32 * (spec.cliffs - 1) > 0.32 ? 2 : 0');
});
await edit('apps/studio/src/params.ts',s=>once(s,'  hills: pub(', '  cliffs: pub("studio", "HIGHFLY coastal cliffs", num),\n  hills: pub('));
await edit('apps/studio/src/shell/router.ts',s=>{
 s='import {kingdomPreset} from "../../../../packages/ui/src/viewer/kingdom-presets.ts"\n'+s;
 return once(s,'const query = new URLSearchParams(search)','const query = new URLSearchParams(search)\n  const preset = kingdomPreset(query.get("theme"))\n  if (preset) for (const [key,value] of Object.entries(preset)) if (!query.has(key)) query.set(key,String(value))');
});
await edit('packages/ui/src/viewer/createViewer.tsx',s=>{
 s='import {kingdomPreset} from "./kingdom-presets.ts"\n'+s;
 return once(s,'const values = { ...before, ...patch }','const preset = !fromScreen && "theme" in patch && patch.theme !== before.theme ? kingdomPreset(patch.theme) : undefined\n    const values = { ...before, ...preset, ...patch }');
});
await edit('packages/ui/src/viewer/knobs.ts',s=>once(s,'const v = writeKnob(k, values[k.key] ?? k.default)','const v = ["files","coast","hills","rain","forest","cliffs"].includes(k.key) && "theme" in values ? String(values[k.key] ?? k.default) : writeKnob(k, values[k.key] ?? k.default)'));
await edit('apps/studio/src/hexworld/job.ts',s=>s.replaceAll('"coast" | "hills" | "rain" | "forest"','"coast" | "hills" | "rain" | "forest" | "cliffs"').replaceAll('["coast", "hills", "rain", "forest"]','["coast", "hills", "rain", "forest", "cliffs"]'));
const cliffKnob='{kind:"range",key:"cliffs",label:"Acantilados",min:0,max:2,step:.05,default:1}';
const words={"Show":"Vista","One island":"Una isla","Eight seeds":"Ocho semillas","Growth":"Crecimiento","Seed":"Semilla","Zones and roads":"Zonas y caminos","Places, buildings, fields":"Pueblos, edificios y cultivos","Island":"Isla","Repo files":"Tamaño de región","Coast shape":"Forma de costa","Hill levels":"Altura de montañas","Rivers":"Ríos","Forest":"Bosque","Open in 3D":"Abrir en 3D","Land tiles":"Hexágonos terrestres","Places":"Asentamientos","Buildings":"Edificios","Lakes":"Lagos","Summary":"Resumen","Fields":"Cultivos","Road tiles":"Caminos","Bridges":"Puentes","Generated in":"Generado en","View":"Vista","Ground":"Terreno","Nature":"Naturaleza","Look":"Aspecto","Level height":"Altura del nivel","Ground detail":"Detalle del terreno","The island from above":"Mapa de la región"};
const translate=s=>{for(const [a,b] of Object.entries(words))s=s.replaceAll('"'+a+'"','"'+b+'"');return s};
await edit('apps/studio/src/hexmap/index.ts',s=>{
 s=s.replace(/(\{ \.\.\.\{"kind":"segment","key":"theme"[^\n]+), kind: "segment" \}/,'$1, kind: "select" }');
 s=once(s,'const KNOB_KEYS = ["files", "coast", "hills", "rain", "forest"]','const KNOB_KEYS = ["files", "coast", "hills", "rain", "forest", "cliffs"]');
 s=once(s,'key: "coast",','key: "coast",'); // anchor verification
 s=once(s,'        key: "rain",','        key: "rain",');
 s=once(s,'      {\n        kind: "range",\n        key: "forest",','      '+cliffKnob+',\n      {\n        kind: "range",\n        key: "forest",');
 s=once(s,'if (view.spec[k] !== HEX_ISLAND_DEFAULTS[k]) q.set(k, String(view.spec[k]))','q.set(k, String(view.spec[k]))');
 s=once(s,'const size = Math.min(aw, H - 16) * 1.02','const size = Math.min(aw, H - 24) * .96\n        let fit = 10; for(let i=0;i<h.grid.size;i++){if(kindOf(h,i)==="sea")continue;const [x,y]=hexCentre({q:h.grid.q[i]!,r:h.grid.r[i]!});fit=Math.max(fit,Math.max(Math.abs(x),Math.abs(y))/Math.sqrt(3)+2)}');
 s=once(s,'draw(g, h, left + aw / 2, H / 2, size, FIT, zones)','draw(g, h, left + aw / 2, H / 2, size, fit, zones)');
 s=once(s,'const label = `${zone.kind} · ${zone.buildings}`','const label = `${ZONE_ES[zone.kind]??zone.kind} · ${zone.buildings}`');
 s=once(s,'label: q.kind,','label: ZONE_ES[q.kind]??q.kind,');
 s='const ZONE_ES: Record<string,string> = {town:"Ciudad",harbour:"Puerto",castle:"Castillo",market:"Mercado",farm:"Granja",fishing:"Pesca",mine:"Mina",lumber:"Tala",monastery:"Templo",camp:"Campamento",hamlet:"Aldea"};\n'+s;
 s=s.replace('Heights in steps, sand, cliffs, rivers, lakes and forest; places, roads and fields over them.','Costas, montañas, ríos, bosques, pueblos y caminos adaptados a cada región.');
 return translate(s);
});
await edit('apps/studio/src/hexworld/knobs.ts',s=>{
 s=s.replace(/(\{ \.\.\.\{"kind":"segment","key":"theme"[^\n]+), kind: "segment", apply: "reload" \}/,'$1, kind: "select", apply: "reload" }');
 s=once(s,'        {\n          kind: "range",\n          key: "forest",','        {...'+cliffKnob+',kind:"range",apply:"reload"},\n        {\n          kind: "range",\n          key: "forest",');
 return translate(s);
});
await edit('apps/studio/src/shell/TopBar.tsx',s=>s.replace('Guildhall <span>Studio</span>','HIGHFLY <span>World Forge</span>').replace('Guildhall Studio home','Inicio de HIGHFLY World Forge').replace('          Island\n','          Isla\n').replace('Jump to…','Ir a…'));
await fs.writeFile(root+'/packages/world/test/kingdom-terrain.test.ts',`import {test,expect} from "bun:test";
import {hexIsland,hexZones,hexWorld,kindOf} from "../src/hex/index.ts";
const presets = ${JSON.stringify(presets)};
test("terrain theme profiles change actual geography, not just settlements",()=>{
 const totals:Record<string,{rivers:number,rock:number,forest:number,land:number,max:number,pieces:number}>={};
 for(const [theme,p] of Object.entries(presets)){
  const h=hexIsland({seed:33,...p}),z=hexZones(h,{theme}),w=hexWorld(h,z);
  let rock=0,forest=0;for(let i=0;i<h.grid.size;i++){if(kindOf(h,i)==="rock")rock++;if(kindOf(h,i)==="forest")forest++}
  totals[theme]={rivers:h.rivers.length,rock,forest,land:h.stats.land,max:Math.max(...h.level),pieces:w.pieces.length};
 }
 console.log("TERRAIN",JSON.stringify(totals));
 expect(totals.ferrondral!.max).toBeGreaterThan(totals.puertaria!.max);
 expect(totals.sylvaris!.forest).toBeGreaterThan(totals.valdoria!.forest);
 expect(totals.puertaria!.rivers).toBeGreaterThanOrEqual(totals.ferrondral!.rivers);
});
`);
