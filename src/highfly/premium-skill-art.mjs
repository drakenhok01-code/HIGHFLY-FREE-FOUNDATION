/** HIGHFLY PHOENIX unique high-definition ORIGINAL skill icon artwork.
 * The same SVG is reused inside the menu and on Android's six skill buttons.
 * Each ID has its own silhouette, coloring and animation language.
 */
const SHAPES={
 attack:{hue:'#3cc9ff',mid:'#0d64e6',outline:'#c8f7ff',svg:
  '<path d="M12 77Q34 11 89 19 62 24 48 52 35 65 12 77z" fill="url(#skillFill)" stroke="#e7fbff" stroke-width="2"/>'+
  '<path d="M14 87Q34 30 94 37 71 46 52 67 33 80 14 87z" fill="none" stroke="#61e6ff" stroke-width="6"/>'+
  '<path d="M26 71Q44 30 81 20M30 83Q55 46 88 41" fill="none" stroke="#fff" stroke-opacity=".86" stroke-width="2"/>'},
 dash:{hue:'#2eeaff',mid:'#2357fb',outline:'#ccf9ff',svg:
  '<path d="M26 43l26-17 16 7-7 14-12 6 19 9-5 12-29-8-12 23-12-6 19-33-16 5z" fill="url(#skillFill)" stroke="#e9fcff" stroke-width="2"/>'+
  '<path d="M8 18h43M4 31h29M5 73h22M9 85h37" stroke="#9beeff" stroke-width="5" stroke-linecap="round"/>'+
  '<circle cx="59" cy="19" r="10" fill="#d7faff"/>'},
 roll:{hue:'#ffcc56',mid:'#f47a14',outline:'#fff4bd',svg:
  '<ellipse cx="50" cy="50" rx="36" ry="21" transform="rotate(-35 50 50)" fill="none" stroke="url(#skillFill)" stroke-width="12"/>'+
  '<ellipse cx="50" cy="50" rx="29" ry="17" transform="rotate(-35 50 50)" fill="none" stroke="#fff4ce" stroke-width="2.3"/>'+
  '<path d="M73 13L92 26 69 32 76 24zM23 67L9 83l25-2-8-7z" fill="#ffe3a6"/>'},
 heavy:{hue:'#ffa147',mid:'#e6382f',outline:'#fff3c4',svg:
  '<path d="M48 8l7 32 28-22-15 32 27 17-37-7-8 35-6-35-38 10 24-25L10 21l32 21z" fill="url(#skillFill)" stroke="#ffe8a1" stroke-width="2"/>'+
  '<path d="M21 93l27-45L78 8" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>'+
  '<path d="M50 37l10 12-9 12-10-12z" fill="#ffe6a4"/>'},
 pulse:{hue:'#e68aff',mid:'#752dde',outline:'#f8d6ff',svg:
  '<circle cx="50" cy="52" r="13" fill="url(#skillFill)" stroke="#ffe0ff" stroke-width="3"/>'+
  '<circle cx="50" cy="52" r="27" fill="none" stroke="#ce8bff" stroke-width="7" stroke-dasharray="66 12"/>'+
  '<circle cx="50" cy="52" r="41" fill="none" stroke="#ad50ff" stroke-width="3" stroke-dasharray="31 18"/>'+
  '<path d="M50 18v20M50 66v20M17 51h19M64 51h19" stroke="#fff" stroke-width="3"/>'},
 heal:{hue:'#82ff8b',mid:'#00a15b',outline:'#ecffc0',svg:
  '<path d="M39 14h22v25h25v22H61v25H39V61H14V39h25z" fill="url(#skillFill)" stroke="#eaffd0" stroke-width="3"/>'+
  '<path d="M20 78Q2 51 24 24M78 19Q98 44 83 70" fill="none" stroke="#a8ff90" stroke-width="6" stroke-linecap="round"/>'+
  '<path d="M39 38h22M50 27v45" stroke="#fff" stroke-width="3" opacity=".85"/>'}
};
export const SKILL_ICON_IDS=Object.freeze(Object.keys(SHAPES));
export function skillIcon(id,large=false){
 const def=SHAPES[id];if(!def)return '';
 return '<svg class="hf-skill-svg'+(large?' is-large':'')+'" viewBox="0 0 100 100" role="img" aria-label="Icono de '+id+'" xmlns="http://www.w3.org/2000/svg">'+
 '<defs><radialGradient id="skillFill"><stop stop-color="'+def.hue+'"/><stop offset="1" stop-color="'+def.mid+'"/></radialGradient>'+
 '<radialGradient id="skillBack"><stop stop-color="#4a317c"/><stop offset="1" stop-color="#10091e"/></radialGradient></defs>'+
 ''+
 '<path d="M11 10h25M10 12v25M90 63v24H65" fill="none" stroke="'+def.hue+'" stroke-width="2.4" stroke-linecap="round"/>'+
 '<circle cx="50" cy="50" r="38" fill="'+def.mid+'" opacity=".10"/>'+def.svg+'</svg>';
}
