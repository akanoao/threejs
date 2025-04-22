import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { gsap } from "gsap/gsap-core";

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.outputEncoding = THREE.sRGBEncoding;
document.querySelector("#app").appendChild(renderer.domElement);

// Camera
const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 0, 5.3);

// Scene
const scene = new THREE.Scene();
// backgroung transparent
scene.background = null;

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Environment Map (HDR)
new RGBELoader()
    .setPath("./")
    .load("hdr/modern_buildings_4k.hdr", function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
        // scene.background = texture; // Optional: Use as background
    });

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const backLight = new THREE.SpotLight(0xffffff, 100, 20, 0.5, 1, 2);
backLight.position.set(0, 0, 4);
backLight.castShadow = true;
scene.add(backLight);

// Load Model
const loader = new GLTFLoader();
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
let carModel = null;
loader.load("porsche_gt3_rs.glb", (gltf) => {
    carModel = gltf.scene;
    gltf.scene.rotation.set(0, Math.PI / 2, Math.PI / 2);
    gltf.scene.position.set(-8, 0, 0);
    scene.add(gltf.scene);
});

scene.environmentIntensity = 0.5;

const minX = -8;
const maxX = 8;
let scrollProgress = 0;
let currentSection = null;
let previousSection = null;

// Listen for scroll events and update scrollProgress
window.addEventListener("scroll", () => {
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    scrollProgress = window.scrollY / 368;
    scrollProgress = Math.max(0, Math.min(1, scrollProgress));

    if (carModel && !currentSection) {
        carModel.position.x = minX + (maxX - minX) * scrollProgress;
    }

    if (carModel) {
        const sections = document.querySelectorAll(".paralax");
        let foundSection = null;
        sections.forEach((section) => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= window.innerHeight / 3) {
                foundSection = section.id;
            }
        });

        // Section changed: Entering a section
        if (foundSection && currentSection !== foundSection) {
            currentSection = foundSection;
            gsap.to(carModel.position, {
                duration: 1,
                x: 0,
                y: 0,
                z: -1,
                ease: "power1.out",
            });
            gsap.to(carModel.rotation, {
                duration: 1,
                x: Math.PI / 2,
                y: -Math.PI / 2,
                z: Math.PI / 2,
            });
        }
        // Section changed: Leaving all sections (scrolling up)
        else if (!foundSection && currentSection) {
            currentSection = null;
            carModel.position.x = maxX;
            carModel.position.y = 0;
            carModel.position.z = 0;
            carModel.rotation.x = 0;
            carModel.rotation.y = Math.PI / 2;
            carModel.rotation.z = Math.PI / 2;
        }
    }
});

window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
// Handle Window Resize
animate();
