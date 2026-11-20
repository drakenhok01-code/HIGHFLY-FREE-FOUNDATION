/** HIGHFLY: one semantic icon per native skill, reused in catalog/detail/slots. */
import {premiumArt} from './premium-assets.mjs';
export const SKILL_ICON_IDS=Object.freeze(['attack','dash','roll','heavy','pulse','heal']);
export function skillIcon(id,large=false){
 if(!SKILL_ICON_IDS.includes(id))return '';
 return premiumArt('skill_'+id,large)?.replace('hf-rpg-art hf-premium-icon','hf-rpg-art hf-premium-icon hf-skill-svg')||'';
}
