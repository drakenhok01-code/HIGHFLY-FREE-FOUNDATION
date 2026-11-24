/** HIGHFLY P5.1.1 SKY LEGEND — reproducible rare celestial events.
 * Pure scheduler: no GPU work, assets, randomness, timers or scene queries.
 * Day cycle: 45 game minutes. Lunar cycle: 8 game days.
 * Aurora: first night after full moon (day % 8 === 1), plus an extra
 * post-quarter night every second lunar cycle (day % 16 === 6).
 * Eclipse: only every fourth NEW moon (day % 32 === 4) near solar noon.
 * Every ordinary night is moon + stars, without compulsory auroras.
 */
const mod=(n,m)=>((n%m)+m)%m;
const smoother=x=>{const u=Math.max(0,Math.min(1,x));return u*u*(3-2*u);};
export function skyEvents(worldDays,solarPhase){
  const day=Math.floor(Number(worldDays));
  const p=mod(Number(solarPhase),1);
  const auroraDay=mod(day,8)===1 || mod(day,16)===6;
  const nightStrength=p>=.5
    ?smoother((p-.78)/.12)
    :1-smoother((p-.115)/.105);
  const aurora=auroraDay?nightStrength:0;
  const eclipseDay=mod(day,32)===4;
  const eclipse=eclipseDay?smoother((p-.40)/.065)*(1-smoother((p-.535)/.065)):0;
  return {day,aurora,eclipse,auroraNight:auroraDay,eclipseDay};
}
export function eventPreview(mode,worldDays,phase,auroraSetting='auto'){
 const events=mode==='auto'?skyEvents(worldDays,phase):{day:Math.floor(worldDays),aurora:0,eclipse:0,auroraNight:false,eclipseDay:false};
 const aurora=auroraSetting===true?1:auroraSetting===false?0:events.aurora;
 const eclipse=mode==='eclipse'?1:events.eclipse;
 return {...events,aurora,eclipse};
}
