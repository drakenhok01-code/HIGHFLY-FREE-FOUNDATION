// K0.6 — economic identity based on the final placed prefab, not a zone label.
import fs from "node:fs/promises";
const root=process.argv[2]??"guildhall-native";
function once(s,a,b){if(!s.includes(a))throw Error("Ancla ausente: "+a);return s.replace(a,b)}
async function edit(p,f){const a=root+"/"+p;await fs.writeFile(a,f(await fs.readFile(a,"utf8")))}
await edit("packages/world/src/hex/zones.ts",s=>{
 s=once(s,"  civic?: boolean","  civic?: boolean\n  kingdomTheme?: string");
 s=once(s,"{ civic: true }","{ civic: true, kingdomTheme: theme }");
 s=once(s,'profile ? (z.kind === "town" ? 48 : 18) : 0','profile ? (z.kind === "town" ? 60 : z.kind===profile.primary || z.kind===profile.secondary ? 38 : 22) : 0');
 s=once(s,'if (lots >= 10) break','if (lots >= (z.kind===profile.primary || z.kind===profile.secondary ? 19 : 12)) break');
 s=once(s,'const POCKET = 7','const POCKET = profile ? 11 : 7');
 s=once(s,'for (let n = 0; n < Math.round(land / 90); n++)','for (let n = 0; n < Math.round(land / (profile ? 240 : 90)); n++)');
 s=once(s,'if (farms.some((f) => dist(f, i) < 3)','if (profile && profile.primary!=="farm" && farms.length>=1) break;\n    if (farms.some((f) => dist(f, i) < 3)');
 s=once(s,'  // the graveyard last','  // Non-farming regions get a single compact agricultural district, not a carpet of fields.\n  if(profile && profile.primary!=="farm" && theme!=="arvelia"){\n    const centre=zones.find(x=>x.kind==="farm")?.tile ?? farms[0] ?? zones[0]?.tile ?? 0;\n    const crops=Array.from({length:N},(_,i)=>i).filter(i=>[U.field,U.orchard,U.pasture].includes(use[i]!)).sort((a,b)=>dist(a,centre)-dist(b,centre)||a-b);\n    const keep=theme==="ferrondral"?6:10;\n    for(const i of crops.slice(keep))use[i]=U.meadow;\n  }\n  // the graveyard last');
 s=once(s,'hash2(seed + 27, j, zi) < 0.5','hash2(seed + 27, j, zi) < (theme==="puertaria"?0.95:0.5)');
 // Prefer coast near the capital for the fishing districts, rather than remote isolated beaches.
 s=once(s,'dist(i, town) / 20 + flatness(i)','(theme==="puertaria" ? -dist(i,town)/25 : dist(i,town)/20) + flatness(i)');
 return s;
});
await edit("packages/world/src/hex/world.ts",s=>{
 s=once(s,'const civic = new Set<number>()','const civic = new Set<number>()\n  const economy = new Set<number>()');
 s=once(s,'    const list =\n      zone?.kind !== "town"','    const profile=z.kingdomTheme;\n    const special:Record<string,string[]>={puertaria:["boathouse","boathouse","storehouse","warehouse","house"],ferrondral:["smithy","smithy","warehouse","house"],sylvaris:["lumber","hunter","house"],valdoria:["farmstead","farmstead","house"],lumeria:["market","market","townhouse","house"],auralis:["monastery","chapel","house"],valtheria:["barracks","fort-tower","house"]};\n    const useSpecial=profile && (zone?.kind==="town" || (profile==="puertaria" && ["harbour","fishing"].includes(zone?.kind??""))) && special[profile] && hash2(seed+291,i,0)<0.60;\n    const list = useSpecial ? special[profile!]! : profile && profile!=="valdoria" && zone?.kind==="hamlet" ? ["house","cottage","townhouse"] :\n      zone?.kind !== "town"');
 s=once(s,'civic.has(j) || claimedBy.has(j)','civic.has(j) || economy.has(j) || claimedBy.has(j)');
 s=once(s,'civic.has(i) || scenes.has(i)','civic.has(i) || economy.has(i) || scenes.has(i)');
 s=once(s,'|| civic.has(j) || scenes.has(j) || claimedBy.has(j))','|| civic.has(j) || economy.has(j) || scenes.has(j) || claimedBy.has(j))');
 // Reserve primary facilities before generic civic assignments. A larger lot budget retains civic capacity.
 s=once(s,'  // Reserve civic buildings before multi-tile scenes can claim their lots.','  // Actual primary industry lots, with valid floor and road approach.\n  if(z.kingdomTheme)for(const [zi,zone] of z.zones.entries()){\n    const byTheme:Record<string,Record<string,string[]>>={ferrondral:{mine:["mine","mine","smithy","warehouse"]},puertaria:{harbour:["boathouse","boathouse","storehouse"],fishing:["boathouse","boathouse"]},sylvaris:{lumber:["lumber","lumber","hunter"]},valdoria:{farm:["farmstead","farmstead"]},lumeria:{market:["market","market"]},auralis:{monastery:["monastery"]},valtheria:{camp:["barracks","archery"]}};\n    for(const id of byTheme[z.kingdomTheme]?.[zone.kind]??[]){\n      const p=tilePrefab(id);if(!p)continue;\n      const lot=buildings(zi).find(i=>!economy.has(i)&&streetSides(i).some(d=>standsOn(p,i,d)));\n      if(lot===undefined)continue;economy.add(lot);built.set(lot,id);\n    }\n  }\n  // Reserve civic buildings before multi-tile scenes can claim their lots.');
 s=once(s,'!civic.has(i) && !claimedBy.has(i)','!civic.has(i) && !economy.has(i) && !claimedBy.has(i)');
 // Harbour scenes should only consume their actual footprint, not suppress every other dock in the district.
 s=once(s,'for (const j of [...cover, ...(zoneAt(i)?.tiles ?? [])])','for (const j of z.kingdomTheme==="puertaria" ? cover : [...cover, ...(zoneAt(i)?.tiles ?? [])])');
 // Count and thin actual tree instances from every dressing layer, not just "forest" tiles.
 s=once(s,'  const grown = nature ? growNatureOn(nature) : undefined','  const grown = nature ? growNatureOn(nature) : undefined\n  if(z.kingdomTheme==="ferrondral"){const kept=pieces.filter((p,i)=>!(/kaykit-forest\\/tree-|kenney-nature\\/tree-/i.test(p.piece))||hash2(seed+823,i,0)<0.14);pieces.length=0;pieces.push(...kept)}');
 return s;
});
await edit("apps/studio/src/hexworld/index.ts",s=>once(s,'const nature = natureOf(ctx.query)','const nature = natureOf(ctx.query)'));
await fs.writeFile(root+"/packages/world/test/kingdom-identity.test.ts",`import {test,expect} from "bun:test";
import {readFileSync,readdirSync} from "node:fs";
import {hexIsland,hexZones,hexWorld,installTilePrefabs} from "../src/hex/index.ts";
import {KINGDOM_PRESETS} from "../../ui/src/viewer/kingdom-presets.ts";
const base=new URL("../../../data/tiles/",import.meta.url);
installTilePrefabs(readdirSync(base).filter(f=>f.endsWith(".json")).map(f=>JSON.parse(readFileSync(new URL(f,base),"utf8"))));
test("actual mining and port industry, not just zone names",()=>{
 for(const [theme,seed] of [["ferrondral",254],["puertaria",275],["valdoria",457]] as const){
 const h=hexIsland({seed,...KINGDOM_PRESETS[theme]}),z=hexZones(h,{theme}),w=hexWorld(h,z);
 const count=(re:RegExp)=>w.pieces.filter(p=>re.test(p.piece)).length;
 const n={theme,seed,mines:count(/building-mine-/),rails:count(/kaykit-holiday\\//),boats:count(/boat-row|ship-small/),trees:count(/tree-/),fields:z.stats.fields,docks:w.tiles.filter(t=>t.prefab==="dock").length,bridges:w.bridges.length};
 console.log("IDENTITY",JSON.stringify(n));
 if(theme==="ferrondral"){expect(n.mines).toBeGreaterThan(0);expect(n.rails).toBeGreaterThanOrEqual(n.mines*2);expect(n.fields).toBeLessThanOrEqual(6);}
 if(theme==="puertaria"){expect(n.boats).toBeGreaterThanOrEqual(5);expect(n.fields).toBeLessThanOrEqual(10);}
 if(theme==="valdoria")expect(n.fields).toBeGreaterThan(40);
 }
});
`);
