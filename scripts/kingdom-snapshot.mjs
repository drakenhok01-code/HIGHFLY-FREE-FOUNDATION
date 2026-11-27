// K0.7 — download the static island actually built by the worker, not a new generation.
import fs from "node:fs/promises";
const root=process.argv[2]??"guildhall-native";
const file=root+"/apps/studio/src/hexworld/index.ts";
let s=await fs.readFile(file,"utf8");
function once(a,b){if(!s.includes(a))throw Error("Missing snapshot anchor "+a);s=s.replace(a,b)}
once("  batchSets,","  batchSets,\n  unpack,");
once("    const host = viewer.stage","    const host = viewer.stage");
once("      const { loose, clusters } = batchSets(await job.pieces, (p) => catalog.get(p.piece) !== undefined)",`      const packed = await job.pieces
      const { loose, clusters } = batchSets(packed, (p) => catalog.get(p.piece) !== undefined)
      if (!hall && current().screen === "town") viewer.setInfo({actions:[{
        label:"Descargar isla JSON",primary:true,run:()=>{
          void (async()=>{
            try{
              const shore=await job.shore
              if(disposed)return
              const pieces=unpack(packed).map((p,i)=>({...p,id:"piece-"+i,cluster:packed.cluster[i]})).filter(p=>catalog.get(p.piece)!==undefined)
              const snapshot={
                schema:"hf-kingdom-snapshot-v1",engine:"Guildhall",upstream:"ef56b1cdf247f8839bf7fbb289713b15dbacae8c",revision:"K0.7",
                name,seed,files,theme,shape,nature,step,groundMode:groundOf(param(ctx.query,"ground")),sourceUrl:location.href,
                coordinates:{units:"metres",up:"Y",yaw:"radians"},
                pieces,
                map:m,ground:g,shore,
                prefabs:await loadTiles(),
                limitations:{staticSnapshot:true,liveNPCState:false,liveWeatherState:false,readyForUnsung:false}
              }
              const json=JSON.stringify(snapshot,(_k,v)=>ArrayBuffer.isView(v)&&!(v instanceof DataView)?Array.from(v as unknown as ArrayLike<number>):v instanceof Map?Array.from(v.entries()):v instanceof Set?Array.from(v):v)
              const blob=new Blob([json],{type:"application/json"})
              const url=URL.createObjectURL(blob),a=document.createElement("a")
              a.href=url;a.download="HIGHFLY-"+theme+"-"+seed+".json";a.click()
              setTimeout(()=>URL.revokeObjectURL(url),10000)
              viewer.toast("Isla exportada",pieces.length+" piezas estáticas")
            }catch(error){viewer.toast("No se pudo exportar",String(error))}
          })()
        }
      }]})`);
await fs.writeFile(file,s);
