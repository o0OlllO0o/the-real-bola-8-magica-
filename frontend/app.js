// ============================================================
// BOLA 8 MÁGICA - Sistema de 3 archivos
// ============================================================
let todasLasCitas=[],citasTags={},tagsData={},modoActual='clasico';
let synth=window.speechSynthesis,vocesDisponibles=[],vozActual='auto',vozSeleccionada=null,intentosCarga=0;
let reproduciendoCitas=false,indiceCitaActual=0,todasLasCitasModo=[],timeoutCita=null;
let reconocimiento=null,grabando=false,girada=false,ultimoAgite=0,ultimaX=0,ultimaY=0,ultimaZ=0,ultimaRespuesta='';
let sesionId=localStorage.getItem('bola8_sesion_id');
if(!sesionId){sesionId='sesion_'+Date.now()+'_'+Math.random().toString(36).substr(2,8);localStorage.setItem('bola8_sesion_id',sesionId);}
let historial=JSON.parse(localStorage.getItem('bola8_historial_'+sesionId))||[];
let frasesUsadas=new Set(historial.map(function(h){return h.respuesta;}));
let contadorCategorias=JSON.parse(localStorage.getItem('bola8_categorias_'+sesionId))||{};
const respuestasSurrealistas=['Los pingüinos usan esmoquin porque es el único traje que no les queda grande.','Si un libro te aburre, cámbiale el final.','El tiempo vuela. Tú eres el piloto.'];
const placeholders=['ESCRIBE TU PREGUNTA...','QUE TE GUSTARIA SABER?','PREGUNTALE A LA BOLA...','EL UNIVERSO TE ESCUCHA...'];

// CARGAR DATOS
async function cargarDatos(){
  try{
    var c=await fetch('citas.json').then(function(r){return r.json();});
    var t=await fetch('tags.json').then(function(r){return r.json();});
    var ct=await fetch('citas_tags.json').then(function(r){return r.json();});
    todasLasCitas=c;tagsData=t;citasTags=ct;
    console.log('Datos cargados:',todasLasCitas.length,'citas');
  }catch(e){console.error(e);}
}

// OBTENER CITAS POR MODO
function obtenerCitasPorModo(modo){
  var tagsModo=tagsData.modos[modo]||[];
  if(tagsModo.length===0)return todasLasCitas;
  return todasLasCitas.filter(function(cita){
    var tc=citasTags[cita.id]||[];
    return tc.some(function(t){return tagsModo.includes(t);});
  });
}

// OBTENER CITA ALEATORIA
function obtenerCitaAleatoria(){
  var citas=obtenerCitasPorModo(modoActual);
  if(citas.length===0)return {c:'Sin citas. - Bola Magica',id:0};
  var disponibles=citas.filter(function(c){return !frasesUsadas.has(c.c);});
  if(disponibles.length===0){frasesUsadas.clear();disponibles=citas;}
  return disponibles[Math.floor(Math.random()*disponibles.length)];
}

// CAMBIAR MODO
function cambiarModo(id){
  modoActual=id;frasesUsadas.clear();historial=[];contadorCategorias={};
  guardarHistorial();actualizarStatsUI();
  document.querySelectorAll('.modo-opcion').forEach(function(e){e.classList.toggle('activo',e.dataset.modo===id);});
  chatTexto.innerText='Modo '+id.charAt(0).toUpperCase()+id.slice(1);
  setTimeout(function(){chatTexto.innerText='';},2000);
  document.getElementById('modoPanel').classList.remove('visible');
}

// HISTORIAL
function guardarHistorial(){
  localStorage.setItem('bola8_historial_'+sesionId,JSON.stringify(historial));
  localStorage.setItem('bola8_categorias_'+sesionId,JSON.stringify(contadorCategorias));
}
function registrarInteraccion(p,c){
  historial.unshift({timestamp:new Date().toISOString(),pregunta:p,respuesta:c});
  if(historial.length>100)historial.pop();
  frasesUsadas.add(c);
  guardarHistorial();actualizarStatsUI();
}
function actualizarStatsUI(){
  document.getElementById('statsResumen').innerHTML='PREGUNTAS: '+historial.length+' | MODO: '+modoActual;
}
function toggleStats(){
  var p=document.getElementById('statsPanel');p.classList.toggle('visible');
  if(p.classList.contains('visible'))actualizarStatsUI();
}

