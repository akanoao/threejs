import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

// === GSAP & ScrollTrigger Setup ===
// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// --- Global Variables (for Three.js) ---
let camera,
    scene,
    renderer,
    carModel, // Loaded GLTF model
    lights, // Object containing scene lights
    ground;

// Text content for each section's highlight feature (for later steps)

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    setupNavDots();
    carStats();
    setupSnapScrolling();
    animateIntro();
    setupSectionTextAnimations();
    initThreeJS();
    document.getElementById("black-model").addEventListener("click", () => {
        loadCarModel("blackcar.glb"); // Path to your new model
    });
    document.getElementById("white-model").addEventListener("click", () => {
        loadCarModel("whitecar.glb"); // Path to your new model
    });
    document.getElementById("red-model").addEventListener("click", () => {
        loadCarModel("sussycarred.glb"); // Path to your new model
    });

    // Optional: Fade video slightly on deep scroll for effect (can be added later)
    ScrollTrigger.create({
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: 0.5,
        onUpdate: (self) => {
            gsap.to(".video-container", {
                opacity: 1 - self.progress * 0.7, // Fade to 60% opacity
                ease: "none",
                overwrite: "auto",
            });
        },
    });

    // Add resize listener for Three.js
    window.addEventListener("resize", onWindowResize);

    // Start the animation loop
    animate();
});

// --- GSAP Animation Setup Functions ---

function carStats() {
    const counters = document.querySelectorAll(".counter");

    const animateCounter = (counter) => {
        const target = +counter.getAttribute("data-target");
        const isFloat = counter.getAttribute("data-target").includes(".");
        const increment = target / 30; // control speed here
        let current = 0;

        const updateCounter = () => {
            if (current < target) {
                current += increment;
                counter.innerText = isFloat
                    ? current.toFixed(1)
                    : Math.ceil(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.innerText = isFloat ? target.toFixed(1) : target;
            }
        };

        updateCounter();
    };

    const observer = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    animateCounter(counter);
                    observer.unobserve(counter); // animate once
                }
            });
        },
        { threshold: 0.5 }
    );

    counters.forEach((counter) => {
        observer.observe(counter);
    });
}

function setupSnapScrolling() {
    const panels = gsap.utils.toArray(".panel"); // Get all panels including #zero
    const numPanels = panels.length;

    ScrollTrigger.create({
        trigger: "body", // Trigger on the body for overall page scroll
        start: "top top", // Start the snapping effect from the top of the page
        end: "bottom bottom", // End the snapping effect at the bottom of the page
        // markers: true, // Uncomment for debugging
        snap: {
            // Snap to equally spaced points based on the number of panels
            snapTo: [0, 0.2, 0.4, 0.6, 0.8, 1], // Explicit snap points for 6 panels (0, 0.2, 0.4, 0.6, 0.8, 1)
            duration: 2, // Smoothness of the snap
            ease: "power2.inOut", // Easing for the snap animation
        },
        delay: 0.01, // Delay for smoother snapping
        // Optional: Add a small tolerance to make snapping less aggressive
        // tolerance: 0.1,
    });
}

/**
 * Sets up click events for navigation dots and updates active dot based on scroll.
 */
function setupNavDots() {
    const navDots = document.querySelectorAll(".nav-dot");
    const sections = document.querySelectorAll(".panel"); // Get all panels

    // Create ScrollTriggers for each section to update the active dot
    sections.forEach((section, index) => {
        ScrollTrigger.create({
            trigger: section,
            start: "top center+=10%", // Trigger slightly past the center when scrolling down
            end: "bottom center-=10%", // End trigger slightly before center when scrolling down
            // markers: true, // Uncomment for debugging dot triggers
            onEnter: () => setActiveDot(section.id), // Update dot when entering section view
            onEnterBack: () => setActiveDot(section.id), // Update dot when scrolling back into section view
        });
    });

    // Add click event to navigation dots for smooth scrolling
    navDots.forEach((dot) => {
        dot.addEventListener("click", () => {
            const targetSectionId = dot.getAttribute("data-section");
            const targetSection = document.getElementById(targetSectionId);
            if (targetSection) {
                // Use GSAP's ScrollToPlugin for smooth scrolling
                gsap.to(window, {
                    scrollTo: {
                        y: targetSection, // Target element to scroll to
                        offsetY: 1, // Small offset to ensure trigger fires correctly
                    },
                    duration: 1.2, // Duration of the scroll animation
                    ease: "power2.inOut", // Easing function
                });
            }
        });
    });
}

