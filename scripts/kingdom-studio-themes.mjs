// K0.3 experimental: thematic generation using Guildhall's own siting/road rules.
import fs from 'node:fs/promises';
const root=process.argv[2]??'guildhall-native';
async function edit(rel,fn){const p=root+'/'+rel,s=await fs.readFile(p,'utf8'),t=fn(s);if(s===t)throw Error('Sin parche '+rel);await fs.writeFile(p,t)}
function once(s,a,b){if(!s.includes(a))throw Error('Ancla ausente: '+a);return s.replace(a,b)}
const options=[['equilibrada','Equilibrada (original)'],['arvelia','Arvelia · Inicios'],['puertaria','Puertaria · Puerto y pesca'],['ferrondral','Ferrondral · Minería y forja'],['sylvaris','Sylvaris · Bosque y caza'],['valdoria','Valdoria · Agricultura y cocina'],['lumeria','Lumeria · Comercio y artesanía'],['auralis','Auralis · Magia y alquimia'],['valtheria','Valtheria · Fortaleza y entrenamiento']];
const knobs=JSON.stringify({kind:'segment',key:'theme',label:'Especialización',default:'equilibrada',options:options.map(([value,label])=>({value,label}))});
await edit('packages/world/src/hex/zones.ts',s=>{
 s=once(s,'const U = Object.fromEntries',`// HIGHFLY: preserve the original when no theme is requested.
const THEMES: Record<string, { primary: ZoneKind; secondary?: ZoneKind; order: ZoneKind[]; size: number }> = {
  arvelia: {primary:"town", secondary:"hamlet", order:["town","castle","market","hamlet","farm","harbour","fishing","mine","lumber","camp"], size:1.35},
  puertaria: {primary:"harbour", secondary:"fishing", order:["town","harbour","castle","fishing","harbour","fishing","market","fishing","farm","hamlet"], size:2.4},
  ferrondral: {primary:"mine", order:["town","mine","castle","mine","market","mine","lumber","farm","mine","hamlet"], size:2.4},
  valdoria: {primary:"farm", order:["town","farm","castle","farm","market","farm","lumber","fishing","farm","hamlet"], size:2.3},
  sylvaris: {primary:"lumber", order:["town","lumber","castle","lumber","market","lumber","farm","mine","lumber","hamlet"], size:2.3},
  lumeria: {primary:"market", secondary:"town", order:["town","market","castle","market","harbour","market","farm","hamlet","market","lumber"], size:2.1},
  auralis: {primary:"monastery", order:["town","monastery","castle","monastery","market","monastery","farm","lumber","hamlet","monastery"], size:2.1},
  valtheria: {primary:"camp", order:["town","camp","castle","camp","market","camp","farm","harbour","camp","hamlet"], size:2.2},
};
const ALIASES: Record<string,string> = {portuaria:"puertaria",pesquera:"puertaria",minera:"ferrondral",agricola:"valdoria",maderera:"sylvaris",militar:"valtheria"};
const U = Object.fromEntries`);
 s=once(s,'opts: { agents?: number; wild?: number; places?: readonly PlaceSpec[] } = {},','opts: { agents?: number; wild?: number; places?: readonly PlaceSpec[]; theme?: string } = {},');
 s=once(s,'const tier = castleTier(h.spec.files, opts.agents)','const theme = opts.theme && Object.hasOwn(ALIASES,opts.theme) ? ALIASES[opts.theme] : opts.theme\n  const profile = !opts.places && theme && Object.hasOwn(THEMES,theme) ? THEMES[theme] : undefined\n  const tier = castleTier(h.spec.files, opts.agents)');
 s=once(s,'const order: ZoneKind[] = [','const order: ZoneKind[] = profile ? [...profile.order] : [');
 s=once(s,'if (land > 1400) order.push("farm", "fishing")','if (land > 1400) order.push(...(profile ? [profile.primary, "hamlet"] as ZoneKind[] : ["farm", "fishing"] as ZoneKind[]))');
 s=once(s,'if (land > 2200) order.push("farm", "lumber")','if (land > 2200) order.push(...(profile ? [profile.primary, "market"] as ZoneKind[] : ["farm", "lumber"] as ZoneKind[]))');
 s=once(s,'const own = opts.places ? PLAN.hamlet : PLAN[z.kind]','const original = opts.places ? PLAN.hamlet : PLAN[z.kind]\n    const own = profile && (profile.primary === z.kind || profile.secondary === z.kind) ? {...original, per1k: original.per1k * profile.size, min: Math.ceil(original.min * 1.4)} : original');
 return s;
});
await edit('apps/studio/src/params.ts',s=>once(s,'  coast: pub(', '  theme: pub("studio", "HIGHFLY island theme", text),\n  coast: pub('));
await edit('apps/studio/src/hexworld/job.ts',s=>once(once(s,'export interface HexJobSpec {','export interface HexJobSpec {\n  theme?: string'),'hexZones(h, { wild: spec.nature?.wild,','hexZones(h, { theme: spec.theme, wild: spec.nature?.wild,'));
await edit('apps/studio/src/hexworld/index.ts',s=>{
 s=once(s,'const shape = shapeOf(ctx.query)','const shape = shapeOf(ctx.query)\n    const theme = param(ctx.query, "theme") ?? "equilibrada"');
 s=once(s,'        shape,\n        life: lifeOn,','        shape,\n        theme,\n        life: lifeOn,');
 return once(s,'hexZones(island, { wild: nature.wild,','hexZones(island, { theme, wild: nature.wild,');
});
await edit('apps/studio/src/hexworld/knobs.ts',s=>once(s,'{ kind: "stepper", key: seedKey,','{ ...'+knobs+', kind: "segment", apply: "reload" },\n        { kind: "stepper", key: seedKey,'));
await edit('apps/studio/src/hexmap/index.ts',s=>{
 s=once(s,'interface View {','interface View {\n  theme: string');
 s=once(s,'      { kind: "stepper", key: "seed",','      { ...'+knobs+', kind: "segment" },\n      { kind: "stepper", key: "seed",');
 s=once(s,'    spec,\n    grid:','    spec,\n    theme: String(values.theme ?? "equilibrada"),\n    grid:');
 s=once(s,'q.set("town", String(view.spec.seed))','q.set("town", String(view.spec.seed))\n            if (view.theme !== "equilibrada") q.set("theme", view.theme)');
 return once(s,'view.zones ? hexZones(h) : undefined','view.zones ? hexZones(h, {theme:view.theme}) : undefined');
});
await fs.mkdir(root+'/packages/world/test',{recursive:true});
await fs.writeFile(root+'/packages/world/test/kingdom-themes.test.ts',`import {test, expect} from "bun:test";
import {hexIsland, hexZones, hexWorld} from "../src/hex/index.ts";
const themes = {arvelia:["town","hamlet"],puertaria:["harbour","fishing"],ferrondral:["mine"],valdoria:["farm"],sylvaris:["lumber"],lumeria:["market","town"],auralis:["monastery"],valtheria:["camp"]} as const;
const signature=(z:ReturnType<typeof hexZones>)=>JSON.stringify(z.zones.map(x=>[x.kind,x.tile,x.tiles,x.buildings]));
test("equilibrada preserves the original and invalid themes fall back",()=>{
 const h=hexIsland({seed:33,files:1500,coast:0.45,rain:0.3});
 expect(signature(hexZones(h,{theme:"equilibrada"}))).toBe(signature(hexZones(h)));
 expect(signature(hexZones(h,{theme:"invalid"}))).toBe(signature(hexZones(h)));\n expect(signature(hexZones(h,{theme:"pesquera"}))).toBe(signature(hexZones(h,{theme:"puertaria"})));
});
for(const [theme,kinds] of Object.entries(themes))test(theme+" changes settlement allocation deterministically",()=>{
 let original=0, themed=0;
 for(const seed of [7,33,51]){
   const h=hexIsland({seed,files:4000});
   const a=hexZones(h),b=hexZones(h,{theme});
   expect(signature(b)).toBe(signature(hexZones(h,{theme})));
   expect(b.zones.length).toBeGreaterThan(0);
   expect(b.roads.length).toBeGreaterThan(0);
   original+=a.zones.filter(x=>(kinds as readonly string[]).includes(x.kind)).reduce((n,x)=>n+x.tiles.length,0);
   themed+=b.zones.filter(x=>(kinds as readonly string[]).includes(x.kind)).reduce((n,x)=>n+x.tiles.length,0);
   const w=hexWorld(h,b);
   expect(w.tiles.length).toBeGreaterThan(0);
 }
 console.log(theme, {original,themed});
 expect(themed).toBeGreaterThan(original);
});\n`);

 // K0.3.2 — a civic core before specialisation; original balanced remains untouched.
