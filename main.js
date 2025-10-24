import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from 'https://cdn.jsdelivr.net/npm/gsap@3.12.2/+esm';
const MODEL_SCALE = 3.0; // Increased model size for better visibility
// Debug flag
const DEBUG = true;

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);


// Camera setup
const camera = new THREE.PerspectiveCamera(
    30,  // Slightly narrower FOV
    window.innerWidth / window.innerHeight,
    0.5, // Near plane
    1000 // Far plane
);
// Start position - further back (180 degrees from original)
camera.position.set(0, 40, -150);
camera.lookAt(0, 0, 0);

// Renderer setup with better defaults
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
    stencil: false,
    depth: true
});
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add text overlay container
const textOverlay = document.createElement('div');
textOverlay.className = 'text-overlay';
document.body.appendChild(textOverlay);

// Add title text
const titleText = document.createElement('div');
titleText.className = 'title-text';
titleText.innerHTML = "SETH<span style='margin: 0 10px 0 10px'>RICHARDSON</span><span style='margin-left: 0'>DESIGN</span>";
titleText.style.textTransform = 'uppercase'; // Ensure all text is uppercase
titleText.style.whiteSpace = 'nowrap'; // Prevent line breaks
titleText.style.letterSpacing = '1px'; // Adjust letter spacing for better readability
textOverlay.appendChild(titleText);

// Add description text
const descText = document.createElement('div');
descText.className = 'desc-text';
descText.textContent = 'Drag to rotate • Double click to open';
textOverlay.appendChild(descText);

// Enhanced lighting setup
// 1. Main key light (bright, warm)
const keyLight = new THREE.DirectionalLight(0xfff0d0, 1.8);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 50;
keyLight.shadow.bias = -0.001;
keyLight.shadow.normalBias = 0.02; // Reduce shadow acne
scene.add(keyLight);

// 2. Fill light (cool, soft)
const fillLight = new THREE.DirectionalLight(0xd0e8ff, 0.6);
fillLight.castShadow = false;
scene.add(fillLight);

// 3. Rim light (for edge definition)
const rimLight = new THREE.DirectionalLight(0xffffff, 1.2);
rimLight.castShadow = false;
scene.add(rimLight);

// 4. Ambient light (subtle, neutral color)
const ambientLight = new THREE.AmbientLight(0x404056, 0.5);
scene.add(ambientLight);

// 5. Hemisphere light for natural outdoor-like lighting
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

// Enable shadow map on the renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.physicallyCorrectLights = true;

