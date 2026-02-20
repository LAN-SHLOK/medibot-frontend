import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// --- 3D DNA SETUP ---
const container = document.getElementById('dna-container');

if(container) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const dnaGroup = new THREE.Group();
    const particleCount = 40; 
    const radius = 3;
    const height = 15;
    const blueMat = new THREE.MeshBasicMaterial({ color: 0x2563eb });
    const pinkMat = new THREE.MeshBasicMaterial({ color: 0xdb2777 });
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });

    for (let i = 0; i < particleCount; i++) {
        const t = i / particleCount;
        const angle = t * Math.PI * 4; 
        const y = (t - 0.5) * height;
        const x1 = Math.cos(angle) * radius; const z1 = Math.sin(angle) * radius;
        const x2 = Math.cos(angle + Math.PI) * radius; const z2 = Math.sin(angle + Math.PI) * radius;

        const p1 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), blueMat);
        const p2 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), pinkMat);
        p1.position.set(x1, y, z1); p2.position.set(x2, y, z2);
        dnaGroup.add(p1); dnaGroup.add(p2);

        const points = [new THREE.Vector3(x1, y, z1), new THREE.Vector3(x2, y, z2)];
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMat);
        dnaGroup.add(line);
    }
    dnaGroup.rotation.z = Math.PI / 6; 
    scene.add(dnaGroup);

    function animateDNA() {
        requestAnimationFrame(animateDNA);
        dnaGroup.rotation.y += 0.01;
        renderer.render(scene, camera);
    }
    animateDNA();
}