/**
 * Updates the visual state of navigation dots.
 * @param {string} sectionId - The ID of the currently active section.
 */
function setActiveDot(sectionId) {
    document.querySelectorAll(".nav-dot").forEach((dot) => {
        if (dot.getAttribute("data-section") === sectionId) {
            dot.classList.add("active");
        } else {
            dot.classList.remove("active");
        }
    });
}

/**
 * Creates the initial fade-in/pop-in animation for static UI elements.
 */
function animateIntro() {
    const tl = gsap.timeline({ delay: 0.5 }); // Add a small delay for smoother start

    // Animate logo fade-in from top
    tl.from(".logo", {
        y: -50,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
    });

    // Animate navigation dots scaling in with a stagger effect
    tl.from(
        ".nav-dots", // Corrected target to individual dots
        {
            scale: 0,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1, // Animate dots one after another
            ease: "back.out(1.7)", // Add a slight overshoot effect
        },
        "-=0.5" // Overlap start slightly with logo animation
    );
}

/**
 * Sets up scroll-triggered animations for text elements within each content panel.
 */
function setupSectionTextAnimations() {
    // Select all panels except the initial empty one (#zero)
    document.querySelectorAll(".panel:not(#zero)").forEach((section) => {
        // Find elements within the section to animate
        const elementsToAnimate = section.querySelectorAll(
            "h1, h2, .highlight-text"
        );
        const accentBox = section.querySelector(".accent-box");
        const sectionNumber = section.querySelector(".section-number");
        const targetAccentWidth = section.id === "one" ? "40vw" : "30vw";

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: "top center+=20%",
                toggleActions: "play none none reverse",
                // markers: true,
            },
        });

        tl.from(elementsToAnimate, {
            y: 50,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out",
            stagger: 0.15,
        });

        if (accentBox) {
            tl.fromTo(
                accentBox,
                { width: 0 },
                {
                    width: targetAccentWidth,
                    duration: 1,
                    ease: "power3.inOut",
                },
                "-=0.5"
            );
        }

        if (sectionNumber) {
            gsap.fromTo(
                sectionNumber,
                { opacity: 0, y: -20 },
                {
                    opacity: 0.6,
                    y: 0,
                    duration: 0.8,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: section,
                        start: "top center+=20%",
                        toggleActions: "play none none reverse",
                    },
                }
            );
        }
    });
}

// --- Three.js Setup Functions ---

function loadCarModel(path) {
    const loader = new GLTFLoader();
    loader.load(
        path,
        (gltf) => {
            console.log("GLTF model loaded successfully.");
            if (carModel) {
                scene.remove(carModel);
                carModel.traverse((child) => {
                    if (child.isMesh) {
                        child.geometry.dispose();
                        if (child.material.map) child.material.map.dispose();
                        child.material.dispose();
                    }
                });
            }
            carModel = gltf.scene;
            carModel.rotation.set(0, -Math.PI / 2, 0);
            carModel.position.set(9, -1, 0);
            carModel.scale.set(1.2, 1.2, 1.2);

            carModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material) {
                        child.material.envMapIntensity = 1;
                        if (child.material.metalness !== undefined) {
                            child.material.metalness = Math.max(
                                child.material.metalness,
                                0.5
                            );
                        }
                        if (child.material.roughness !== undefined) {
                            child.material.roughness = Math.max(
                                child.material.roughness,
                                0.1
                            );
                        }
                        child.material.needsUpdate = true;
                    }
                }
            });

            scene.add(carModel);
            setupScrollAnimations();
            animate();
        },
        undefined, // Progress callback removed for brevity
        (error) => {
            console.error("Error loading GLTF model:", error);
            appContainer.innerHTML = `<p style="color: red; text-align: center; padding-top: 20vh;">Failed to load 3D model. Check file path and console.</p>`;
        }
    );
}

