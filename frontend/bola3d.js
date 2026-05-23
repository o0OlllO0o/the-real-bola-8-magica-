import * as THREE from 'three';

const canvas = document.getElementById('bola3d');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth/canvas.clientHeight, 0.1, 100);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// Iluminación
scene.add(new THREE.DirectionalLight(0xffffff, 3)).position.set(5, 3, 5);
scene.add(new THREE.DirectionalLight(0x4488ff, 1.5)).position.set(-3, 1, -2);
scene.add(new THREE.AmbientLight(0x222244));

// Textura del 8
const texCanvas = document.createElement('canvas');
texCanvas.width = 512; texCanvas.height = 512;
const ctx = texCanvas.getContext('2d');
ctx.beginPath(); ctx.arc(256, 256, 200, 0, Math.PI*2); ctx.fillStyle = '#ffffff'; ctx.fill();
ctx.beginPath(); ctx.arc(256, 256, 200, 0, Math.PI*2); ctx.strokeStyle = '#cccccc'; ctx.lineWidth = 6; ctx.stroke();
ctx.fillStyle = '#111111'; ctx.font = 'bold 260px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('8', 256, 260);

const textura = new THREE.CanvasTexture(texCanvas);
textura.colorSpace = THREE.SRGBColorSpace;

// Bola
const bola = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 128, 128),
    new THREE.MeshPhysicalMaterial({
        map: textura,
        metalness: 0.1,
        roughness: 0.4,
        clearcoat: 0.3,
        clearcoatRoughness: 0.2,
        reflectivity: 0.5
    })
);
scene.add(bola);

let girada = false;
function animar() { requestAnimationFrame(animar); renderer.render(scene, camera); }
animar();

canvas.addEventListener('click', (e) => {
    if (e.target.closest('.panel-flotante')) return;
    if (typeof toggleBola === 'function') toggleBola();
    girada = !girada;
    const target = girada ? Math.PI : 0;
    const start = bola.rotation.y, startTime = Date.now();
    function step() {
        const p = Math.min((Date.now()-startTime)/800, 1);
        bola.rotation.y = start + (target-start)*(1-Math.pow(1-p,3));
        if (p<1) requestAnimationFrame(step);
    }
    step();
});
canvas.style.pointerEvents = 'auto';

window.addEventListener('resize', () => {
    camera.aspect = canvas.clientWidth/canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
});

window.shakeBola3D = function() {
    const ox = bola.rotation.x, oy = bola.rotation.y;
    let frames = 0;
    const iv = setInterval(() => {
        bola.rotation.x = ox + (Math.random()-0.5)*0.15;
        bola.rotation.y = oy + (Math.random()-0.5)*0.15;
        if (++frames >= 25) { clearInterval(iv); bola.rotation.x = ox; bola.rotation.y = oy; }
    }, 16);
};
