// ============================================================
// BOLA 8 MÁGICA 3D - Three.js
// ============================================================
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

let scene, camera, renderer, bola, numero8, panel;
let girada = false;
let shaking = false;

// Detectar si es portátil
function esPortatil() {
    const ua = navigator.userAgent;
    if (/Mobi|Android|iPhone|iPad/i.test(ua)) return true;
    // Detectar portátil por batería
    if ('getBattery' in navigator) {
        navigator.getBattery().then(b => {
            window._esPortatil = b.charging === false || b.dischargingTime < Infinity;
        });
    }
    return window._esPortatil || false;
}

function iniciarBola3D() {
    const container = document.getElementById('scene');
    if (!container) return;

    // Escena
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.z = 5;

    // Renderer
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Luz
    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(2, 2, 5);
    scene.add(light);
    const ambient = new THREE.AmbientLight(0x444444);
    scene.add(ambient);

    // Bola negra
    const geometria = new THREE.SphereGeometry(1.2, 64, 64);
    const material = new THREE.MeshPhongMaterial({
        color: 0x111111,
        specular: 0x333333,
        shininess: 80,
        reflectivity: 0.5
    });
    bola = new THREE.Mesh(geometria, material);
    scene.add(bola);

    // Número 8 (texto)
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 160px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('8', 128, 128);

    const textura = new THREE.CanvasTexture(canvas);
    const material8 = new THREE.MeshBasicMaterial({
        map: textura,
        transparent: true,
        depthTest: false,
        depthWrite: false
    });
    numero8 = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material8);
    numero8.position.z = 1.21;
    bola.add(numero8);

    // Panel trasero
    const panelGeo = new THREE.PlaneGeometry(1.8, 1);
    const panelMat = new THREE.MeshBasicMaterial({
        color: 0x111122,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
    });
    panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.z = -1.3;
    panel.visible = false;
    bola.add(panel);

    // Animación
    function animar() {
        requestAnimationFrame(animar);
        if (shaking) {
            bola.rotation.x += (Math.random() - 0.5) * 0.1;
            bola.rotation.y += (Math.random() - 0.5) * 0.1;
        }
        renderer.render(scene, camera);
    }
    animar();

    // Click para girar
    renderer.domElement.addEventListener('click', (e) => {
        if (e.target.closest('.panel-flotante') || e.target.closest('.icono-accion')) return;
        toggleBola();
    });

    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

function toggleBola() {
    if (shaking) return;
    const target = girada ? 0 : Math.PI;
    animateRotation(target);
    girada = !girada;
    document.getElementById('panelFlotante').classList.toggle('visible', girada);
}

function animateRotation(target) {
    const start = bola.rotation.y;
    const duration = 800;
    const startTime = Date.now();

    function step() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out
        bola.rotation.y = start + (target - start) * eased;
        if (progress < 1) requestAnimationFrame(step);
    }
    step();
}

function shakeBola() {
    if (shaking) return;
    shaking = true;
    const originalX = bola.rotation.x;
    const originalY = bola.rotation.y;

    let frames = 0;
    const maxFrames = 30;
    const interval = setInterval(() => {
        bola.rotation.x = originalX + (Math.random() - 0.5) * 0.15;
        bola.rotation.y = originalY + (Math.random() - 0.5) * 0.15;
        frames++;
        if (frames >= maxFrames) {
            clearInterval(interval);
            bola.rotation.x = originalX;
            bola.rotation.y = originalY;
            shaking = false;
        }
    }, 16);
}

function iniciarDeteccionMovimiento() {
    if (window.DeviceMotionEvent && esPortatil()) {
        let ultimoAgite = 0, ultimaX = 0, ultimaY = 0, ultimaZ = 0;
        window.addEventListener('devicemotion', (e) => {
            const ahora = Date.now();
            if (ahora - ultimoAgite < 800) return;
            const acc = e.accelerationIncludingGravity;
            if (!acc) return;
            const f = Math.abs((acc.x || 0) - ultimaX) + Math.abs((acc.y || 0) - ultimaY) + Math.abs((acc.z || 0) - ultimaZ);
            if (f > 25) {
                ultimoAgite = ahora;
                shakeBola();
                setTimeout(() => procesarPregunta('', true), 600);
            }
            ultimaX = acc.x || 0;
            ultimaY = acc.y || 0;
            ultimaZ = acc.z || 0;
        });
    }
}

// Exponer funciones globales
window.shakeBola = shakeBola;
window.iniciarBola3D = iniciarBola3D;
window.iniciarDeteccionMovimiento = iniciarDeteccionMovimiento;

// Auto-iniciar
document.addEventListener('DOMContentLoaded', iniciarBola3D);