// Add a subtle ground plane for better lighting reference
const groundGeometry = new THREE.PlaneGeometry(20, 20);
const groundMaterial = new THREE.ShadowMaterial({ 
    color: 0x000000,
    opacity: 0.2,
    transparent: true
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -2;
ground.receiveShadow = true;
scene.add(ground);

// Add rotation control variables
let rotationDirection = 1; // 1 for right, -1 for left
let lastDragTime = 0;
let isDragging = false;
let lastAzimuthalAngle = 0;

// OrbitControls setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableZoom = true;
controls.enableRotate = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.8;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.8;
controls.enableDamping = true;
controls.minDistance = 30;    // Allow getting closer
controls.maxDistance = 200;   // Allow zooming out further
controls.target.set(0, 0, 0); // Look at center

// Update controls to apply changes
controls.update();

// Add control event listeners
controls.addEventListener('start', () => {
    isDragging = true;
    lastAzimuthalAngle = controls.getAzimuthalAngle();
});

controls.addEventListener('end', () => {
    isDragging = false;
    const currentAngle = controls.getAzimuthalAngle();
    // Invert the direction calculation for more intuitive control
    rotationDirection = -Math.sign(currentAngle - lastAzimuthalAngle);
    if (rotationDirection === 0) rotationDirection = 1; // Default to right if no movement
    controls.autoRotateSpeed = 2.0 * rotationDirection;
});

// Carousel group
const carousel = new THREE.Object3D();
scene.add(carousel);

// Create objects
const radius = 4; // Distance from center to each model
const objects = [];

// GLTF loader setup
const loader = new GLTFLoader();
const MODEL_PATHS = ['./rockbodytest.glb', './shintest.glb', './kidsynth.glb'];

// Load models and create instances
const loadModels = () => {
    const models = [];
    let loadedCount = 0;
    
    MODEL_PATHS.forEach((path, index) => {
        loader.load(path, (gltf) => {
            models[index] = gltf.scene;
            loadedCount++;
            
            // When all models are loaded, create the carousel
            if (loadedCount === MODEL_PATHS.length) {
                createCarousel(models);
            }
        });
    });
};

// Configuration for each model position
// Each object in this array controls one model instance
// Use simple x,y,z coordinates for positioning
// Rotation values are in radians
const MODEL_POSITIONS = [
    // MODEL 1: Front-center model (rockbodytest.glb)
    {
        name: 'rockbody',
        position: { x: -8, y: 0, z: 0 },  // Move back 4 units
        rotation: { x: -.5, y: 1.9, z: 1.5 },   // Facing forward
        scale: MODEL_SCALE
    },
    // MODEL 2: Right-side model (shintest.glb)
    {
        name: 'shin',
        position: { 
            x: 3,    // Move right 3 units
            y: 1,    // Same height
            z: -7    // Move back 2 units
        },   
        rotation: { x: .50, y: -.45, z: 1 },  // Slight right turn
        scale: MODEL_SCALE
    },
    // MODEL 3: Left-side model (kidsynth.glb)
    {
        name: 'kidsynth',
        position: { 
            x: 7,   // Move left 3 units
            y: 0,    // Same height
            z: 9    // Move back 2 units
        },   
        rotation: { x: 0, y: 3.8, z: 0 },   // Slight left turn
        scale: MODEL_SCALE
    }
];

// Create the carousel with the loaded models
const createCarousel = (modelTemplates) => {
    console.log('Creating carousel with models:', modelTemplates);
    // Clear existing objects
    objects.length = 0;
    
    // Create instances based on MODEL_POSITIONS
    for (let i = 0; i < MODEL_POSITIONS.length; i++) {
        const config = MODEL_POSITIONS[i];
        
        // Create a group to hold the model
        const group = new THREE.Group();
        group.name = `carousel-item-${i}`;
        
        // Store the model name in userData for easier reference
        group.userData.name = config.name;
        
        // Use a different model for each position
        const modelIndex = i % modelTemplates.length;
        const model = modelTemplates[modelIndex].clone();
        model.name = `model-${i}-${modelIndex}`;
        
        // Apply scale from config
        const scale = config.scale || MODEL_SCALE;
        model.scale.set(scale, scale, scale);
        model.userData.originalScale = scale;
        
        // Create a new position object for each model to prevent reference sharing
        const position = {
            x: config.position.x,
            y: config.position.y || 0,
            z: config.position.z
        };
        
        // Create a new rotation object for each model to prevent reference sharing
        const rotation = {
            x: config.rotation?.x || 0,
            y: config.rotation?.y || 0,
            z: config.rotation?.z || 0
        };
        
        // Enable shadows and improve material appearance
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    child.material.roughness = 0.5;
                    child.material.metalness = 0.1;
                    child.material.envMapIntensity = 0.5;
                    child.material.side = THREE.DoubleSide;
                }
            }
        });
        
        group.add(model);
        
        // Apply position, rotation, and scale
        group.position.set(position.x, position.y, position.z);
        group.rotation.set(rotation.x, rotation.y, rotation.z);
        group.scale.set(scale, scale, scale);
        
        // Store the original transform data for reference
        group.userData.originalPosition = { ...position };
        group.userData.originalRotation = { ...rotation };
        group.userData.originalScale = scale;
        
        carousel.add(group);
        objects.push(group);
        
        // Debug output
        console.log(`Created model ${i} at position:`, position, 'rotation:', rotation);
    }
};

// Start loading models
loadModels();

// Raycaster setup
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(-2, 2); // Initialize off-screen
let hoveredObject = null;
const HOVER_SCALE = 1.1; // Even more subtle hover effect
let isHovering = false;

// Track the currently hovered model
let currentHoveredModel = null;

