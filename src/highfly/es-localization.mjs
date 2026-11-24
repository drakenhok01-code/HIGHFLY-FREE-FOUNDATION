/** HIGHFLY F0.13 Spanish player-facing localization.
 * Preserves all original IDs, mission conditions, story timing and save keys.
 * Unknown strings are reported in ?hfi18nqa=1 rather than incorrectly invented.
 */
const PAIRS=[
 ['The note falters','Has caído'],
 ['You will wake at the last safe place','Reaparecerás en el último lugar seguro.'],
 ['Cadence','Cadencia'],
 ['The refrain','El estribillo'],
 ['The Petal Court answers. Far to the east, a second voice stirs.','El Patio de los Pétalos responde. Más al este, despierta una segunda voz.'],
 ['Two voices now. Across the water the old bridge remembers its shape.','Ya son dos voces. Al otro lado del agua, el viejo puente recupera su forma.'],
 ['The Lantern Court burns again. The string runs on, south across the lake.','El Patio de los Faroles vuelve a brillar. El camino de luz sigue al sur, cruzando el lago.'],
 ['Reeds and water, and a voice among them. Five now.','Juncos, agua y una voz entre ellos. Ya son cinco.'],
 ['The Aurel Court gives back its gold. Two remain, and the silence knows it.','El Patio de Aurel recupera su oro. Quedan dos y el silencio lo sabe.'],
 ['The orchard wakes. Only the Crown is left, where the Mute first fell.','El huerto despierta. Solo falta la Corona, donde cayó el primer Silente.'],
 ['Eight voices. The whole Vale sings, from the mountains to the sea.','Ocho voces. El Valle entero canta, de las montañas al mar.'],
 ['The petals fall the same whether anyone sings or not. But they fall better to music.','Los pétalos caen igual, canten o no. Pero con música caen mejor.'],
 ['The petals fall the same whether anyone sings or not. But they fall better to music','Los pétalos caen igual, canten o no. Pero con música caen mejor'],
 ['Eight spires stood over the Vale, and every one is silent. The nearest waits below, on the Petal Court.','Ocho agujas dominaban el Valle y todas enmudecieron. La más cercana está abajo, en el Patio de los Pétalos.'],
 ['Each court out here kept three bells on its mesa. The Mute stand over them now. Ring all three and the court will hear.','Cada patio tenía tres campanas en su meseta. Los Silentes las vigilan. Hacé sonar las tres y el patio escuchará.'],
 ['Sound and petals','Sonido y pétalos'],
 ['Sound and Petals','Sonido y pétalos'],

 ['The Vale once sang. Its spires carried one chord from the mountains to the sea.','El Valle cantaba antaño. Sus agujas llevaban una misma melodía desde las montañas hasta el mar.'],
 ['Then the Mute came, and the song went out, one voice at a time.','Entonces llegaron los Silentes y la canción se apagó, voz por voz.'],
 ['You kept the last note. Carry it back to them.','Conservaste la última nota. Devolvésela a quienes la perdieron.'],
 ['Eight voices. One song.','Ocho voces. Una sola canción.'],
 ['It runs along the strings from court to court, and nobody alive has heard it whole before.','Recorre los hilos de un patio a otro. Nadie con vida la había oído completa.'],
 ['The people of the Vale are awake. The lamps are lit. The bells answer each other across the water.','El pueblo del Valle ha despertado. Las lámparas brillan y las campanas se responden a través del agua.'],
 ['And the one who carried the last note home may put the blade away.','Y quien trajo de vuelta la última nota ya puede envainar su espada.'],
 ['the Dawn Terrace','la Terraza del Alba'],['the Petal Court','el Patio de los Pétalos'],
 ["Cantor's Rise",'el Alto del Cantor'],['the Choir','el Coro'],['the Lantern Court','el Patio de los Faroles'],
 ['the Reed Court','el Patio de los Juncos'],['the Aurel Court','el Patio de Aurel'],
 ['the Orchard Court','el Patio del Huerto'],['the Crown','la Corona'],
 ['Walk to the lookout','Andá hasta el mirador'],['Lookout','Mirador'],
 ['Three voices, one chord. The inner Vale remembers its song.','Tres voces, un acorde. El interior del Valle recuerda su canción.'],
 ['And the old roads wake: strings of light, out over the water, to five courts that are silent still.','Y despiertan los viejos caminos: hilos de luz sobre el agua que conducen a cinco patios aún silenciosos.'],
 ['It is breaking. So is its patience.','Está cediendo. Y también se le acaba la paciencia.'],
 ['It gathers itself, and calls the others to it.','Recupera fuerzas y llama a los demás.'],
 ['The court has heard. So have the Mute.','El patio lo ha oído. Los Silentes también.'],
 ["The Keeper's Count",'La cuenta del guardián'],['Low, Middle, High','Grave, medio, agudo'],['Set chimes right on the mesas','Afiná las campanillas de las mesetas'],
 ['Amber for the Mason','Ámbar para el cantero'],['Break song-crystals open in the meadows','Rompé cristales de canción en las praderas'],
 ['What the Singers Kept','Lo que guardaron los cantores'],['Open reliquaries on the mesas','Abrí relicarios en las mesetas'],
 ['Nine Bells','Nueve campanas'],['Ring the bells out on the mesas','Hacé sonar las campanas de las mesetas'],
 ['An Answer for the Silence','Una respuesta al silencio'],['Answer echoes at the spires of courts that sing','Respondé a los ecos de las agujas de los patios despiertos'],
 ['The Far Sheets','Las hojas lejanas'],['Reach the survey marks by the five pools beyond the water','Alcanzá las marcas junto a los cinco lagos más allá del agua'],
 ['The Whole Tune','La melodía completa'],['Find lost notes of the old song','Encontrá las notas perdidas de la antigua canción'],
 ['Four Names','Cuatro nombres'],['Bring down the named Mute of the outer courts','Derrotá a los Silentes con nombre de los patios exteriores'],
 ['The Old Drills','Los viejos ejercicios'],['Win trials at the rings on the mesas','Superá pruebas en los círculos de las mesetas'],
 ['Lines on the Vellum','Líneas sobre el pergamino'],['Reach the survey marks','Alcanzá las marcas topográficas'],
 ['Seeds of the Petal Court','Semillas del Patio de los Pétalos'],['Gather lantern seeds on the Petal mesa','Recogé semillas de farol en la meseta de los Pétalos'],
 ['The Watch on the Stair','La guardia de la escalera'],['Clear the Mute from the road to the Rise','Eliminá a los Silentes del camino hacia el Alto'],
 ['Voices for the Choir','Voces para el Coro'],
 ['Lamps of the Lantern Court','Faroles del Patio de los Faroles'],['Light the lamps round the Lantern mesa','Encendé los faroles alrededor de la meseta'],
 ['What the Water Took','Lo que se llevó el agua'],['Swim out to the floats on the Reed pool','Nadá hasta las boyas del lago de los Juncos'],
 ['The Gilded Debt','La deuda dorada'],['Clear the Mute from the Aurel mesa','Eliminá a los Silentes de la meseta de Aurel'],
 ['Windfall','Frutos caídos'],['Gather the windfall in the orchard','Recogé los frutos caídos en el huerto'],
 ['Stand against the waves','Resistí las oleadas'],['The Mute','Los Silentes'],
 ['Keeper of the Terrace','Guardián de la Terraza'],['Luthier','Lutier'],['Mapmaker','Cartógrafo'],
 ['Gardener of the Petal Court','Jardinera del Patio de los Pétalos'],
 ['Ringer of the Rise','Campanero del Alto'],['Master of the Choir','Maestro del Coro'],
 ['Lamplighter','Farolero'],['Fisher of the Reed Court','Pescadora del Patio de los Juncos'],
 ['Archivist of the Aurel Court','Archivero del Patio de Aurel'],
 ['Keeper of the Orchard','Guardián del Huerto'],['The First Singer','La Primera Cantora'],
 ['Stonemason','Cantero'],['Beekeeper','Apicultor'],['Sweeper of the long stair','Barrendero de la Gran Escalera'],
 ['Singer of the Choir','Cantor del Coro'],["a singer's child",'hijo de un cantor'],
 ['Unsung Vale','HIGHFLY: ASCENSIÓN'],['HIGHFLY FREE FOUNDATION','HIGHFLY: ASCENSIÓN'],
 ['Continue','Continuar'],['New Journey','Nueva aventura'],['New game','Nueva partida'],
 ['Begin','Comenzar'],['Resume','Reanudar'],['Settings','Opciones'],['Options','Opciones'],
 ['Quality','Calidad gráfica'],['Low','Baja'],['Medium','Media'],['High','Alta'],['Ultra','Ultra'],
 ['Custom','Personalizada'],['Graphics','Gráficos'],['Gameplay','Jugabilidad'],
 ['Frame rate to hold','FPS objetivo'],['Render scale','Escala de resolución'],
 ['Field of view','Campo de visión'],['Show frame rate','Mostrar FPS'],
 ['Shadows','Sombras'],['Reflections','Reflejos'],['Music','Música'],['Sound effects','Efectos de sonido'],
 ['Master volume','Volumen general'],['Sensitivity','Sensibilidad'],['Invert Y','Invertir eje vertical'],
 ['Pause','Pausa'],['Paused','En pausa'],['Resume Journey','Reanudar aventura'],['Quit','Salir'],
 ['Return to title','Volver al inicio'],['Return to menu','Volver al menú'],['Restart','Reiniciar'],
 ['Map','Mapa'],['Journal','Diario'],['Hero','Personaje'],['Credits','Créditos'],
 ['The Vale sings again','El Valle vuelve a cantar'],['Every spire is tuned.','Todas las agujas han sido afinadas.'],
 ['Time in the Vale','Tiempo en el Valle'],['Lost notes','Notas perdidas'],
 ['Quests done','Misiones completadas'],['Trials won','Pruebas superadas'],
 ['Reliquaries opened','Relicarios abiertos'],['Times fallen','Derrotas'],
 ['Of all there is to do','Progreso total'],
 ['Interact','Interactuar'],['Explore','Explorar'],['Talk','Hablar'],
 ['Confirm','Confirmar'],['Cancel','Cancelar'],['Continue the journey','Continuar la aventura'],
 ['Skip','Saltar'],['Skip intro','Saltar introducción'],['Hold to skip','Mantené para omitir'],
 ['Done','Completado'],['New quest','Nueva misión'],['Quest complete','Misión completada'],
 ['Objective','Objetivo'],['Active quests','Misiones activas'],
 ['Reach the next spire','Alcanzá la siguiente aguja'],
 ['The path goes on','El camino continúa'],
 ['Follow the path to the Petal Court','Seguí el camino hacia el Patio de los Pétalos'],
 ['Follow the path to the Petal Court.','Seguí el camino hacia el Patio de los Pétalos.'],
 ['You are dead','Has caído'],['Try again','Volver a intentar'],
 ['Fast travel','Viaje rápido'],['Destination','Destino'],
 ['Close','Cerrar'],['Back','Atrás'],['Apply','Aplicar'],
 ['Language','Idioma'],['Spanish','Español'],
 ['A new note','Una nueva nota'],
 ['Press E to interact','Pulsá E para interactuar'],
 ['One note. One song.','Una nota. Una canción.'],
 ['A new path opens','Se abre un nuevo camino'],
 ['The Vale stays open. At its spire every court will wake an echo of its silence for you to answer, and there are notes, trials and reliquaries still out on the mesas.','El Valle permanece abierto. Las agujas de cada patio despertarán ecos del silencio que deberás enfrentar. Aún quedan notas, pruebas y relicarios en las mesetas.'],
 ["Controls","Controles"],
 ["Audio","Audio"],
 ["Off","Desactivado"],
 ["On","Activado"],
 ["New journey","Nueva aventura"],
 ["Guide","Guía"],
 ["Challenge","Dificultad"],
 ["Gentle","Suave"],
 ["Standard","Normal"],
 ["Hard","Difícil"],
 ["Look sensitivity","Sensibilidad de cámara"],
 ["Invert vertical look","Invertir eje vertical"],
 ["Sprint is a switch","Correr con pulsación alternada"],
 ["Press once to run, again to stop","Tocá una vez para correr y otra para detenerte"],
 ["Camera shake","Sacudida de cámara"],
 ["Bright flashes","Destellos intensos"],
 ["On the big moments of a fight","En los momentos importantes del combate"],
 ["How hard the Mute hit","Daño infligido por los Silentes"],
 ["Lowers the render resolution when needed, never the detail","Baja la resolución cuando hace falta sin reducir los detalles"],
 ["The most the game will use","Máxima resolución que utilizará el juego"],
 ["Lower is faster; the image is sharpened back up","Menor resolución mejora el rendimiento y recupera nitidez"],
 ["Object shadows","Sombras de objetos"],
 ["Light shafts and mist","Rayos de luz y neblina"],
 ["Floor reflections","Reflejos del suelo"],
 ["Ground cover","Vegetación del suelo"],
 ["How far grass and flowers reach","Distancia de césped y flores"],
 ["Effects","Efectos"],
 ["Preparing the valley","Preparando Aetheria"],
 ["Waking the valley","Despertando Aetheria"],
 ["The Valley awakens","Aetheria despierta"],
 ["Opening the valley","Abriendo el Valle"],
 ["Warming the light","Encendiendo la luz"],
 ["Building the world","Construyendo el mundo"],
 ["A bolt met with the blade goes back where it came from.","Un proyectil bien desviado con la espada regresa a su origen."],
 ["Blows landed without one taken build cadence. One hit and it is lost.","Los ataques encadenados sin recibir daño aumentan tu cadencia."],
 ["R hums the refrain and mends you. It comes back at spires, bells and pylons.","La curación se recupera en agujas, campanas y pilares."],
 ["A blow slipped at the last instant opens a riposte.","Una evasión en el último instante abre una oportunidad de contraataque."],
 ["A chorister's ward goes when the singer is broken.","La protección del cantor desaparece al derrotarlo."],
 ["There is a reliquary on every mesa, off the paths.","Cada meseta esconde un relicario lejos de los caminos."],
 ["Light blows ring off a warden's wall of shards. A heavy one cracks it.","Los golpes fuertes pueden romper los escudos de fragmentos."],
 ["H holds the world still for a picture.","Podés capturar momentos de tu aventura con el modo foto."],
 ["The valley has fallen silent. Wake its spires and let it sing again.","El Valle perdió su voz. Despertá sus agujas y devolvé la llama a Aetheria."],
 ["The Vale stays open.","El Valle permanece abierto."],
 ["Raising the mesas","Levantando las mesetas"],
 ["Building the cities","Construyendo las ciudades"],
 ["Laying the paths","Trazando los caminos"],
 ["Letting the water fall","Formando cascadas y ríos"],
 ["Growing the forest","Dando vida a los bosques"],
 ["Casting the evening light","Iluminando el atardecer de Aetheria"],
 ["Evening.","Buenas tardes."],
 ["It sings. Listen.","Escuchá: el Valle vuelve a cantar."],
 ["Mind the edge.","Cuidado con el borde."],
 ["There you are.","Ahí estás."],
 ["Still in one piece, I see.","Veo que seguís de una pieza."],
 ["You hum when you walk. Did you know?","Tarareás cuando caminás, ¿lo sabías?"],
 ["Good light for it.","Una buena luz para esta aventura."],
 ["Go well.","Que te vaya bien."],
 ["Do not let me keep you.","No quiero detenerte."],
 ["Fine evening for mending a valley.","Una hermosa tarde para devolverle la vida al Valle."],
 ["The Stillness. Where it stands, no note has sounded since the fall.","La Quietud: allí donde permanece, ninguna nota ha sonado desde la caída."],
 ["The Unsung: a silence as old as the Choir itself.","Los Olvidados: un silencio tan antiguo como el propio Coro."],
 ["Some of the Mute have stood in the silence so long that they have names.","Algunos Silentes han permanecido tanto tiempo en el vacío que ya tienen nombres."],
 ["The Mute. Shards of the silence, drawn to anything that still sings.","Los Silentes: fragmentos del silencio atraídos por cuanto todavía canta."],
 ["A lost note of the old song. There are more along the paths.","Una nota perdida de la antigua melodía. Hay más junto a los caminos."],
 ["Every note is home.","Todas las notas han regresado a casa."],
 ["The lake has no stair back up. Pause, and choose to return to the last safe place.","El lago no tiene salida por escaleras. Abrí Pausa y regresá al último lugar seguro."],
 ["Eight spires stood over the Vale, and every one is silent. The nearest waits below, on the Petal Court.","Ocho agujas se alzan sobre el Valle, todas silenciosas. La más cercana espera abajo, en el Patio de los Pétalos."],
 ["The Petal Court answers. Far to the east, a second voice stirs.","El Patio de los Pétalos responde. Al este, una segunda voz despierta."],
 ["Two voices now. Across the water the old bridge remembers its shape.","Ya son dos voces. Al otro lado del agua, el viejo puente recupera su forma."],
 ["The Lantern Court burns again. The string runs on, south across the lake.","El Patio de los Faroles vuelve a brillar. El hilo continúa hacia el sur, cruzando el lago."],
 ["Reeds and water, and a voice among them. Five now.","Juncos, agua y una voz entre ellos. Ya son cinco."],
 ["The Aurel Court gives back its gold. Two remain, and the silence knows it.","El Patio de Aurel recupera su oro. Quedan dos y el silencio lo sabe."],
 ["The orchard wakes. Only the Crown is left, where the Mute first fell.","El huerto despierta. Solo queda la Corona, donde cayeron los primeros Silentes."],
 ["Eight voices. The whole Vale sings, from the mountains to the sea.","Ocho voces. Todo el Valle canta, desde las montañas hasta el mar."],
 ["The graphics device was reset. Click to reload; what you have done is kept.","Se reinició el sistema gráfico. Tocá para recargar: tu progreso sigue guardado."],
];
// P5.2.1: exact unsung loading tips, world markers, in-game guide.
const EXTRA_PAIRS=[
 ["A bolt met with the blade goes back where it came from.","Un proyectil golpeado con la espada vuelve hacia su atacante."],
 ["Blows landed without one taken build cadence. One hit and it is lost.","Los golpes consecutivos aumentan tu cadencia. Si recibís daño, se reinicia."],
 ["R hums the refrain and mends you. It comes back at spires, bells and pylons.","Usá Curación para recuperar vida. Sus cargas se recuperan en agujas, campanas y pilares."],
 ["A blow slipped at the last instant opens a riposte.","Esquivá justo antes de recibir un golpe para habilitar un contraataque."],
 ["A chorister's ward goes when the singer is broken.","La protección del cantor desaparece cuando lo derrotás."],
 ["There is a reliquary on every mesa, off the paths.","Hay un relicario en cada meseta, lejos de los caminos."],
 ["Light blows ring off a warden's wall of shards. A heavy one cracks it.","Los golpes livianos rebotan contra el guardián. Un golpe fuerte rompe su defensa."],
 ["H holds the world still for a picture.","H activa el modo fotografía y congela el mundo."],
 ["The Petal Court","El Patio de los Pétalos"],["The Aurel Court","El Patio de Aurel"],
 ["The Lantern Court","El Patio de los Faroles"],["The Reed Court","El Patio de los Juncos"],
 ["The Orchard Court","El Patio del Huerto"],["The Dawn Terrace","La Terraza del Alba"],
 ["String of light","Hilo de luz"],["The Vale","El Valle"],
 ["The blade","La espada"],["Staying alive","Supervivencia"],["Combo and heavy","Combo y golpe fuerte"],
 ["Falling strike","Ataque descendente"],["Struck back","Proyectil devuelto"],["The last note","La última nota"],
 ["Dodge roll","Rodar"],["Wards","Protecciones"],["The toll","La campanada"],
 ["The Shade","La Sombra"],["The rush","La embestida"],["Falling in a court","Caer en un patio"],
 ["Spires","Agujas"],["Strings of light","Hilos de luz"],["Bells","Campanas"],
 ["Reliquaries and charms","Relicarios y amuletos"],["Chimes","Campanillas"],
 ["Song-crystals","Cristales de canción"],["Echoes","Ecos"],["Photo mode","Modo fotografía"],
 ["Left mouse strikes, three cuts to a combo. Right mouse is the heavy blow: slower, and it cracks a warden's guard.",
 "Con el botón de ataque podés encadenar tres golpes. El golpe fuerte es más lento, pero rompe la defensa de los guardianes."],
 ["Strike in the air and he turns and comes down blade first. The higher the fall, the harder it lands.",
 "Atacá en el aire para descender con la espada. Cuanto mayor sea la altura, más fuerte será el impacto."],
 ["Blows landed without one taken build cadence in four steps. Each step puts more weight in the blade; one hit taken and it is lost.",
 "Cada golpe consecutivo aumenta la cadencia hasta cuatro niveles. Al recibir daño, la perdés."],
 ["A blow slipped at the last instant leaves an opening. Strike at once and the cut lands far harder.",
 "Esquivá justo antes de recibir daño y atacá enseguida para realizar un contraataque poderoso."],
 ["A bolt met with the blade goes back at whoever stands nearest its line.",
 "Podés devolver un proyectil golpeándolo con la espada."],
 ["A named Mute or a giant that is nearly spent can be ended at a stroke. Stand near and press E.",
 "Podés rematar a los Silentes con nombre o a los gigantes debilitados. Acercate y pulsá USAR."],
 ["R hums the note you carry and it mends you. A few to a journey; they return at spires, bells, pylons and with lost notes.",
 "La curación restaura tu vida. Recuperás sus cargas en agujas, campanas, pilares y al encontrar notas."],
 ["Ctrl or C. For a moment in the middle of it nothing can touch you.",
 "Rodá para esquivar; durante una parte del movimiento sos invulnerable."],
 ["A chorister throws a ward over one of its own. Break the singer and the ward goes with it.",
 "Los cantores protegen a otros enemigos. Derrotá al cantor para quitar esa barrera."],
 ["A Toller sends a ring out along the ground. Jump it, or roll through it as it reaches you.",
 "El Campanero crea una onda circular en el suelo. Saltá o rodá para evitarla."],
 ["It lets go of its shape and takes it up again at your back. When it vanishes, roll.",
 "La Sombra se desvanece y reaparece detrás tuyo. Cuando desaparezca, preparate para rodar."],
 ["A brute that cannot reach you draws a line on the ground and comes down it. Step off the line.",
 "Los brutos anuncian su embestida con una marca en el suelo. Salí de su trayectoria."],
 ["A court remembers the wave you reached. You come back to it, not to the beginning.",
 "Cada patio recuerda la oleada alcanzada. Si caés, no volvés al comienzo del desafío."],
 ["Clear a court, then strike its spire's notes: press E as each ring of light closes on the shaft.",
 "Despejá el patio y afiná su aguja con USAR cuando los anillos luminosos se cierren."],
 ["From any pylon the map can send you along the strings to a court that already sings.",
 "Los pilares permiten viajar por los hilos de luz hasta patios ya despertados."],
 ["Each court beyond the water sleeps until its three bells have been rung, out on its mesa.",
 "Cada patio al otro lado del agua requiere tocar sus tres campanas."],
 ["One casket on every mesa, off the paths. What it held is worn from the Hero screen, two at a time.",
 "Hay un relicario por meseta. Equipá sus amuletos desde Personaje, hasta dos por vez."],
 ["Three small bells to a set. Strike them from the lowest voice to the highest.",
 "Tocá las tres campanillas desde el tono más grave hasta el más agudo."],
 ["Clusters of amber in the meadows. A cut breaks one open for what it held.",
 "Encontrá cristales de ámbar por las praderas. Un golpe permite obtener su contenido."],
 ["Once the Vale sings, a court will call its guard back at its spire: three harder waves, paid in resonance.",
 "Cuando el Valle vuelva a cantar, las agujas permitirán desafíos de tres oleadas más difíciles."],
 ["H holds the world still and frees the camera. Click saves the picture.",
 "H congela el mundo y libera la cámara. Tocá la pantalla para guardar una fotografía."]
];
export const SPANISH=new Map([...PAIRS,...EXTRA_PAIRS]);
const PATTERNS=[
 [/^Return to (.+)$/,'Volvé con $1'],
 [/^Talk to (.+)$/,'Hablá con $1'],
 [/^Defeat (.+)$/,'Derrotá a $1'],
 [/^Find (.+)$/,'Encontrá $1'],
 [/^Gather (.+)$/,'Recogé $1'],
 [/^Open (.+)$/,'Abrí $1'],
 [/^(\d+)\s+fps\s*·\s*(\d+)%$/i,'$1 FPS · resolución $2 %']
];
export function translateHighfly(text){
 if(typeof text!=='string')return text;
 const m=/^(\s*)([\s\S]*?)(\s*)$/.exec(text),core=m?.[2]??text;
 if(SPANISH.has(core))return (m?.[1]??'')+SPANISH.get(core)+(m?.[3]??'');
 const bell=/^Bell (\d+) of 3$/.exec(core);
 if(bell)return (m?.[1]??'')+'Campana '+bell[1]+' de 3'+(m?.[3]??'');
 if(core.startsWith('The ')&&SPANISH.has('the '+core.slice(4)))
  return (m?.[1]??'')+SPANISH.get('the '+core.slice(4)).replace(/^l/, 'L')+(m?.[3]??'');
 const objective=/^(Ring the bells of |Ride the strings to |Follow the path to |Break the silence at |Tune the spire at )(.+)$/.exec(core);
 if(objective){
  const action={
   'Ring the bells of ':'Tocá las campanas de ',
   'Ride the strings to ':'Viajá por los hilos de luz hasta ',
   'Follow the path to ':'Seguí el camino hacia ',
   'Break the silence at ':'Rompé el silencio en ',
   'Tune the spire at ':'Afiná la aguja en '
  }[objective[1]];
  return (m?.[1]??'')+action+translateHighfly(objective[2])+(m?.[3]??'');
 }

 for(const [re,replacement] of PATTERNS)if(re.test(core))return (m?.[1]??'')+
   core.replace(re,replacement)+(m?.[3]??'');
 return text;
}
export function installSpanishLocalization(doc=globalThis.document,search=''){
 if(!doc?.body||typeof globalThis.MutationObserver!=='function')return {enabled:false,missing:[]};
 const audit=new URLSearchParams(search).has('hfi18nqa'),missing=new Set();
 const translateNode=node=>{
  if(node?.nodeType!==3||!node.nodeValue?.trim())return;
  const parent=node.parentElement;
  if(!parent||/^(SCRIPT|STYLE|CODE|TEXTAREA)$/i.test(parent.tagName))return;
  if(parent.closest?.('[data-hf-no-translate]'))return;
  const before=node.nodeValue,after=translateHighfly(before);
  if(after!==before)node.nodeValue=after;
  else if(audit&&/[a-z]{4,}(\s+[a-z]{3,}){2,}/i.test(before)&&missing.size<300)missing.add(before.trim());
 };
 const scan=root=>{
  if(!root)return;
  if(root.nodeType===3){translateNode(root);return;}
  const walker=doc.createTreeWalker(root,globalThis.NodeFilter?.SHOW_TEXT??4);
  while(walker.nextNode())translateNode(walker.currentNode);
 };
 scan(doc.body);
 const observer=new globalThis.MutationObserver(records=>{
  for(const rec of records){
   if(rec.type==='characterData')translateNode(rec.target);
   else for(const n of rec.addedNodes)scan(n);
  }
 });
 observer.observe(doc.body,{childList:true,characterData:true,subtree:true});
 return {enabled:true,missing,observer,translate:translateHighfly};
}
