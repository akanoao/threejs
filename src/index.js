import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { gsap } from "gsap/gsap-core";
import { ScrollTrigger } from "gsap/all";
gsap.registerPlugin(ScrollTrigger);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.outputEncoding = THREE.sRGBEncoding;
document.querySelector("#app").appendChild(renderer.domElement);

// Enable shadow map
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

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
backLight.shadow.mapSize.width = 1024;
backLight.shadow.mapSize.height = 1024;
backLight.shadow.camera.near = 0.5;
backLight.shadow.camera.far = 20;
scene.add(backLight);

// Add a ground plane to catch shadows
const groundGeo = new THREE.PlaneGeometry(200, 200);
const groundMat = new THREE.ShadowMaterial({ opacity: 0.4 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1; // adjust to just below your car
ground.receiveShadow = true;
scene.add(ground);

// Load Model
const loader = new GLTFLoader();
let carModel = null;
loader.load("porsche_gt3_rs.glb", (gltf) => {
    carModel = gltf.scene;
    gltf.scene.rotation.set(0, Math.PI / 2, Math.PI / 2);
    gltf.scene.position.set(-8, 0, 0);

    // Enable casting shadows on all mesh children
    gltf.scene.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = false;
            // optional: child.material.side = THREE.DoubleSide;
        }
    });

    scene.add(gltf.scene);
});

scene.environmentIntensity = 1;

const minX = -8;
const maxX = 8;
let scrollProgress = 0;
let currentSection = null;
let previousSection = null;

let sections = gsap.utils.toArray(".panel");

const vh = [10, 100, 100, 100, 100]; // Heights of each section
const total = vh.reduce((sum, h) => sum + h, 0);

const snapPoints = [];
let accumulated = 0;

vh.forEach((h) => {
    snapPoints.push(accumulated / total);
    accumulated += h;
});

// snapPoints now contains: [0, 0.0244, 0.268, 0.512, 0.756, 1]
snapPoints.push(1); // Ensure final snap at 1 if needed

gsap.to(sections, {
    yPercent: -100 * (sections.length - 1),
    ease: "none",
    scrollTrigger: {
        trigger: ".container",
        pin: true,
        scrub: true,
        delay: 0.05,
        snap: {
            snapTo: 1 / (sections.length - 1),
            duration: { min: 0.3, max: 1 },
            inertia: false,
            ease: "power1.inOut",
        },
        end: () =>
            "+=" + document.querySelector(".container").offsetHeight + "0",
    },
});

window.addEventListener("scroll", () => {
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    scrollProgress = window.scrollY / 368;
    scrollProgress = Math.max(0, Math.min(1, scrollProgress));

    if (carModel && !currentSection) {
        carModel.position.x = minX + (maxX - minX) * scrollProgress;
    }

    if (carModel) {
        console.log(carModel.position);
        const sections = document.querySelectorAll(".scroll-section");
        let foundSection = null;
        sections.forEach((section) => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= window.innerHeight / 3) {
                foundSection = section.id;
                console.log(foundSection);
            }
        });

        // Section changed: Entering a section
        if (foundSection && currentSection !== foundSection) {
            currentSection = foundSection;
            backLight.position.set(0, 10, 0);
            carModel.position.set(8, -1, 1);
            carModel.rotation.set(Math.PI / 2, -Math.PI / 2, Math.PI / 2);
            gsap.to(carModel.position, {
                duration: 1,
                x: 0,
                y: -1,
                z: 1,
                ease: "power1.out",
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
