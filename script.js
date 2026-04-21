// --- THREE.JS SCENE (BLUEPRINT STYLE) ---
let scene, camera, renderer, ball, ballShadow, landscapes = [], coins = [], motionLines = [];
let startTime = Date.now();
const WORLD_SPEED = 0.6;
const PLANE_SIZE = 200;

function createLandscape(zPos) {
    const container = new THREE.Group();
    
    const geo = new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE, 40, 40);
    const posAttr = geo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        const jitter = Math.sin(x * 0.2) * Math.cos(y * 0.2) * 1.5;
        posAttr.setZ(i, jitter); 
    }
    
    // BOLD BLUEPRINT GRID
    const mat = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        wireframe: true, 
        transparent: true, 
        opacity: 0.4 
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    container.add(mesh);

    // BOLD DRAFTING PATH
    const pathGeo = new THREE.PlaneGeometry(20, PLANE_SIZE, 1, 10);
    const pathMat = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        wireframe: true, 
        transparent: true, 
        opacity: 0.7 
    });
    const path = new THREE.Mesh(pathGeo, pathMat);
    path.rotation.x = -Math.PI / 2;
    path.position.y = 0.05; 
    container.add(path);
    
    container.position.set(0, -1.5, zPos);
    return container;
}

function initThree() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x004d80); 
    scene.fog = new THREE.Fog(0x004d80, 40, 200); 
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Vertical View Offset to push content up
    camera.setViewOffset(
        window.innerWidth, window.innerHeight,
        0, -window.innerHeight * 0.18, 
        window.innerWidth, window.innerHeight
    );

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth / 2, window.innerHeight / 2, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    document.getElementById('three-container').appendChild(renderer.domElement);

    landscapes[0] = createLandscape(0);
    landscapes[1] = createLandscape(-PLANE_SIZE);
    scene.add(landscapes[0]);
    scene.add(landscapes[1]);

    const ballGeo = new THREE.SphereBufferGeometry(1, 12, 12);
    const ballMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
    ball = new THREE.Mesh(ballGeo, ballMat);
    ball.position.set(0, 0, -8); // Pulled back slightly (Goldilocks zone)
    scene.add(ball);

    const shadowGeo = new THREE.RingBufferGeometry(0.8, 1, 32);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
    ballShadow = new THREE.Mesh(shadowGeo, shadowMat);
    ballShadow.rotation.x = -Math.PI / 2;
    ballShadow.position.set(0, -1.45, -8); 
    scene.add(ballShadow);

    const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,10)]);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });
    for(let i=0; i<15; i++) {
        const line = new THREE.Line(lineGeo, lineMat);
        line.position.set(THREE.MathUtils.randFloatSpread(100), THREE.MathUtils.randFloat(-2, 10), -THREE.MathUtils.randFloat(0, 200));
        scene.add(line);
        motionLines.push(line);
    }

    const coinGeo = new THREE.OctahedronBufferGeometry(0.5, 0);
    const coinMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
    for (let i = 0; i < 8; i++) {
        const coin = new THREE.Mesh(coinGeo, coinMat);
        coin.position.set(THREE.MathUtils.randFloatSpread(20), 0.5, -THREE.MathUtils.randFloat(20, 150));
        scene.add(coin);
        coins.push(coin);
    }
    
    // Balanced drafting angle
    camera.position.set(0, 8, 15);
    camera.lookAt(0, -2, -5);
    
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const secs = String(elapsed % 60).padStart(2, '0');
    if (document.getElementById('hud-timer')) document.getElementById('hud-timer').textContent = `${mins}:${secs}`;

    const baseVel = 45;
    const jitter = Math.sin(Date.now() * 0.005) * 5;
    const finalVel = Math.max(0, baseVel + jitter);
    if (document.getElementById('hud-velocity-bar')) document.getElementById('hud-velocity-bar').style.width = `${Math.min(100, finalVel)}%`;
    if (document.getElementById('hud-velocity-text')) document.getElementById('hud-velocity-text').textContent = `${finalVel.toFixed(1)} m/s`;

    const coinCount = Math.min(12, Math.floor(elapsed / 10));
    if (document.getElementById('hud-coins')) document.getElementById('hud-coins').textContent = `${String(coinCount).padStart(2, '0')} / 12`;

    landscapes.forEach(plane => {
        plane.position.z += WORLD_SPEED;
        if (plane.position.z > PLANE_SIZE) {
            plane.position.z -= PLANE_SIZE * 2;
        }
    });
    
    motionLines.forEach(l => {
        l.position.z += WORLD_SPEED * 5; 
        if (l.position.z > 20) l.position.z = -200;
    });

    ball.rotation.x -= 0.2;
    ball.position.y = Math.sin(Date.now() * 0.01) * 0.1; 
    ballShadow.scale.setScalar(1 + ball.position.y * 0.5); 
    
    coins.forEach(c => {
        c.rotation.y += 0.05;
        c.position.z += WORLD_SPEED;
        if (c.position.z > 20) {
            c.position.z = -PLANE_SIZE; 
            c.position.x = THREE.MathUtils.randFloatSpread(20);
        }
    });

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    camera.setViewOffset(
        window.innerWidth, window.innerHeight,
        0, -window.innerHeight * 0.18,
        window.innerWidth, window.innerHeight
    );
    renderer.setSize(window.innerWidth / 2, window.innerHeight / 2, false);
});

// --- UI LOGIC ---

function openWindow(id) {
    document.getElementById(id).classList.add('active');
    document.getElementById('main-menu').style.display = 'none';
    initSlides(id);
}

function closeWindow(id) {
    document.getElementById(id).classList.remove('active');
    document.getElementById('main-menu').style.display = 'flex';
}

function initSlides(windowId) {
    const container = document.getElementById(windowId);
    if (!container) return;

    const slides = container.querySelectorAll('.slide');
    const total = slides.length;
    const prevBtn = container.querySelector('.prev, #prev-btn');
    const nextBtn = container.querySelector('.next, #next-btn');
    const indicator = container.querySelector('.indicator, .slide-indicator');
    
    let current = 0;
    let activePrevBtn = prevBtn;
    let activeNextBtn = nextBtn;

    function update() {
        slides.forEach((s, i) => s.classList.toggle('active', i === current));
        if (indicator) {
            indicator.textContent = `${String(current + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
        }
        if (activePrevBtn) activePrevBtn.disabled = current === 0;
        if (activeNextBtn) activeNextBtn.disabled = current === total - 1;
    }

    if (nextBtn && prevBtn) {
        activeNextBtn = nextBtn.cloneNode(true);
        activePrevBtn = prevBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(activeNextBtn, nextBtn);
        prevBtn.parentNode.replaceChild(activePrevBtn, prevBtn);

        activeNextBtn.addEventListener('click', () => { if (current < total - 1) { current++; update(); } });
        activePrevBtn.addEventListener('click', () => { if (current > 0) { current--; update(); } });
    }

    update();

    const keyHandler = (e) => {
        if (windowId !== 'slides-container' && !container.classList.contains('active')) return;
        if (e.code === 'ArrowRight' || e.code === 'Space') { if (current < total - 1) { current++; update(); } }
        else if (e.code === 'ArrowLeft') { if (current > 0) { current--; update(); } }
    };
    document.removeEventListener('keydown', window._keyHandler);
    window._keyHandler = keyHandler;
    document.addEventListener('keydown', keyHandler);
}

if (document.getElementById('slides-container')) {
    initSlides('slides-container');
}

initThree();
