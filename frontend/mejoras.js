// ============================================================
// MEJORAS BOLA 8 MÁGICA - Shake, Play 1-3, Botón iPhone, Voces
// ============================================================

// 1. SHAKE antes de mostrar respuesta
(function() {
    const originalProcesar = window.procesarPregunta;
    if (typeof originalProcesar === 'function') {
        window.procesarPregunta = function(texto, leer) {
            if (typeof reproduciendoCitas !== 'undefined' && reproduciendoCitas) pausarReproduccion();
            if (!texto || !texto.trim()) {
                let r = respuestasSurrealistas[Math.floor(Math.random() * respuestasSurrealistas.length)];
                if (!girada) girarBola();
                agitarBola();
                setTimeout(function() { mostrarRespuesta(r, "[pregunta vacía]", leer); }, 600);
                return;
            }
            let respuesta = obtenerCitaPorContexto(texto);
            if (!girada) girarBola();
            agitarBola();
            setTimeout(function() { mostrarRespuesta(respuesta, texto, leer); }, 600);
        };
    }
})();

// 2. PLAY ALEATORIO 1-3 citas
document.addEventListener('DOMContentLoaded', function() {
    var p = document.getElementById('playBtn');
    if (!p) return;
    var intervalo = null, restantes = 0;

    function parar() {
        clearInterval(intervalo);
        intervalo = null;
        restantes = 0;
        p.textContent = '▶';
        p.classList.remove('playing');
    }

    function iniciar() {
        restantes = Math.floor(Math.random() * 3) + 1;
        p.textContent = '⏸';
        p.classList.add('playing');
        if (typeof hacerPregunta === 'function') hacerPregunta();
        restantes--;
        intervalo = setInterval(function() {
            if (restantes <= 0) { parar(); return; }
            if (typeof hacerPregunta === 'function') hacerPregunta();
            restantes--;
        }, 4000);
    }

    var nuevoBtn = p.cloneNode(true);
    p.parentNode.replaceChild(nuevoBtn, p);
    nuevoBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        intervalo ? parar() : iniciar();
    });
});

// 3. CSS BOTÓN iPHONE
(function() {
    var style = document.createElement('style');
    style.textContent = 'button{-webkit-appearance:none!important;appearance:none!important;background:transparent!important;border:none!important;color:inherit!important;font:inherit!important;cursor:pointer!important;padding:0!important;margin:0!important;outline:none!important;-webkit-tap-highlight-color:transparent!important;}button:focus,button:active{outline:none!important;box-shadow:none!important;}';
    document.head.appendChild(style);
})();

// 4. VOCES ESPAÑOL forzadas
(function() {
    if (!window.speechSynthesis) return;
    
    let vozEspanola = null;
    
    async function forzarVoz() {
        const voces = await new Promise(resolve => {
            const intentar = () => {
                const v = speechSynthesis.getVoices();
                if (v.length > 0) { resolve(v); return; }
                setTimeout(intentar, 300);
            };
            speechSynthesis.onvoiceschanged = () => resolve(speechSynthesis.getVoices());
            intentar();
        });
        
        const nombres = ['Monica', 'Helena', 'Paulina', 'Microsoft Helena', 'Microsoft Laura', 'Google español'];
        for (const nombre of nombres) {
            const voz = voces.find(v => v.name.includes(nombre) && v.lang.includes('es'));
            if (voz) { vozEspanola = voz; return; }
        }
        vozEspanola = voces.find(v => v.lang.startsWith('es')) || voces[0];
    }
    
    const hablarOriginal = window.hablar || function() {};
    window.hablar = async function(texto) {
        speechSynthesis.cancel();
        if (!vozEspanola) await forzarVoz();
        const u = new SpeechSynthesisUtterance(texto);
        u.voice = vozEspanola;
        u.lang = 'es-ES';
        u.rate = 0.95;
        speechSynthesis.speak(u);
    };
    
    forzarVoz();
    setInterval(forzarVoz, 5000);
})();

console.log('✅ Mejoras Bola 8 cargadas: shake, play 1-3, botón iPhone, voces español');