// Hover effect handler
function handleHover() {
    // Update raycaster with current mouse position
    raycaster.setFromCamera(mouse, camera);
    
    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(objects, true);
    
    if (intersects.length > 0) {
        // Find the first object that has a parent with userData (our actual model)
        let model = null;
        for (let i = 0; i < intersects.length; i++) {
            let obj = intersects[i].object;
            // Traverse up the parent chain to find our model group
            while (obj && !obj.userData.originalPosition) {
                obj = obj.parent;
            }
            if (obj && obj.userData.originalPosition) {
                model = obj;
                break;
            }
        }
        
        if (model && model !== currentHoveredModel) {
            // If we have a new hovered model
            if (currentHoveredModel) {
                // Reset previous hovered model
                gsap.to(currentHoveredModel.scale, {
                    x: currentHoveredModel.userData.originalScale,
                    y: currentHoveredModel.userData.originalScale,
                    z: currentHoveredModel.userData.originalScale,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            }
            
            // Set new hovered model
            currentHoveredModel = model;
            
            // Ensure the model has a name in userData
            if (!currentHoveredModel.userData.name) {
                currentHoveredModel.userData.name = model.name || '';
            }
            
            // Change cursor to black pointer
            document.body.classList.add('pointer-cursor');
            
            // Animate hover effect
            const hoverScale = model.userData.originalScale * 1.1;
            gsap.to(model.scale, {
                x: hoverScale,
                y: hoverScale,
                z: hoverScale,
                duration: 0.3,
                ease: 'power2.out'
            });
            
        } else if (!model && currentHoveredModel) {
            // No model is being hovered, reset current hovered model
            gsap.to(currentHoveredModel.scale, {
                x: currentHoveredModel.userData.originalScale,
                y: currentHoveredModel.userData.originalScale,
                z: currentHoveredModel.userData.originalScale,
                duration: 0.3,
                ease: 'power2.out'
            });
            currentHoveredModel = null;
            document.body.classList.remove('pointer-cursor');
        }
    } else if (currentHoveredModel) {
        // No intersections, reset current hovered model
        gsap.to(currentHoveredModel.scale, {
            x: currentHoveredModel.userData.originalScale,
            y: currentHoveredModel.userData.originalScale,
            z: currentHoveredModel.userData.originalScale,
            duration: 0.3,
            ease: 'power2.out'
        });
        currentHoveredModel = null;
        document.body.classList.remove('pointer-cursor');
    }
}

// Handle model clicks
function onModelClick() {
    if (currentHoveredModel) {
        // Get the model name and map it to the corresponding page
        const modelPages = {
            'rockbody': 'LI1-new',
            'shin': 'Shinkansen-new',
            'kidsynth': 'Kid-Synth-new'
        };
        
        // Get the model name from the model's userData or parent group
        const modelName = currentHoveredModel.userData.name || 
                         (currentHoveredModel.children[0]?.name || '').toLowerCase();
        const pageName = modelPages[modelName] || 'index';
        
        // Navigate to the corresponding page
        window.location.href = `${pageName}.html`;
    }
}

let clickCount = 0;
let clickTimer = null;

function onMouseClick(event) {
    // Ignore clicks on the contact button
    if (event.target.closest('.contact-button')) return; // Let browser handle it

    // Prevent default to avoid any native double-click behavior
    event.preventDefault();

    // Increment click count
    clickCount++;

    // Clear any existing timer
    if (clickTimer) clearTimeout(clickTimer);

    if (clickCount === 1) {
        clickTimer = setTimeout(() => {
            // Single click logic (if any) would go here
            clickCount = 0;
            clickTimer = null;
        }, 300); // 300ms delay to detect double-click
    } else {
        // Double click
        clearTimeout(clickTimer);
        clickCount = 0;
        clickTimer = null;

        if (currentHoveredModel) {
            onModelClick();
        }
    }
}

}

// Mouse move handler
function onMouseMove(event) {
    // Update mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Call handleHover directly on every move for better responsiveness
    handleHover();
}

// Add event listeners
window.addEventListener('mousemove', onMouseMove, false);
// Use 'click' instead of 'dblclick' to have better control over the timing
window.addEventListener('click', onMouseClick, false);

// Reset hover state when mouse leaves the window
window.addEventListener('mouseout', (event) => {
    if (!event.relatedTarget || (event.relatedTarget === document.documentElement)) {
        mouse.set(-2, 2); // Move off-screen
        // Reset the currently hovered model if any
        if (currentHoveredModel) {
            const originalScale = currentHoveredModel.userData.originalScale || MODEL_SCALE;
            gsap.to(currentHoveredModel.scale, {
                x: originalScale,
                y: originalScale,
                z: originalScale,
                duration: 0.3,
                ease: 'power2.out',
                onComplete: () => {
                    currentHoveredModel = null;
                }
            });
        }
    }
});

// Double-click handler with improved timing
let lastClickTime = 0;
const doubleClickThreshold = 300;

// Handle window blur to reset hover state
window.addEventListener('blur', () => {
    if (hoveredObject && hoveredObject.children[0]) {
        const model = hoveredObject.children[0];
        const originalScale = model.userData.originalScale || MODEL_SCALE;
        
        gsap.to(model.scale, {
            x: originalScale,
            y: originalScale,
            z: originalScale,
            duration: 0.3
        });
        
        hoveredObject = null;
        isHovering = false;
    }
});

window.addEventListener('click', (event) => {
    const now = Date.now();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(objects);

    if (intersects.length > 0) {
        if (now - lastClickTime < doubleClickThreshold) {
            const newWindow = window.open('', '_blank');
            if (newWindow) {
                newWindow.document.body.style.background = 'white';
                newWindow.document.title = 'Three.js Carousel - New Window';
            }
        }
        lastClickTime = now;
    }
});

// Animation loop with performance monitoring
const clock = new THREE.Clock();
let deltaTime = 0;

// Function to update lighting based on camera position
function updateLighting() {
    // Get camera direction vector
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    
    // Key light - positioned to the side of the camera direction
    const keyLightOffset = new THREE.Vector3(-cameraDirection.z, 0.3, cameraDirection.x).normalize();
    keyLight.position.copy(camera.position)
        .add(keyLightOffset.multiplyScalar(3))
        .add(new THREE.Vector3(0, 2, 0)); // Slightly elevated
    
    // Fill light - softer light from the opposite side
    const fillLightOffset = new THREE.Vector3(cameraDirection.z, 0.2, -cameraDirection.x).normalize();
    fillLight.position.copy(camera.position)
        .add(fillLightOffset.multiplyScalar(4))
        .add(new THREE.Vector3(0, 1, 0));
    
    // Rim light - positioned behind the models
    rimLight.position.copy(camera.position)
        .add(cameraDirection.multiplyScalar(-4))
        .add(new THREE.Vector3(0, 2, 0));
    
    // Make all lights look at the center of the scene
    keyLight.lookAt(0, 0, 0);
    fillLight.lookAt(0, 0, 0);
    rimLight.lookAt(0, 0, 0);
}

function animate() {
    requestAnimationFrame(animate);
    
    deltaTime = clock.getDelta();
    
    // Update raycaster
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(objects, false);

    // Handle hover effects
    if (intersects.length > 0) {
        if (hoveredObject && hoveredObject !== intersects[0].object) {
            hoveredObject.scale.set(1, 1, 1);
        }
        hoveredObject = intersects[0].object;
        hoveredObject.scale.set(1.08, 1.08, 1.08);
    } else {
        if (hoveredObject) {
            hoveredObject.scale.set(1, 1, 1);
            hoveredObject = null;
        }
    }

    // Update lighting based on camera position
    updateLighting();
    
    // Update controls (this maintains momentum)
    controls.update();
    renderer.render(scene, camera);

    if (DEBUG) {
        console.log('FPS:', 1 / deltaTime);
    }
}

// Start animation
animate();

// Improved resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
});

// Error handling
window.addEventListener('error', (event) => {
    console.error('Three.js Error:', event.error);
});

if (DEBUG) {
    console.log('Three.js Scene initialized');
    console.log('Camera position:', camera.position);
    console.log('Number of objects:', objects.length);
}

// Set initial camera position (180 degrees from original)
camera.position.set(25, 30, -40);
camera.lookAt(0, 0, 0);

// Initial lighting setup
updateLighting();
