// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth * 0.7, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Controls
const controls = new THREE.PointerLockControls(camera, document.body);

// Movement variables
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = true;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Materials
const wallMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 100 });
const floorMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc, shininess: 100 });
const exhibitMaterial = new THREE.MeshPhongMaterial({ color: 0x3498db, shininess: 100 });

// Create museum room
function createMuseumRoom() {
    const room = new THREE.Group();

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    room.add(floor);

    // Walls
    const wallGeometry = new THREE.PlaneGeometry(20, 10);
    
    // Back wall
    const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
    backWall.position.z = -10;
    backWall.position.y = 5;
    backWall.receiveShadow = true;
    backWall.userData.type = 'wall';
    backWall.userData.name = 'backWall';
    room.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
    leftWall.position.x = -10;
    leftWall.position.y = 5;
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    leftWall.userData.type = 'wall';
    leftWall.userData.name = 'leftWall';
    room.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
    rightWall.position.x = 10;
    rightWall.position.y = 5;
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    rightWall.userData.type = 'wall';
    rightWall.userData.name = 'rightWall';
    room.add(rightWall);

    return room;
}

// Create exhibit
function createExhibit(position, rotation, scale, info) {
    const exhibit = new THREE.Group();
    
    // Exhibit base
    const baseGeometry = new THREE.BoxGeometry(1, 0.2, 1);
    const base = new THREE.Mesh(baseGeometry, exhibitMaterial);
    base.castShadow = true;
    exhibit.add(base);

    // Exhibit display
    const displayGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.8);
    const display = new THREE.Mesh(displayGeometry, exhibitMaterial);
    display.position.y = 0.85;
    display.castShadow = true;
    exhibit.add(display);

    // Position and rotate
    exhibit.position.copy(position);
    exhibit.rotation.copy(rotation);
    exhibit.scale.copy(scale);

    // Add info
    exhibit.userData.info = info;
    exhibit.userData.type = 'exhibit';

    return exhibit;
}

// Create exhibits
const exhibits = [
    {
        position: new THREE.Vector3(-5, 0, -5),
        rotation: new THREE.Euler(0, Math.PI / 4, 0),
        scale: new THREE.Vector3(1, 1, 1),
        info: {
            title: "Ancient Artifact",
            description: "A rare artifact from ancient civilization, dating back to 3000 BCE."
        }
    },
    {
        position: new THREE.Vector3(5, 0, -5),
        rotation: new THREE.Euler(0, -Math.PI / 4, 0),
        scale: new THREE.Vector3(1, 1, 1),
        info: {
            title: "Modern Sculpture",
            description: "Contemporary sculpture representing the fusion of technology and art."
        }
    },
    {
        position: new THREE.Vector3(0, 0, -8),
        rotation: new THREE.Euler(0, 0, 0),
        scale: new THREE.Vector3(1.2, 1.2, 1.2),
        info: {
            title: "Interactive Display",
            description: "An interactive exhibit showcasing the evolution of digital art."
        }
    }
];

// Add room and exhibits to scene
const museumRoom = createMuseumRoom();
scene.add(museumRoom);

exhibits.forEach(exhibitData => {
    const exhibit = createExhibit(
        exhibitData.position,
        exhibitData.rotation,
        exhibitData.scale,
        exhibitData.info
    );
    scene.add(exhibit);
});

// Position camera
camera.position.set(0, 1.7, 5);
camera.lookAt(0, 1.7, 0);

// Raycaster for exhibit interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Handle window resize
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth * 0.7, window.innerHeight);
}

// Movement controls
const onKeyDown = function(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;
    }
};

const onKeyUp = function(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
    }
};

document.addEventListener('click', function() {
    controls.lock();
});

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

// Handle mouse click for exhibits and artworks
window.addEventListener('click', onMouseClick, false);

function onMouseClick(event) {
    if (controls.isLocked) {
        // Calculate mouse position in normalized device coordinates
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Update the picking ray with the camera and mouse position
        raycaster.setFromCamera(mouse, camera);

        // Calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects(scene.children, true);

        // Find clicked object
        const clickedObject = intersects.find(intersect => 
            intersect.object.userData.type === 'exhibit' ||
            intersect.object.userData.type === 'artwork'
        );

        if (clickedObject) {
            const object = clickedObject.object.userData.type === 'artwork' ? 
                clickedObject.object : 
                clickedObject.object.parent;

            if (object.userData.type === 'artwork') {
                updateArtworkInfo(object.userData.info);
            } else if (object.userData.type === 'exhibit') {
                updateExhibitInfo(object.userData.info);
            }
        }
    }
}

// Update exhibit information panel
function updateExhibitInfo(info) {
    const infoPanel = document.getElementById('exhibit-info');
    infoPanel.innerHTML = `
        <h3>${info.title}</h3>
        <p>${info.description}</p>
    `;
}

// Update artwork information panel
function updateArtworkInfo(info) {
    const infoPanel = document.getElementById('exhibit-info');
    infoPanel.innerHTML = `
        <h3>${info.title}</h3>
        <p><strong>Artist:</strong> ${info.artist}</p>
        <p><strong>Date:</strong> ${info.date}</p>
        <p><strong>Medium:</strong> ${info.medium}</p>
    `;
}