// TOAST
function mostrarToast(m){
  var t=document.getElementById('toast');t.textContent=m;t.classList.add('visible');
  setTimeout(function(){t.classList.remove('visible');},3000);
}

// MOSTRAR RESPUESTA
function mostrarRespuesta(r,p,leer){
  var c=document.getElementById('chatTexto');
  c.classList.add('vapor');setTimeout(function(){c.innerText=r;c.classList.remove('vapor');},300);
  ultimaRespuesta=r;registrarInteraccion(p,r);
  if(leer){setTimeout(function(){hablar(r);if(!reproduciendoCitas)document.getElementById('playIcon').textContent='▶';},500);}
}

// PROCESAR PREGUNTA
function procesarPregunta(texto,leer){
  if(leer===undefined)leer=true;
  if(reproduciendoCitas)pausarReproduccion();
  if(!texto||!texto.trim()){
    var r=respuestasSurrealistas[Math.floor(Math.random()*respuestasSurrealistas.length)];
    if(!girada)girarBola();agitarBola();
    setTimeout(function(){mostrarRespuesta(r,'',leer);},600);return;
  }
  var cita=obtenerCitaAleatoria();
  if(!girada)girarBola();agitarBola();
  setTimeout(function(){mostrarRespuesta(cita.c,texto,leer);},600);
}

// PLAY/PAUSE
function toggleReproduccionCitas(){if(reproduciendoCitas)pausarReproduccion();else iniciarReproduccion();}
function iniciarReproduccion(){
  if(reproduciendoCitas)return;
  reproduciendoCitas=true;document.getElementById('playIcon').textContent='⏸';
  todasLasCitasModo=obtenerCitasPorModo(modoActual);indiceCitaActual=0;reproducirSiguienteCita();
}
function pausarReproduccion(){
  reproduciendoCitas=false;document.getElementById('playIcon').textContent='▶';
  if(synth&&synth.speaking)synth.cancel();if(timeoutCita)clearTimeout(timeoutCita);
}
function reproducirSiguienteCita(){
  if(!reproduciendoCitas)return;
  if(indiceCitaActual>=todasLasCitasModo.length)indiceCitaActual=0;
  var cita=todasLasCitasModo[indiceCitaActual];
  mostrarRespuesta(cita.c,'[auto]',true);indiceCitaActual++;timeoutCita=null;
}

// VOZ
function hablar(texto){
  if(!synth)return;
  if(synth.speaking&&!reproduciendoCitas)synth.cancel();
  if(vocesDisponibles.length===0){vocesDisponibles=synth.getVoices();if(vocesDisponibles.length>0)seleccionarVoz(vozActual);}
  var u=new SpeechSynthesisUtterance(texto);u.lang='es-ES';u.rate=0.9;
  if(vozSeleccionada)u.voice=vozSeleccionada;
  u.onend=function(){if(!reproduciendoCitas)document.getElementById('playIcon').textContent='▶';};
  synth.speak(u);
}
function seleccionarVoz(estilo){
  if(!synth||vocesDisponibles.length===0)return;
  var es=vocesDisponibles.filter(function(v){return v.lang.startsWith('es');});
  if(es.length===0){vozSeleccionada=vocesDisponibles[0];return;}
  vozSeleccionada=es.find(function(v){return v.name.includes('Monica')||v.name.includes('Helena')||v.name.includes('España');})||es[0];
  vozActual=estilo;localStorage.setItem('bola8_voz_estilo',estilo);
}
function cargarVoces(){
  vocesDisponibles=synth.getVoices();
  if(vocesDisponibles.length===0)setTimeout(cargarVoces,500);
  else seleccionarVoz(vozActual);
}

