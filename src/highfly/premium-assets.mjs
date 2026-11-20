/** HIGHFLY visual asset registry.
 * Artist-approved HIGHFLY imagery is packaged locally: no external network.
 * Master board is split into optimized reusable game-icons; HTML is actual UI.
 */
export const SPRITE_COLS=6,SPRITE_ROWS=2;
export const ICONS=Object.freeze({
 health:0,mana:1,herb:2,ore:3,wood:4,weapon:5,shield:6,armor:7,
 ring:8,bag:9,skills:10,forge:11
});
export const assetUrl=name=>import.meta.env.BASE_URL+'highfly/'+name+'.webp';
export function premiumArt(name,large=false){
 const index=ICONS[name];
 if(index===undefined)return null;
 const x=index%SPRITE_COLS,y=Math.floor(index/SPRITE_COLS);
 const style='--hf-sprite-x:'+(100*x/(SPRITE_COLS-1))+'%;--hf-sprite-y:'+(100*y/(SPRITE_ROWS-1))+'%';
 return '<span class="hf-rpg-art hf-rpg-sprite'+(large?' is-large':'')+'" role="img" aria-label="'+name+'" style="'+style+'"></span>';
}
export const PLEDGE='Iconos tomados exclusivamente del tablero HIGHFLY aportado por el usuario, para esta app';