// Movement variables
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let prevTime = performance.now();

// Artwork interaction variables
let currentArtwork = null;
const artworkInteractionDistance = 3; // Distance in units to trigger artwork info
const artworkInteractionAngle = Math.PI / 4; // 45 degrees in radians

// Check if player is in front of artwork
function checkArtworkInteraction() {
    if (!controls.isLocked) return;

    // Get all artwork objects
    const artworkObjects = scene.children.filter(child => 
        child.userData && child.userData.type === 'artwork'
    );

    // Find the closest artwork in front of the player
    let closestArtwork = null;
    let minDistance = Infinity;

    artworkObjects.forEach(artwork => {
        // Calculate vector from player to artwork
        const toArtwork = new THREE.Vector3()
            .subVectors(artwork.position, camera.position);

        // Calculate distance
        const distance = toArtwork.length();

        // Check if artwork is within interaction distance
        if (distance < artworkInteractionDistance) {
            // Calculate angle between player's forward direction and artwork
            const forward = new THREE.Vector3();
            camera.getWorldDirection(forward);
            const angle = forward.angleTo(toArtwork.normalize());

            // Check if artwork is within interaction angle
            if (angle < artworkInteractionAngle) {
                if (distance < minDistance) {
                    minDistance = distance;
                    closestArtwork = artwork;
                }
            }
        }
    });

    // Update info panel if artwork changed
    if (closestArtwork !== currentArtwork) {
        currentArtwork = closestArtwork;
        if (currentArtwork) {
            updateArtworkInfo(currentArtwork.userData.info);
        } else {
            // Clear info panel if no artwork is in view
            const infoPanel = document.getElementById('exhibit-info');
            infoPanel.innerHTML = '';
        }
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (controls.isLocked) {
        const time = performance.now();
        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        camera.position.y += (velocity.y * delta);

        // Check artwork interaction
        checkArtworkInteraction();

        prevTime = time;
    }

    renderer.render(scene, camera);
}

// Artwork data
let artworks = [];

// Load artwork data from API
async function loadArtworks() {
    try {
        const response = await fetch('https://api.artic.edu/api/v1/artworks/search?q=monet&fields=id,title,image_id,artist_title,date_display,medium_display&limit=6');
        const data = await response.json();
        artworks = data.data;
        createArtworkPosters();
    } catch (error) {
        console.error('Error loading artworks:', error);
    }
}

// Create artwork poster
function createArtworkPoster(artwork, position, rotation) {
    const poster = new THREE.Group();
    
    // Poster frame
    const frameGeometry = new THREE.PlaneGeometry(2, 2);
    const frameMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x8b4513,
        shininess: 100
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    poster.add(frame);

    // Artwork image
    const imageGeometry = new THREE.PlaneGeometry(1.8, 1.8);
    const imageMaterial = new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load(`https://www.artic.edu/iiif/2/${artwork.image_id}/full/400,/0/default.jpg`),
        side: THREE.DoubleSide
    });
    const image = new THREE.Mesh(imageGeometry, imageMaterial);
    poster.add(image);

    // Position and rotate
    poster.position.copy(position);
    poster.rotation.copy(rotation);

    // Add artwork info
    poster.userData.info = {
        title: artwork.title,
        artist: artwork.artist_title,
        date: artwork.date_display,
        medium: artwork.medium_display
    };
    poster.userData.type = 'artwork';

    return poster;
}

// Create artwork posters on walls
function createArtworkPosters() {
    // Back wall posters
    const backWallSpacing = 4;
    const backWallStartX = -4;
    artworks.slice(0, 3).forEach((artwork, index) => {
        const position = new THREE.Vector3(
            backWallStartX + (index * backWallSpacing),
            1.7,
            -9.9
        );
        const rotation = new THREE.Euler(0, 0, 0);
        const poster = createArtworkPoster(artwork, position, rotation);
        scene.add(poster);
    });

    // Left wall posters
    const leftWallSpacing = 4;
    const leftWallStartZ = -4;
    artworks.slice(3, 5).forEach((artwork, index) => {
        const position = new THREE.Vector3(
            -9.9,
            1.7,
            leftWallStartZ + (index * leftWallSpacing)
        );
        const rotation = new THREE.Euler(0, Math.PI / 2, 0);
        const poster = createArtworkPoster(artwork, position, rotation);
        scene.add(poster);
    });

    // Right wall posters
    artworks.slice(5, 6).forEach((artwork, index) => {
        const position = new THREE.Vector3(
            9.9,
            1.7,
            leftWallStartZ + (index * leftWallSpacing)
        );
        const rotation = new THREE.Euler(0, -Math.PI / 2, 0);
        const poster = createArtworkPoster(artwork, position, rotation);
        scene.add(poster);
    });
}

// Load artworks and start animation
loadArtworks();
animate();

// Remove loading screen
document.getElementById('loading').style.display = 'none'; 