function initThreeJS() {
    const appContainer = document.querySelector("#app");
    if (!appContainer) {
        console.error("Three.js container #app not found.");
        return;
    }

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    appContainer.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(
        40,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0.5, 6);

    scene = new THREE.Scene();
    scene.background = null;

    new RGBELoader().setPath("./hdr/").load(
        "modern_buildings_4k.hdr",
        (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = texture;
            scene.environmentIntensity = 0.3;
            console.log("HDR Environment map loaded successfully.");
        },
        undefined,
        (error) => {
            console.error("Error loading HDR environment map:", error);
            if (!lights) {
                lights = createLighting();
                console.log("Created fallback lighting.");
            }
        }
    );

    lights = createLighting();

    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.4 });
    ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1;
    ground.receiveShadow = true;
    scene.add(ground);

    // Load the car model
    loadCarModel("sussycarred.glb");
    window.addEventListener("resize", onWindowResize);
}
/**
 * Creates and configures the lights for the scene.
 * (Basic lighting, will be less important once environment map is loaded)
 */
const createLighting = () => {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 2.5);
    mainLight.position.set(5, 10, 7);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -15;
    mainLight.shadow.camera.right = 15;
    mainLight.shadow.camera.top = 15;
    mainLight.shadow.camera.bottom = -15;
    mainLight.shadow.bias = -0.001;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xabcdef, 0.6);
    fillLight.position.set(-5, 5, -5);
    fillLight.castShadow = false;
    scene.add(fillLight);

    return { mainLight, fillLight, ambientLight };
};

/**
 * Handles window resize events.
 */
function onWindowResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

/**
 * The main animation loop.
 */
function animate() {
    requestAnimationFrame(animate); // Request the next frame
    if (!isDragging && inertia) {
        velocityX *= 0;
        velocityY *= 0.95;
    }

    rotationY += velocityY * 0.1;
    rotationX += velocityX;

    // Clamp X rotation (top/bottom view)
    rotationX = Math.max(minXRotation, Math.min(maxXRotation, rotationX));
    if (!isAnimating) {
        carModel.rotation.y = rotationY;
        carModel.rotation.x = rotationX;
        rotationY += 0.001; // Example rotation animation
    }
    // carModel.rotation.y += 0.005; // Example rotation animation
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
    console.log(isAnimating);
}

let isDragging = false;
let isAnimating = true;
let lastX = 0;
let lastY = 0;
let velocityX = 0;
let velocityY = 0;
let inertia = true;

let rotationX = 0;
let rotationY = 0;

const minXRotation = 0; // look down
const maxXRotation = 0; // look up
function onMouseDown(e) {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    velocityX = 0;
    velocityY = 0;
}

function onMouseMove(e) {
    if (!isDragging) return;

    const deltaX = e.clientX - lastX;
    const deltaY = e.clientY - lastY;

    lastX = e.clientX;
    lastY = e.clientY;

    velocityY = deltaX * 0.005; // Horizontal drag
    velocityX = deltaY * 0.005; // Vertical drag
}

function onMouseUp() {
    isDragging = false;
}
function enableCustomControls() {
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    window.addEventListener("touchstart", (e) => onMouseDown(e.touches[0]));
    window.addEventListener("touchmove", (e) => onMouseMove(e.touches[0]));
    window.addEventListener("touchend", onMouseUp);
}

function disableCustomControls() {
    window.removeEventListener("mousedown", onMouseDown);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);

    window.removeEventListener("touchstart", (e) => onMouseDown(e.touches[0]));
    window.removeEventListener("touchmove", (e) => onMouseMove(e.touches[0]));
    window.removeEventListener("touchend", onMouseUp);
}

