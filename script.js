// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth * 0.7, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Add loading message
const loadingDiv = document.createElement('div');
loadingDiv.style.position = 'absolute';
loadingDiv.style.top = '50%';
loadingDiv.style.left = '50%';
loadingDiv.style.transform = 'translate(-50%, -50%)';
loadingDiv.style.color = '#333';
loadingDiv.style.fontSize = '18px';
loadingDiv.textContent = 'Loading robot model...';
document.getElementById('canvas-container').appendChild(loadingDiv);

// Add orbit controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Load URDF
const urdfParser = new URDFParser();
let robot;

// Fetch URDF file
fetch('http://localhost:8000/ur5_description/ur5.urdf')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
    })
    .then(urdfString => {
        robot = urdfParser.parseURDF(urdfString);
        if (robot) {
            scene.add(robot);
            // Enable shadows for all meshes
            robot.traverse((node) => {
                if (node instanceof THREE.Mesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });
            // Remove loading message
            loadingDiv.remove();
            
            // Initialize joint rotations
            initializeJointRotations();
        } else {
            throw new Error('Failed to parse URDF');
        }
    })
    .catch(error => {
        console.error('Error loading URDF:', error);
        loadingDiv.textContent = 'Error loading robot model. Please check console for details.';
        loadingDiv.style.color = 'red';
    });

// Position camera
camera.position.set(3, 3, 3);
camera.lookAt(0, 0, 0);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth * 0.7, window.innerHeight);
}

// Joint control mapping
const jointControls = {
    'base_to_shoulder': { axis: 'y', link: 'base_link', offset: new THREE.Vector3(0, 0, 0) },
    'shoulder_to_upper_arm': { axis: 'x', link: 'shoulder_link', offset: new THREE.Vector3(0, 0.15, 0) },
    'upper_arm_to_forearm': { axis: 'x', link: 'upper_arm_link', offset: new THREE.Vector3(0, 0.3, 0) },
    'forearm_to_wrist_1': { axis: 'x', link: 'forearm_link', offset: new THREE.Vector3(0, 0.3, 0) },
    'wrist_1_to_wrist_2': { axis: 'z', link: 'wrist_1_link', offset: new THREE.Vector3(0, 0.15, 0) },
    'wrist_2_to_wrist_3': { axis: 'x', link: 'wrist_2_link', offset: new THREE.Vector3(0, 0.1, 0) }
};

// Initialize joint rotations
function initializeJointRotations() {
    if (!robot) return;
    
    // Set initial positions and rotations
    Object.entries(jointControls).forEach(([jointName, control]) => {
        const link = robot.getObjectByName(control.link);
        if (link) {
            link.position.copy(control.offset);
            link.rotation.set(0, 0, 0);
        }
    });
}

// Control sliders
const sliders = document.querySelectorAll('input[type="range"]');
const valueDisplays = document.querySelectorAll('span[id$="-value"]');

sliders.forEach((slider) => {
    slider.addEventListener('input', (e) => {
        const jointName = e.target.id;
        const value = e.target.value;
        const valueDisplay = document.getElementById(`${jointName}-value`);
        valueDisplay.textContent = `${value}°`;
        
        if (robot) {
            const control = jointControls[jointName];
            if (control) {
                const link = robot.getObjectByName(control.link);
                if (link) {
                    const radians = THREE.MathUtils.degToRad(parseFloat(value));
                    
                    // Reset rotation first
                    link.rotation.set(0, 0, 0);
                    
                    // Apply rotation based on axis
                    switch(control.axis) {
                        case 'x':
                            link.rotation.x = radians;
                            break;
                        case 'y':
                            link.rotation.y = radians;
                            break;
                        case 'z':
                            link.rotation.z = radians;
                            break;
                    }
                    
                    // Apply offset position
                    link.position.copy(control.offset);
                }
            }
        }
    });
});