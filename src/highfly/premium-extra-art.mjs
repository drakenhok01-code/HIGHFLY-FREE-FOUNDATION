/** Original HIGHFLY high-resolution SVG sprites for missing game objects.
 * Each glyph is centred in a consistent 100x100 safe area; never stretch raster
 * art or pretend an unavailable equipment piece is already owned.
 */
const GLYPHS={
 fish:{a:'#58dcff',b:'#176cb4',svg:'<path d="M13 51q29-34 67-5l12-17v43L80 57Q45 90 13 51z" /><path d="M20 50q33-28 62 0-26 29-62 0z" fill="#43b8db"/><circle cx="67" cy="43" r="5" fill="#c8fdff"/><path d="M23 49q20-7 39 3" fill="none" stroke="#e2fbff" stroke-width="3"/>'},
 ingot:{a:'#dde4fe',b:'#546385',svg:'<path d="M15 60l13-28h44l13 28-13 22H28z" /><path d="M29 33h42l-9 25H39z" fill="#eef6ff"/><path d="M15 60h70M36 63l-8 18M64 63l8 18" fill="none" stroke="#f9e4ab" stroke-width="3"/>'},
 blade:{a:'#aee7ff',b:'#507ab9',svg:'<path d="M52 7l16 9-10 57-15 4-13-11z" /><path d="M52 15l-10 45 9 9 7-42" fill="#d5fcff"/><path d="M24 73l43 8" fill="none" stroke="#f9d49a" stroke-width="9"/><path d="M46 74L35 91" fill="none" stroke="#e3c17c" stroke-width="7"/>'},
 seed:{a:'#96ef72',b:'#247c56',svg:'<path d="M48 88V35" fill="none" stroke="#eacb8c" stroke-width="5"/><path d="M48 59Q10 69 15 38q30-7 33 21M50 50q4-35 34-30 7 32-34 30M48 77Q24 76 27 60q20-3 21 17" /><circle cx="49" cy="22" r="12" fill="#d4ff98" stroke="#f7edbd" stroke-width="3"/>'},
 expansion:{a:'#d3a1ff',b:'#6e33b1',svg:'<path d="M17 35l18-19h30l18 19-8 45H25z" /><path d="M33 20v61M67 20v61M17 40h66" stroke="#f8e5bc" stroke-width="3" fill="none"/><path d="M50 41v31M34 57h32" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>'},
 helmet:{a:'#d8edfd',b:'#54619a',svg:'<path d="M18 65Q13 19 52 14 87 15 85 60l-22 25V48H42v36L18 69z" /><path d="M18 49h66M42 51v30M63 51v30" fill="none" stroke="#fbe6b4" stroke-width="5"/><path d="M30 31l15-12M70 31L58 19" stroke="#ffffff" stroke-width="3"/>'},
 boots:{a:'#b8b0f3',b:'#574375',svg:'<path d="M12 14h31v49q14 0 21 16-3 13-51 10zM53 14h29v49q9 0 13 15 1 12-42 11z" /><path d="M12 57h31M53 57h29M17 78h39M56 79h35" fill="none" stroke="#f8d4a0" stroke-width="4"/>'},
 gloves:{a:'#d8e6ff',b:'#4b568d',svg:'<path d="M18 39V18h10v24l7-28h10l-2 35 13-13 9 8-15 24-10 18H17L7 54zM68 34V17h11v26l8-14 9 7-9 32-9 17H56l7-27z" /><path d="M17 76h30M62 76h24" stroke="#ffd69a" fill="none" stroke-width="4"/>'},
 shoulder:{a:'#bde5fe',b:'#4b538b',svg:'<path d="M9 35q20-32 42-10 18-19 40 10l-9 33-22-12-9-21-10 21-22 12z" /><path d="M13 42h28M60 42h28" stroke="#f8dfb0" fill="none" stroke-width="5"/>'},
 pants:{a:'#b2a7f4',b:'#3b3a75',svg:'<path d="M26 14h48l9 72-24 7-11-46-10 46-24-7z" /><path d="M26 22h48M46 21l2 26" fill="none" stroke="#f2d0a7" stroke-width="4"/>'},
 necklace:{a:'#e8a9ff',b:'#813dd7',svg:'<path d="M19 19q0 60 31 60t31-60" fill="none" stroke="#ffdf9f" stroke-width="9"/><path d="M50 53l18 18-18 24-18-24z" /><path d="M50 57l8 12-8 14-8-14" fill="#f8d5ff"/>'},
 food:{a:'#f4ca79',b:'#a14e37',svg:'<path d="M13 54h74q0 28-22 31H35Q13 81 13 54z" /><path d="M19 54q12-12 23-2t19 0 20 2" fill="none" stroke="#f3e9b9" stroke-width="5"/><path d="M30 40q-9-17 4-27M49 42q9-15 0-27M65 42q-7-12 4-25" fill="none" stroke="#ffdfa4" stroke-width="5"/>'},
 forgepro:{a:'#ffbd65',b:'#a84352',svg:'<path d="M10 55h80l-15 24H25zM30 77h40v12H30z" /><path d="M46 44L68 8l13 9-24 34" fill="#fbd390"/><path d="M30 55l20 17M65 54L47 72" fill="none" stroke="#ffffff" stroke-width="3"/>'},
 herbalism:{a:'#8fff94',b:'#21965e',svg:'<path d="M47 90V20" fill="none" stroke="#ffd99d" stroke-width="5"/><path d="M47 64Q5 60 15 29q36-2 32 35M51 48Q84 12 87 26q8 34-36 35M45 79Q18 74 16 57q28-10 29 22" />'},
 mining:{a:'#84dafe',b:'#325dba',svg:'<path d="M21 16l60 55-10 12-57-61z" /><path d="M14 26Q41 0 79 21L69 38Q45 20 31 41z" fill="#ddf7ff"/><path d="M45 59l17 17" fill="none" stroke="#ffc585" stroke-width="6"/>'}
};
export const EXTRA_ICON_IDS=Object.freeze(Object.keys(GLYPHS));
export function extraPremiumIcon(name,large=false){
 const g=GLYPHS[name];if(!g)return null;
 const id='hf-extra-'+name.replace(/[^a-z0-9]/g,'');
 return '<svg class="hf-rpg-art hf-rpg-extra-icon'+(large?' is-large':'')+'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Objeto: '+name+'">'+
 '<defs><radialGradient id="'+id+'"><stop stop-color="'+g.a+'"/><stop offset="1" stop-color="'+g.b+'"/></radialGradient></defs>'+
 '<circle cx="50" cy="50" r="44" fill="'+g.b+'" fill-opacity=".19"/>'+
 '<g fill="url(#'+id+')" stroke="#ffebc6" stroke-width="2.5" stroke-linejoin="round">'+g.svg+'</g>'+
 '<path d="M8 19V8h12M80 92h12V80" fill="none" stroke="'+g.a+'" stroke-opacity=".72" stroke-width="2"/>'+
 '</svg>';
}
