// K0.3 experimental: thematic generation using Guildhall's own siting/road rules.
import fs from 'node:fs/promises';
const root=process.argv[2]??'guildhall-native';
async function edit(rel,fn){const p=root+'/'+rel,s=await fs.readFile(p,'utf8'),t=fn(s);if(s===t)throw Error('Sin parche '+rel);await fs.writeFile(p,t)}
function once(s,a,b){if(!s.includes(a))throw Error('Ancla ausente: '+a);return s.replace(a,b)}
const options=[['equilibrada','Equilibrada'],['portuaria','Portuaria'],['pesquera','Pesquera'],['minera','Minera'],['agricola','Agrícola'],['maderera','Maderera'],['militar','Militar']];
const knobs=JSON.stringify({kind:'segment',key:'theme',label:'Especialización',default:'equilibrada',options:options.map(([value,label])=>({value,label}))});
await edit('packages/world/src/hex/zones.ts',s=>{
 s=once(s,'const U = Object.fromEntries',`// HIGHFLY: preserve the original when no theme is requested.
const THEMES: Record<string, { primary: ZoneKind; order: ZoneKind[]; size: number }> = {
  portuaria: {primary:"harbour", order:["town","harbour","castle","market","harbour","fishing","harbour","farm","market","hamlet"], size:2.4},
  pesquera: {primary:"fishing", order:["town","fishing","castle","fishing","harbour","fishing","farm","market","fishing","hamlet"], size:2.3},
  minera: {primary:"mine", order:["town","mine","castle","mine","market","mine","lumber","farm","mine","hamlet"], size:2.4},
  agricola: {primary:"farm", order:["town","farm","castle","farm","market","farm","lumber","fishing","farm","hamlet"], size:2.3},
  maderera: {primary:"lumber", order:["town","lumber","castle","lumber","market","lumber","farm","mine","lumber","hamlet"], size:2.3},
  militar: {primary:"camp", order:["town","camp","castle","camp","market","camp","farm","harbour","camp","hamlet"], size:2.2},
};
const U = Object.fromEntries`);
 s=once(s,'opts: { agents?: number; wild?: number; places?: readonly PlaceSpec[] } = {},','opts: { agents?: number; wild?: number; places?: readonly PlaceSpec[]; theme?: string } = {},');
 s=once(s,'const tier = castleTier(h.spec.files, opts.agents)','const profile = !opts.places && opts.theme && Object.hasOwn(THEMES,opts.theme) ? THEMES[opts.theme] : undefined\n  const tier = castleTier(h.spec.files, opts.agents)');
 s=once(s,'const order: ZoneKind[] = [','const order: ZoneKind[] = profile ? [...profile.order] : [');
 s=once(s,'if (land > 1400) order.push("farm", "fishing")','if (land > 1400) order.push(...(profile ? [profile.primary, "hamlet"] as ZoneKind[] : ["farm", "fishing"] as ZoneKind[]))');
 s=once(s,'if (land > 2200) order.push("farm", "lumber")','if (land > 2200) order.push(...(profile ? [profile.primary, "market"] as ZoneKind[] : ["farm", "lumber"] as ZoneKind[]))');
 s=once(s,'const own = opts.places ? PLAN.hamlet : PLAN[z.kind]','const original = opts.places ? PLAN.hamlet : PLAN[z.kind]\n    const own = profile?.primary === z.kind ? {...original, per1k: original.per1k * profile.size, min: Math.ceil(original.min * 1.4)} : original');
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
const themes = {portuaria:"harbour",pesquera:"fishing",minera:"mine",agricola:"farm",maderera:"lumber",militar:"camp"} as const;
const signature=(z:ReturnType<typeof hexZones>)=>JSON.stringify(z.zones.map(x=>[x.kind,x.tile,x.tiles,x.buildings]));
test("equilibrada preserves the original and invalid themes fall back",()=>{
 const h=hexIsland({seed:33,files:1500,coast:0.45,rain:0.3});
 expect(signature(hexZones(h,{theme:"equilibrada"}))).toBe(signature(hexZones(h)));
 expect(signature(hexZones(h,{theme:"invalid"}))).toBe(signature(hexZones(h)));
});
for(const [theme,kind] of Object.entries(themes))test(theme+" changes settlement allocation deterministically",()=>{
 let original=0, themed=0;
 for(const seed of [7,33,51]){
   const h=hexIsland({seed,files:4000});
   const a=hexZones(h),b=hexZones(h,{theme});
   expect(signature(b)).toBe(signature(hexZones(h,{theme})));
   expect(b.zones.length).toBeGreaterThan(0);
   expect(b.roads.length).toBeGreaterThan(0);
   original+=a.zones.filter(x=>x.kind===kind).reduce((n,x)=>n+x.tiles.length,0);
   themed+=b.zones.filter(x=>x.kind===kind).reduce((n,x)=>n+x.tiles.length,0);
   const w=hexWorld(h,b);
   expect(w.tiles.length).toBeGreaterThan(0);
 }
 console.log(theme, {original,themed});
 expect(themed).toBeGreaterThan(original);
});\n`);