const civicIDs=["adventurers-guild","tavern","smithy","chapel","market","warehouse","house","house"];
const hall=JSON.parse(await fs.readFile(root+'/data/tiles/great-hall.json','utf8'));
delete hall.tier;
hall.id="adventurers-guild";hall.name="Gremio de Aventureros";hall.group="town";
await fs.writeFile(root+'/data/tiles/adventurers-guild.json',JSON.stringify(hall,null,2)+'\n');
await edit('packages/world/src/hex/zones.ts',s=>{
 s=once(s,'export interface HexZones {','export interface HexZones {\n  civic?: boolean');
 s=once(s,'const want =\n      (z.place && sizes.get(z.place.id)) ?? Math.max(own.min, Math.round((own.per1k * land) / 1000))','const want =\n      (z.place && sizes.get(z.place.id)) ?? Math.max(profile ? (z.kind === "town" ? 48 : 18) : 0, own.min, Math.round((own.per1k * land) / 1000))');
 s=once(s,'    // what stands between the buildings: market stalls','    // HIGHFLY: provide road-facing lots before garden and field assignment.\n    if (profile && z.kind !== "castle") {\n      const candidates = z.tiles.filter(i => use[i] === U.yard && kind(i) !== "cliff" && [...g.neighbours(i)].some(j => j >= 0 && (use[j] === U.road || use[j] === U.square) && Math.abs(h.level[j]! - h.level[i]!) <= 1));\n      let lots = z.tiles.filter(i => use[i] === U.building).length;\n      for (const i of candidates) { if (lots >= 10) break; use[i] = U.building; lots++; }\n    }\n    // what stands between the buildings: market stalls');
 s=once(s,'    zones,\n    roads,\n    zoneOf,','    ...(profile ? { civic: true } : {}),\n    zones,\n    roads,\n    zoneOf,');
 return s;
});
await edit('packages/world/src/hex/world.ts',s=>{
 s=once(s,'const built = new Map<number, string>()','const built = new Map<number, string>()\n  const civic = new Set<number>()');
 s=once(s,'if (j < 0 || claimedBy.has(j) || scenes.has(j) || castleGround.has(j))','if (j < 0 || civic.has(j) || claimedBy.has(j) || scenes.has(j) || castleGround.has(j))');
 s=once(s,'if (!p?.footprint?.length || !tilePrefab(SCENE_PART) || scenes.has(i) || claimedBy.has(i))','if (!p?.footprint?.length || !tilePrefab(SCENE_PART) || civic.has(i) || scenes.has(i) || claimedBy.has(i))');
 s=once(s,'  // each place\'s own scenes first,','  // Reserve civic buildings before multi-tile scenes can claim their lots.\n  if (z.civic) for (const [zi,zone] of z.zones.entries()) {\n    if (zone.kind === "castle") continue;\n    const required = '+JSON.stringify(civicIDs)+';\n    for (const id of required) {\n      const prefab=tilePrefab(id);\n      if (!prefab) continue;\n      const lot=buildings(zi).filter(i=>!civic.has(i) && !claimedBy.has(i) && !scenes.has(i)).find(i=>streetSides(i).some(d=>standsOn(prefab,i,d)));\n      if(lot===undefined) continue;\n      civic.add(lot); built.set(lot,id);\n      if(id==="tavern") drinks.push(lot);\n    }\n  }\n  // each place\'s own scenes first,');
 s=once(s,'|| scenes.has(j) || claimedBy.has(j))','|| civic.has(j) || scenes.has(j) || claimedBy.has(j))');
 return s;
});
await fs.writeFile(root+'/packages/world/test/kingdom-civic.test.ts',`import {test, expect} from "bun:test";
import {readFileSync,readdirSync} from "node:fs";
import {hexIsland,hexZones,hexWorld,installTilePrefabs,validateTilePrefab} from "../src/hex/index.ts";
const base=new URL("../../../data/tiles/",import.meta.url);
const authored=readdirSync(base).filter(f=>f.endsWith(".json")).map(f=>JSON.parse(readFileSync(new URL(f,base),"utf8")));
const mandatory=["adventurers-guild","tavern","smithy","chapel","market","warehouse","house"];
test("guild is an authored valid prefab",()=>{
 const guild=authored.find(x=>x.id==="adventurers-guild");
 expect(validateTilePrefab(guild)).toEqual([]);
});
test("civic core audit for all eight themes on seed 33",()=>{
 installTilePrefabs(authored);
 const themes=["arvelia","puertaria","ferrondral","sylvaris","valdoria","lumeria","auralis","valtheria"];
 for(const theme of themes){
  const h=hexIsland({seed:33,files:4000});
  const z=hexZones(h,{theme}),w=hexWorld(h,z);
  const tiles=new Map(w.tiles.map(t=>[t.i,t.prefab]));
  const audit=z.zones.filter(x=>x.kind!=="castle").map(x=>({kind:x.kind,tile:x.tile,lots:x.tiles.length,missing:mandatory.filter(id=>!x.tiles.some(i=>tiles.get(i)===id))}));
  console.log("CIVIC",theme,JSON.stringify(audit));
  const main=audit.find(x=>x.kind==="town");
  expect(main).toBeDefined();
  expect(main?.missing).toEqual([]);
 }
});
`);
