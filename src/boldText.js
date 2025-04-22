import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.z = 50;

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0); // transparent background
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(renderer.domElement);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 10);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.3));

let targetZ = 50;
let cube;

// Load font and create text
const loader = new FontLoader();
loader.load(
    "https://threejs.org/examples/fonts/helvetiker_bold.typeface.json",
    function (font) {
        const textGeometry = new TextGeometry("WELCOME", {
            font: font,
            size: 10,
            height: 2,
            bevelEnabled: true,
            bevelThickness: 1,
            bevelSize: 0.5,
            bevelSegments: 5,
        });

        const textMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
        });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textGeometry.center();
        scene.add(textMesh);
    }
);

// White cube behind the text
cube = new THREE.Mesh(
    new THREE.BoxGeometry(10, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
);
cube.position.z = -50;
scene.add(cube);

// Zoom on scroll (no page scroll)
window.addEventListener("wheel", (event) => {
    const delta = event.deltaY * 0.05;
    targetZ += delta;
    targetZ = Math.max(-30, Math.min(70, targetZ));
});

// Handle resize
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animate
function animate() {
    requestAnimationFrame(animate);

    camera.position.z += (targetZ - camera.position.z) * 0.1;

    if (cube) {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
    }

    renderer.render(scene, camera);
}

animate();