function setupScrollAnimations() {
    if (!carModel) {
        console.warn("setupScrollAnimations called before carModel loaded.");
        return;
    }
    console.log("Setting up scroll animations...");

    // Section One Animation (Intro)
    ScrollTrigger.create({
        trigger: "#one",
        start: "top top+=1%", // Start animation slightly before section fully enters
        end: "bottom bottom", // End animation slightly after section fully leaves
        // markers: true, // Debugging
        onEnter: () => {
            // Entering Section One (from Zero or Two)
            gsap.to(carModel.position, {
                duration: 2.5,
                x: 0,
                y: -1,
                z: 0,
                ease: "power3.out",
                overwrite: "auto",
            }); // Slide in
            gsap.to(carModel.rotation, {
                duration: 1.5,
                x: 0,
                y: -Math.PI / 2,
                z: 0,
                ease: "power2.out",
                overwrite: "auto",
            });
            document.querySelector(".logo").style.color = "#000";
        },
        onLeaveBack: () => {
            const leaveBackTween = gsap.to(carModel.position, {
                duration: 1.5,
                x: -9,
                y: -1,
                z: 0,
                ease: "power2",
                overwrite: "auto",
            });
            // When that tween completes, run the reset to x=9
            leaveBackTween.then(() => {
                carModel.position.set(9, -1, 0); // Reset position when scrolling back to #zero
            });
            document.querySelector(".logo").style.color = "#fff";
        },
    });

    ScrollTrigger.create({
        trigger: "#two",
        start: "top top+=33%", // Start animation slightly before section fully enters
        end: "bottom center",
        onEnter: () => {
            gsap.to(carModel.position, {
                duration: 1.5,
                x: 2,
                y: -0.5,
                z: 0,
                ease: "power2.inOut",
                overwrite: "auto",
            }); // Slide out
            gsap.to(carModel.rotation, {
                duration: 1.5,
                x: 0,
                y: -Math.PI / 4,
                z: 0,
                ease: "power2.inOut",
                overwrite: "auto",
            });
            gsap.to(ground.position, {
                duration: 1.5,
                y: -0.5,
                ease: "power2.inOut",
                overwrite: "auto",
            });
        },
        onLeaveBack: () => {
            gsap.to(camera.position, {
                duration: 1.5,
                x: 0,
                y: 0.5,
                z: 6,
                ease: "power2.out",
                overwrite: "auto",
            });
            gsap.to(carModel.position, {
                duration: 1.5,
                x: 0,
                y: -1,
                z: 0,
                ease: "power2.out",
                overwrite: "auto",
            });
            gsap.to(carModel.rotation, {
                duration: 1.5,
                x: 0,
                y: -Math.PI / 2,
                z: 0,
                ease: "power2.out",
                overwrite: "auto",
            });
            gsap.to(ground.position, {
                duration: 1.5,
                y: -1,
                ease: "power2.out",
                overwrite: "auto",
            });
        },
    });
    ScrollTrigger.create({
        trigger: "#three",
        start: "top center", // Start animation slightly before section fully enters
        end: "bottom top",
        onEnter: () => {
            gsap.to("#app", {
                y: "-40%", // Moves it upward by 50% of its height
                duration: 1, // seconds
                ease: "power2.out",
            });
            gsap.to(carModel.position, {
                duration: 1.5,
                x: 0,
                y: -0.5,
                z: -13,
                ease: "power2.inOut",
                overwrite: "auto",
            });
            gsap.to(carModel.rotation, {
                duration: 1.5,
                x: 0,
                y: 0,
                z: 0,
                ease: "power2.inOut",
                overwrite: "auto",
            });
        },
        onLeaveBack: () => {
            gsap.to("#app", {
                y: "0%", // Moves it upward by 50% of its height
                duration: 1, // seconds
                ease: "power2.out",
            });

            gsap.to(carModel.position, {
                duration: 1.5,
                x: 2,
                y: -0.5,
                z: 0,
                ease: "power2.inOut",
                overwrite: "auto",
            }); // Slide out
            gsap.to(carModel.rotation, {
                duration: 1.5,
                x: 0,
                y: -Math.PI / 4,
                z: 0,
                ease: "power2.inOut",
                overwrite: "auto",
            });
            gsap.to(ground.position, {
                duration: 1.5,
                y: -0.5,
                ease: "power2.inOut",
                overwrite: "auto",
            });
        },
    });
    ScrollTrigger.create({
        trigger: "#four",
        start: "top center",
        end: "bottom top",

        onEnter: () => {
            isAnimating = true;
            disableCustomControls(); // Temporarily pause drag influence

            gsap.to(camera.position, {
                duration: 1.5,
                x: 0,
                y: 1,
                z: 6,
                ease: "power2.out",
                overwrite: "auto",
            });

            gsap.to("#app", {
                y: "0%",
                pointerEvents: "all",
                duration: 1,
                ease: "power2.out",
            });

            gsap.to(carModel.position, {
                duration: 1.5,
                x: 0,
                y: -0.5,
                z: -1,
                ease: "power2.inOut",
                overwrite: "auto",
            });

            gsap.to(carModel.rotation, {
                duration: 1.5,
                x: 0,
                y: -Math.PI / 4,
                z: 0,
                ease: "power2.inOut",
                overwrite: "auto",
                onUpdate: () => {
                    rotationX = carModel.rotation.x;
                    rotationY = carModel.rotation.y;
                },
                onComplete: () => {
                    isAnimating = false;
                    enableCustomControls(); // Resume drag after animation
                },
            });
            document.querySelector(".logo").style.color = "#fff";
        },

        onLeaveBack: () => {
            isAnimating = true;
            disableCustomControls();

            gsap.to(camera.position, {
                duration: 1.5,
                x: 0,
                y: 0.5,
                z: 6,
                ease: "power2.out",
                overwrite: "auto",
            });

            gsap.to("#app", {
                y: "-40%",
                pointerEvents: "none",
                duration: 1,
                ease: "power2.out",
            });

            gsap.to(carModel.position, {
                duration: 1.5,
                x: 0,
                y: -0.5,
                z: -13,
                ease: "power2.inOut",
                overwrite: "auto",
            });

            gsap.to(carModel.rotation, {
                duration: 1.5,
                x: 0,
                y: 0,
                z: 0,
                ease: "power2.inOut",
                overwrite: "auto",
                onUpdate: () => {
                    rotationX = carModel.rotation.x;
                    rotationY = carModel.rotation.y;
                },
                onComplete: () => {
                    disableCustomControls();
                },
            });
            document.querySelector(".logo").style.color = "#000";
        },
    });
    ScrollTrigger.create({
        trigger: "#five",
        start: "top center",
        end: "bottom top",
        onEnter: () => {
            isAnimating = true;
            disableCustomControls();
            gsap.to("#app", {
                x: "27%",
                y: "-18%",
                pointerEvents: "none",
                duration: 1,
                ease: "power2.out",
            });
            gsap.to(carModel.position, {
                duration: 1.5,
                x: 0,
                y: -0.5,
                z: -1,
                ease: "power2.inOut",
                overwrite: "auto",
            });
            gsap.to(carModel.rotation, {
                duration: 1.5,
                x: 0,
                y: -Math.PI,
                z: 0,
                ease: "power2.inOut",
                overwrite: "auto",
                onComplete: () => {
                    disableCustomControls();
                },
            });
        },
        onLeaveBack: () => {
            isAnimating = true;
            disableCustomControls(); // Temporarily pause drag influence

            gsap.to(camera.position, {
                duration: 1.5,
                x: 0,
                y: 1,
                z: 6,
                ease: "power2.out",
                overwrite: "auto",
            });

            gsap.to("#app", {
                x: "0%",
                y: "0%",
                pointerEvents: "all",
                duration: 1,
                ease: "power2.out",
            });

            gsap.to(carModel.position, {
                duration: 1.5,
                x: 0,
                y: -0.5,
                z: -1,
                ease: "power2.inOut",
                overwrite: "auto",
            });

            gsap.to(carModel.rotation, {
                duration: 1.5,
                x: 0,
                y: -Math.PI / 4,
                z: 0,
                ease: "power2.inOut",
                overwrite: "auto",
                onUpdate: () => {
                    rotationX = carModel.rotation.x;
                    rotationY = carModel.rotation.y;
                },
                onComplete: () => {
                    isAnimating = false;
                    enableCustomControls(); // Resume drag after animation
                },
            });
        },
    });

    console.log("Scroll animations setup complete.");
}
