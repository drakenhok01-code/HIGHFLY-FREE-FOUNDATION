/** Mission art: semantic original SVG scenes for all 19 real quest keys.
 * Unlike a screenshot, counters, titles, objectives and controls remain live DOM.
 * These are interim vector illustrations, not the user's full-resolution paintings.
 */
const questNames=[
 ['scales',/grave|campanilla/i],['amber',/ámbar|ambar/i],['kept',/relicario/i],
 ['nine',/nueve/i],['answer',/respuesta|eco/i],['vellum2',/cinco marcas/i],
 ['count2',/melodía completa|sesenta notas/i],['names',/cuatro nombres/i],
 ['rings',/anillos|círculos/i],['vellum',/líneas sobre el pergamino/i],
 ['count',/cuenta del guardián/i],['seeds',/semillas/i],
 ['stair',/escalera/i],['voices',/voces|coro/i],['lamps',/faroles/i],
 ['water',/agua|estanque/i],['debt',/deuda/i],['windfall',/cosecha|huerto/i]
];
const motifs={
 scales:'<g fill="none" stroke="#ffe2a0" stroke-width="8"><path d="M340 136v135M430 116v155M520 147v124"/></g><g fill="#dcb1ff" stroke="#ffdda4" stroke-width="5"><path d="M315 274q25-60 50 0zM404 274q25-75 50 0zM493 274q25-45 50 0z"/></g>',
 amber:'<g fill="#ffc768" stroke="#ffeab8" stroke-width="4"><path d="M360 296l33-91 52 24 14 80-66 49zM580 310l42-85 40 20 12 65-51 49z"/></g>',
 kept:'<g stroke="#ffe2ac" stroke-width="8" fill="#6f488e"><rect x="360" y="200" width="90" height="120" rx="10"/><rect x="550" y="176" width="90" height="144" rx="10"/></g>',
 nine:'<g fill="#daaa65" stroke="#ffebaf" stroke-width="5"><path d="M280 246q50-110 100 0zM440 203q45-110 90 0zM600 246q50-110 100 0z"/></g>',
 answer:'<path d="M500 109l49 140-49 77-49-77z" fill="#d7b5ff" stroke="#ffe4a2" stroke-width="8"/><circle cx="500" cy="215" r="108" fill="none" stroke="#d1a3ff" stroke-width="8" stroke-dasharray="26 16"/>',
 vellum2:'<g fill="#ead9b4" stroke="#ab844a" stroke-width="5"><path d="M280 200h135l-15 145H270zM535 184h130l-14 145H520z"/></g><path d="M320 245l46 38M575 244l48 42" stroke="#875dc9" stroke-width="7"/>',
 count2:'<g stroke="#ffe7b0" fill="none" stroke-width="7"><path d="M300 270q130-100 380 0M300 300q130-100 380 0"/></g><g font-size="100" fill="#fff1c4"><text x="430" y="254">♫</text><text x="600" y="276">♪</text></g>',
 names:'<g fill="#1b1035" stroke="#bf8bfa" stroke-width="4"><path d="M280 344q14-124 75-169 65 60 70 169zM480 358q20-145 74-198 60 65 68 198zM680 348q15-120 70-167 60 70 72 167z"/></g><g fill="#d795ff"><circle cx="347" cy="242" r="5"/><circle cx="366" cy="242" r="5"/><circle cx="545" cy="236" r="5"/><circle cx="563" cy="236" r="5"/></g>',
 rings:'<g fill="none" stroke="#ffc882" stroke-width="14"><ellipse cx="490" cy="344" rx="220" ry="74"/><ellipse cx="490" cy="343" rx="132" ry="43"/></g>',
 vellum:'<path d="M230 360L340 260l130 60 140-120 135 78" fill="none" stroke="#ffe5ac" stroke-width="14"/><g fill="#f4ddc3" stroke="#b68c69" stroke-width="5"><path d="M332 239l-14-90 83-21 14 100zM613 187l-9-89 78-6 13 98z"/></g>',
 count:'<g stroke="#ffe4aa" fill="none" stroke-width="7"><path d="M250 310q250-120 470 0M250 333q250-120 470 0M250 357q250-120 470 0"/></g><g fill="#fff0bc" font-size="105"><text x="350" y="260">♪</text><text x="550" y="265">♫</text></g>',
 seeds:'<g fill="#a5ffbb" stroke="#ffe1ac" stroke-width="4"><path d="M390 353q-110-100-40-150 65 25 40 150zM450 330q70-140 130-105 8 90-130 105z"/></g>',
 stair:'<path d="M220 355l100-26 120-35 120-39 100-37 100-29" stroke="#f6d5ab" stroke-width="36" fill="none"/><g fill="#1f1236"><path d="M670 300q30-120 70-180 38 76 65 180z"/></g>',
 voices:'<g stroke="#e6b5ff" stroke-width="7" fill="none"><circle cx="495" cy="232" r="110"/><circle cx="495" cy="232" r="165"/><path d="M470 174q20-40 50 0v105h-50z"/></g>',
 lamps:'<g stroke="#ffdda3" stroke-width="7" fill="#edb454"><path d="M310 220h65v88h-65zM480 160h65v110h-65zM660 220h65v88h-65z"/></g>',
 water:'<g fill="none" stroke="#88edff" stroke-width="11"><path d="M180 274q110-40 220 0t220 0t220 0M160 310q120-50 240 0t240 0t240 0"/></g>',
 debt:'<g stroke="#ffcf7c" stroke-width="9" fill="#8051a1"><path d="M485 98l110 68-18 177H394l-16-177z"/><circle cx="486" cy="245" r="50" fill="#ffdc7e"/></g>',
 windfall:'<g fill="#dbcf75" stroke="#fff3a9" stroke-width="4"><circle cx="365" cy="225" r="23"/><circle cx="455" cy="192" r="25"/><circle cx="560" cy="227" r="26"/><circle cx="652" cy="195" r="24"/></g>',
 primary:'<path d="M170 360q250-100 640-20" fill="none" stroke="#fff0bc" stroke-width="25"/><path d="M480 104v226" fill="none" stroke="#ffda93" stroke-width="18"/>'
};
export const QUEST_ART_KEYS=Object.freeze(Object.keys(motifs));
export function questIllustration(id,title=''){
 const key=motifs[id]?id:questNames.find(([,re])=>re.test(title))?.[0]||'primary';
 const motif=motifs[key];
 return '<svg class="hf-rpg-quest-illustration" role="img" aria-label="Escena de misión: '+String(title).replaceAll('"','&quot;')+'" viewBox="0 0 1000 480" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">'+
 '<defs><linearGradient id="hfQuestSky" x2="0" y2="1"><stop stop-color="#25105b"/><stop offset=".48" stop-color="#5e3d9d"/><stop offset="1" stop-color="#f4c39a"/></linearGradient><linearGradient id="hfQuestFloor" x2="0" y2="1"><stop stop-color="#49388c"/><stop offset="1" stop-color="#160a35"/></linearGradient></defs>'+
 '<rect width="1000" height="480" fill="url(#hfQuestSky)"/><circle cx="778" cy="89" r="64" fill="#ffdfa6" opacity=".7"/>'+
 '<path d="M0 251l160-133 150 116 166-153 172 166 151-116 201 150v201H0z" fill="#342877" stroke="#a7a5da" stroke-width="4"/>'+
 '<path d="M0 311q100-68 217-25t213-7t245 8t325-39v240H0z" fill="#536ca0"/>'+
 '<path d="M0 364q165-55 335-8t335 4t330-14v134H0z" fill="url(#hfQuestFloor)"/>'+
 '<path d="M0 405q245-40 500 8t500-4" fill="none" stroke="#b77bee" stroke-width="7" opacity=".7"/>'+
 '<g stroke="#e2b0ff" stroke-width="4" fill="#372768"><path d="M120 318V178h90v140M790 315V175h100v140"/><path d="M115 175l50-63 50 63M790 175l50-63 50 63"/></g>'+
 '<g fill="#f5a8d7" opacity=".88"><circle cx="90" cy="321" r="21"/><circle cx="126" cy="329" r="20"/><circle cx="160" cy="311" r="26"/><circle cx="853" cy="322" r="18"/><circle cx="890" cy="335" r="28"/><circle cx="931" cy="316" r="19"/></g>'+
 '<g>'+motif+'</g><g fill="#ffe2a8"><circle cx="88" cy="123" r="3"/><circle cx="210" cy="91" r="3"/><circle cx="713" cy="65" r="3"/><circle cx="904" cy="133" r="3"/></g>'+
 '</svg>';
}
