// K1.3 city harmony: connected rural district, central civic core, distributed docks and perimeter walls.
import fs from "node:fs/promises";
const root=process.argv[2]??"guildhall-native";
function once(s,a,b){if(!s.includes(a))throw Error("Missing "+a);return s.replace(a,b)}
async function edit(p,f){const path=root+"/"+p;await fs.writeFile(path,f(await fs.readFile(path,"utf8")))}
await edit("packages/world/src/hex/zones.ts",s=>{
 const a=s.indexOf("  // Non-farming regions get a single compact agricultural district");
 const b=s.indexOf("  // the graveyard last",a);
 if(a<0||b<0)throw Error("country anchor");
 s=s.slice(0,a)+[
 "  // HIGHFLY: secondary production occupies one coherent district; fields belong to a connected patch.",
 "  if(profile){",
 "    const ag=new Set([U.field,U.orchard,U.pasture]);",
 "    const farmZone=zones.find(x=>x.kind==='farm');",
 "    const hub=farmZone?.tile ?? farms[0] ?? zones[0]?.tile ?? 0;",
 "    const cap=theme==='valdoria'?Math.round(land*.18):theme==='arvelia'?18:theme==='ferrondral'?6:theme==='sylvaris'?8:12;",
 "    const all=Array.from({length:N},(_,i)=>i).filter(i=>ag.has(use[i]!));",
 "    const eligible=new Set(all.filter(i=>theme==='valdoria'||dist(i,hub)<=5));",
 "    const components:number[][]=[];",
 "    while(eligible.size){const start=eligible.values().next().value!;eligible.delete(start);const queue=[start];for(let k=0;k<queue.length;k++)for(const j of g.neighbours(queue[k]!))if(eligible.delete(j))queue.push(j);components.push(queue);}",
 "    components.sort((a,b)=>theme==='valdoria'?b.length-a.length:Math.min(...a.map(i=>dist(i,hub)))-Math.min(...b.map(i=>dist(i,hub)))||b.length-a.length);",
 "    const keep=new Set<number>();",
 "    for(const c of components){if(c.length<3||keep.size>=cap)continue;if(theme!=='valdoria'&&keep.size)break;",
 "      const root=c.slice().sort((a,b)=>dist(a,hub)-dist(b,hub)||a-b)[0]!,available=new Set(c),q=[root];available.delete(root);",
 "      for(let k=0;k<q.length&&keep.size<cap;k++){const i=q[k]!;keep.add(i);for(const j of g.neighbours(i))if(available.delete(j))q.push(j);}",
 "    }",
 "    for(const i of all)if(!keep.has(i))use[i]=U.meadow;",
 "    if(theme!=='valdoria')for(let i=0;i<N;i++)if(use[i]===U.farmstead&&dist(i,hub)>4)use[i]=U.meadow;",
 "    if(theme==='puertaria'){",
 "      const ports=zones.filter(x=>x.kind==='harbour'||x.kind==='fishing');",
 "      const docks=Array.from({length:N},(_,i)=>i).filter(i=>use[i]===U.dock);",
 "      const remaining=new Set(docks),selected:number[]=[];",
 "      for(const port of ports){",
 "        const near=docks.filter(i=>dist(i,port.tile)<=8).sort((a,b)=>dist(a,port.tile)-dist(b,port.tile)||a-b);",
 "        let n=0;for(const i of near){if(n>=3)break;if(!remaining.has(i)||selected.some(j=>dist(i,j)<2))continue;selected.push(i);remaining.delete(i);n++;}",
 "      }",
 "      for(const i of docks)if(!selected.includes(i))use[i]=U.none;",
 "    }",
 "  }",
 ""
 ].join("\n")+s.slice(b);
 // Explicit wall tier independent of repo size. Castle remains separate from town walls.
 s=once(s,"  const tier = castleTier(h.spec.files, opts.agents)","  const tier = profile ? Math.max(2,castleTier(h.spec.files, opts.agents)) : castleTier(h.spec.files, opts.agents)");
 return s;
});
await edit("packages/world/src/hex/world.ts",s=>{
 s=once(s,"  const tier = opts.agents === undefined ? z.tier : castleTier(h.spec.files, opts.agents)","  const tier = z.kingdomTheme ? Math.max(2,z.tier) : opts.agents === undefined ? z.tier : castleTier(h.spec.files, opts.agents)");
 // Reserve civic lots nearest central square before specialty lots in capital.
 const a=s.indexOf("  // Actual primary industry lots"), b=s.indexOf("  // Reserve civic buildings",a), c=s.indexOf("  // each place's own scenes first,",b);
 if(a<0||b<0||c<0)throw Error("civic anchors");
 const economy=s.slice(a,b).replace("!economy.has(i)&&streetSides","!economy.has(i)&&!civic.has(i)&&streetSides");
 const civic=s.slice(b,c).replace("!civic.has(i) && !economy.has(i) &&","!civic.has(i) && !economy.has(i) &&");
 s=s.slice(0,a)+civic+economy+s.slice(c);
 // On final nature layer, keep vegetation and stone decoration sparse in the harbour.
 s=once(s,"  // the last word: nothing left standing over a road",[
 "  if(z.kingdomTheme==='puertaria'){",
 "    const kept=pieces.filter((p,i)=>{",
 "      const id=p.piece.toLowerCase(),tile=tileAt(p.x,p.z);",
 "      if(/(?:^|[\\/_-])(?:tree|pine)(?:[\\/_-]|\\d)/i.test(id))return hash2(seed+1301,i,0)<.08;",
 "      if(/(?:^|[\\/_-])(?:rock|boulder|stone-pile)(?:[\\/_-]|\\d)/i.test(id)&&tile>=0&&!['rock','cliff'].includes(kindOf(h,tile)))return hash2(seed+1302,i,0)<.15;",
 "      return true;",
 "    });pieces.length=0;pieces.push(...kept);",
 "  }",
 "  // the last word: nothing left standing over a road"
 ].join("\n"));
 // City perimeter segments, use original licensed curtain pieces. Preserve explicit road exits and water access.
 s=once(s,"  /** The tread a foot stands on",[
 "  // HIGHFLY city enclosure: boundary of the capital, not its separate hill castle.",
 "  if(z.kingdomTheme){",
 "    const town=z.zones.find(q=>q.kind==='town');",
 "    if(town){",
 "      const land=new Set(town.tiles.filter(i=>dryLand(i)));",
 "      const occupied=new SolidGrid(pieces.flatMap(p=>pieceSolids(p)));",
 "      const wallList:PlacedPiece[]=[];",
 "      for(const i of land){const [x,zz]=at(i);",
 "        for(let d=0;d<6;d++){const j=g.neighbours(i)[d]!;if(j>=0&&land.has(j))continue;",
 "          if(j<0||!dryLand(j)||Math.abs(h.level[j]!-h.level[i]!)>1)continue;",
 "          if(roadLike(i)||roadLike(j))continue; // keep gates/road openings and waterside access open",
 "          const angle=d*Math.PI/3,nx=Math.cos(angle),nz=-Math.sin(angle);",
 "          const wx=x+nx*(R*Math.sqrt(3)/2-.45),wz=zz+nz*(R*Math.sqrt(3)/2-.45);",
 "          const p:PlacedPiece={piece:'kaykit-hexagon/wall-straight',x:wx,y:top(i),z:wz,rot:angle+Math.PI/2,scale:.38,stretch:R/(8.4*.38)};",
 "          if(!offRoad(p)||occupied.near(wx,wz,1.2).some(so=>solidDistance(so,wx,wz)<.65))continue;",
 "          wallList.push(p);",
 "        }",
 "      }",
 "      const towerSites=new Set<number>();for(const w of wallList){const i=tileAt(w.x,w.z);if(i>=0&&!towerSites.has(i)&&hash2(seed+1308,i,0)<.16&&wallList.filter(q=>tileAt(q.x,q.z)===i).length>=2){towerSites.add(i);const [x,zz]=at(i);if(!roadLike(i)&&!occupied.near(x,zz,1.3).some(so=>solidDistance(so,x,zz)<.85))pieces.push({piece:`kaykit-hexagon/building-tower-base-${castleColour}`,x,y:top(i),z:zz,rot:w.rot,scale:.21});}}",
 "      pieces.push(...wallList);",
 "    }",
 "  }",
 "  /** The tread a foot stands on"
 ].join("\n"));
 return s;
});