// ANIMACIONES
function agitarBola(){var b=document.getElementById('bola');b.classList.add('shaking');setTimeout(function(){b.classList.remove('shaking');},800);}
function girarBola(){document.getElementById('bola').style.transform='rotateY(180deg)';girada=true;document.getElementById('panelFlotante').classList.add('visible');}
function regresarBola(){document.getElementById('bola').style.transform='rotateY(0deg)';girada=false;document.getElementById('panelFlotante').classList.remove('visible');}
function toggleBola(){
  var msg=document.getElementById('mensajeBienvenida');
  if(msg){msg.classList.remove('visible');msg.style.display='none';}
  if(girada)regresarBola();else girarBola();
}

// MICROFONO
function leerTextoActual(){if(ultimaRespuesta)hablar(ultimaRespuesta);}
function toggleMicrofono(){
  if(grabando){if(reconocimiento)try{reconocimiento.stop();}catch(e){}grabando=false;return;}
  if(!('webkitSpeechRecognition' in window)){chatTexto.innerText='VOZ NO SOPORTADA';return;}
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  reconocimiento=new SR();reconocimiento.lang='es-ES';
  reconocimiento.onstart=function(){grabando=true;chatTexto.innerText='ESCUCHANDO...';};
  reconocimiento.onresult=function(e){var t=e.results[0][0].transcript;chatTexto.innerText=t;procesarPregunta(t,true);};
  reconocimiento.onerror=reconocimiento.onend=function(){grabando=false;};
  reconocimiento.start();
}

// AGITAR MOVIL
function iniciarDeteccionMovimiento(){
  if(window.DeviceMotionEvent)window.addEventListener('devicemotion',function(e){
    var ahora=Date.now();if(ahora-ultimoAgite<800)return;
    var acc=e.accelerationIncludingGravity;if(!acc)return;
    var f=Math.abs((acc.x||0)-ultimaX)+Math.abs((acc.y||0)-ultimaY)+Math.abs((acc.z||0)-ultimaZ);
    if(f>25){ultimoAgite=ahora;procesarPregunta('',true);}
    ultimaX=acc.x||0;ultimaY=acc.y||0;ultimaZ=acc.z||0;
  });
}

// INICIALIZACION
var chatTexto=document.getElementById('chatTexto');
var bola=document.getElementById('bola');
document.getElementById('scene').addEventListener('click',function(e){
  if(e.target.closest('.icono-accion')||e.target.closest('.modo-panel')||e.target.closest('.voz-panel'))return;
  toggleBola();
});
document.getElementById('preguntarBtn').addEventListener('click',toggleReproduccionCitas);
document.getElementById('microBtn').addEventListener('click',toggleMicrofono);
document.getElementById('reproducirBtn').addEventListener('click',function(){if(reproduciendoCitas)pausarReproduccion();leerTextoActual();});
document.getElementById('statsBtn').addEventListener('click',toggleStats);
document.getElementById('statsCerrar').addEventListener('click',toggleStats);
document.getElementById('btnModo').addEventListener('click',function(e){e.stopPropagation();document.getElementById('modoPanel').classList.toggle('visible');});
document.getElementById('btnVoz').addEventListener('click',function(e){e.stopPropagation();document.getElementById('vozPanel').classList.toggle('visible');});
document.querySelectorAll('.modo-opcion').forEach(function(b){b.addEventListener('click',function(){cambiarModo(b.dataset.modo);});});
document.querySelectorAll('.voz-opcion').forEach(function(b){b.addEventListener('click',function(){seleccionarVoz(b.dataset.voz);});});

chatTexto.innerText=placeholders[Math.floor(Math.random()*placeholders.length)];
var msgDiv=document.getElementById('mensajeBienvenida');
if(msgDiv){
  var m='Sobre que deseas hablar hoy? Puedes usar la voz o escribir tu pregunta.'+(/Mobi/i.test(navigator.userAgent)?' Tambien puedes agitar el movil.':'');
  msgDiv.innerText=m;setTimeout(function(){msgDiv.classList.add('visible');},1500);
}

setTimeout(function(){bola.style.transform='rotateY(0deg)';},1000);
if(synth){vozActual=localStorage.getItem('bola8_voz_estilo')||'auto';cargarVoces();synth.onvoiceschanged=cargarVoces;}
cargarDatos();
iniciarDeteccionMovimiento();
