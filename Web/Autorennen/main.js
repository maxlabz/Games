// main.js
// 3D Autorennen Starter (Three.js)
// Autor: ChatGPT (Startercode)
// Hinweis: benutze aktuelle Three.js CDN in index.html

// --------- Grundlagen & Szene ----------
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();

// Kamera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 10000);
camera.position.set(0, 6, -12);

// Licht
const dir = new THREE.DirectionalLight(0xffffff, 1.0);
dir.position.set(5, 10, 7);
scene.add(dir);
scene.add(new THREE.AmbientLight(0xffffff, 0.4));

// einfache OrbitControls für Debugging (nicht für Spielsteuerung)
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(0,0,0);

// ---------- Strecke (parametrische Kurve) ----------
const trackLengthMeters = 5000; // 5 km
// Wir erzeugen eine geschlossene, kurvige Strecke mit Kontrollpunkten
const points = [];
const R = 100; // Basisskala (ändert nur Aussehen). Länge wird separat geführt.
for (let i=0;i<12;i++){
  const a = i/12 * Math.PI * 2;
  const radius = R * (1 + 0.3 * Math.sin(i*0.9));
  const x = Math.cos(a) * radius + (Math.random()-0.5)*20;
  const z = Math.sin(a) * radius + (Math.random()-0.5)*20;
  points.push(new THREE.Vector3(x, 0, z));
}
points.push(points[0].clone()); // schließen

const trackCurve = new THREE.CatmullRomCurve3(points, true);
const trackVisualPts = trackCurve.getPoints(400);
const trackGeometry = new THREE.TubeGeometry(trackCurve, 400, 6, 8, true);
const trackMaterial = new THREE.MeshStandardMaterial({ color: 0x2b2b2b });
const trackMesh = new THREE.Mesh(trackGeometry, trackMaterial);
trackMesh.position.y = 0.01;
scene.add(trackMesh);

// Gras / Umgebung
const groundGeo = new THREE.PlaneGeometry(2000,2000,8,8);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x66bb66 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI/2;
scene.add(ground);

// Markiere die Straße Kanten (linie)
const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff });
const leftEdgePts = trackVisualPts.map(p => p.clone().add(new THREE.Vector3(-6,0,0)));
const rightEdgePts = trackVisualPts.map(p => p.clone().add(new THREE.Vector3(6,0,0)));
const leftLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(trackVisualPts), edgeMat);
leftLine.position.y = 0.02;
scene.add(leftLine);

// ---------- Wagenmodell (sehr einfach) ----------
function createCar(color=0xff0000){
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 1.2), new THREE.MeshStandardMaterial({color}));
  body.position.y = 0.5;
  g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.4, 0.9), new THREE.MeshStandardMaterial({color:0x222222}));
  cabin.position.set(0.15,0.85,0);
  g.add(cabin);
  return g;
}

const playerCar = createCar(0x0044ff);
scene.add(playerCar);

const aiCar = createCar(0xff3300);
scene.add(aiCar);

// ---------- Spielparameter ----------
let lastTime = performance.now();
const hudSpeed = document.getElementById('speed');
const hudDistance = document.getElementById('distance');
const msg = document.getElementById('message');

const maxSpeedKmh = 100; // km/h
const maxSpeedMps = maxSpeedKmh / 3.6; // m/s
let playerSpeedKmh = 0;
let playerT = 0; // Position entlang Kurve (0..1)
let aiT = 0.05;
const trackTotalMeters = trackLengthMeters; // 5000
// Wir bewegen uns entlang der Kurve parametrisch; v -> dt = v * dt / L

// Controls (simple)
const keys = { ArrowUp:false, ArrowDown:false, ArrowLeft:false, ArrowRight:false };
window.addEventListener('keydown', e=>{ if(e.key in keys) keys[e.key]=true; });
window.addEventListener('keyup', e=>{ if(e.key in keys) keys[e.key]=false; });

// Powerups
const powerups = []; // {t, type}
const powerupTypes = ['boost','shield','slowOpp'];
// Generiere zufällige Powerups auf Strecke
for (let i=0;i<25;i++){
  powerups.push({
    t: Math.random(),
    type: powerupTypes[Math.floor(Math.random()*powerupTypes.length)],
    used:false
  });
}
// Obstacles (verlangsamen)
const obstacles = [];
for (let i=0;i<40;i++){
  obstacles.push({ t: Math.random(), hit:false });
}

// Visualisierung Powerup markers
const puGroup = new THREE.Group();
powerups.forEach(pu=>{
  const p = trackCurve.getPointAt(pu.t);
  const geo = new THREE.ConeGeometry(1.2, 2, 8);
  const mat = new THREE.MeshStandardMaterial({ color: pu.type==='boost'?0xffff00: pu.type==='shield'?0x00ffcc: 0xff00ff });
  const m = new THREE.Mesh(geo, mat);
  m.position.copy(p).add(new THREE.Vector3(0,1.0,0));
  pu.mesh = m;
  puGroup.add(m);
});
scene.add(puGroup);

// Obstacle visuals
const obstGroup = new THREE.Group();
obstacles.forEach(ob=>{
  const p = trackCurve.getPointAt(ob.t);
  const m = new THREE.Mesh(new THREE.BoxGeometry(1.8,0.6,1.8), new THREE.MeshStandardMaterial({color:0x443322}));
  m.position.copy(p).add(new THREE.Vector3(0,0.3,0));
  ob.mesh = m;
  obstGroup.add(m);
});
scene.add(obstGroup);

// Powerup states / cooldowns
let hasShield = false;
let boostActive = false;
let boostTimer = 0;
let shieldTimer = 0;
let slowOpponentTimer = 0;
const cooldown = { boost: 6, shield: 10, slowOpp: 12 };
let lastUse = { boost: -99, shield: -99, slowOpp: -99 };

// Hook up buttons
document.getElementById('useBoost').addEventListener('click', ()=>{
  const now = performance.now()/1000;
  if (now - lastUse.boost >= cooldown.boost) { activateBoost(); lastUse.boost = now; showMsg('Boost aktiviert'); }
  else showMsg('Boost noch in Cooldown');
});
document.getElementById('useShield').addEventListener('click', ()=>{
  const now = performance.now()/1000;
  if (now - lastUse.shield >= cooldown.shield) { activateShield(); lastUse.shield = now; showMsg('Shield aktiviert'); }
  else showMsg('Shield noch in Cooldown');
});
document.getElementById('useSlow').addEventListener('click', ()=>{
  const now = performance.now()/1000;
  if (now - lastUse.slowOpp >= cooldown.slowOpp) { activateSlowOpponent(); lastUse.slowOpp = now; showMsg('Gegner verlangsamt'); }
  else showMsg('Slow noch in Cooldown');
});

function showMsg(t){
  msg.innerText = t;
  setTimeout(()=>{ if(msg.innerText===t) msg.innerText=''; }, 2000);
}

// Powerup Aktivierung Funktionen
function activateBoost(){ boostActive=true; boostTimer=3.0; } // + temporary speed
function activateShield(){ hasShield=true; shieldTimer=4.0; }
function activateSlowOpponent(){ slowOpponentTimer = 3.0; }

// ---------- Kollisions- & Pickup-Check ----------
function mod1(t){ return ((t%1)+1)%1; }
function distanceAlong(t1,t2){
  // minimaler param. Abstand auf Ring (in m)
  let dparam = Math.abs(t2 - t1);
  if (dparam > 0.5) dparam = 1 - dparam;
  return dparam * trackTotalMeters;
}

function checkPickups(carT, carMesh, isPlayer=true){
  powerups.forEach(pu=>{
    if (pu.used) return;
    const d = distanceAlong(carT, pu.t);
    if (d < 25){ // within ~25 m
      pu.used = true;
      // entferne mesh
      pu.mesh.visible = false;
      if (isPlayer) {
        if (pu.type === 'boost') { activateBoost(); showMsg('Boost aufgehoben!'); }
        if (pu.type === 'shield') { activateShield(); showMsg('Shield aufgehoben!'); }
        if (pu.type === 'slowOpp') { activateSlowOpponent(); showMsg('Slow aufgehoben!'); }
      } else {
        // AI pickups: AI bekommt leichte boost
        if (pu.type === 'boost') { aiSpeedTargetKmh = Math.min(maxSpeedKmh, aiSpeedTargetKmh + 20); }
      }
    }
  });
}

function checkObstacles(carT, carMesh, isPlayer=true){
  obstacles.forEach(ob=>{
    if (ob.hit) return;
    const d = distanceAlong(carT, ob.t);
    if (d < 6){ // hit
      ob.hit = true;
      ob.mesh.material.color.setHex(0x333333);
      if (isPlayer){
        if (hasShield) { hasShield=false; shieldTimer=0; showMsg('Shield hat Hindernis verhindert'); }
        else {
          // verlangsamen stark
          playerSpeedKmh = Math.max(10, playerSpeedKmh - 30);
          showMsg('Hindernis! Geschwindigkeit reduziert');
        }
      } else {
        // AI trifft Hindernis
        aiSpeedTargetKmh = Math.max(10, aiSpeedTargetKmh - 25);
      }
    }
  });
}

// ---------- KI (sehr einfach) ----------
let aiSpeedTargetKmh = 70; // Zielgeschwindigkeit der KI
function updateAI(dt){
  // AI simple logik: versucht aiSpeedTarget, aber beeinflusst von slowOpponentTimer
  let effectiveTarget = aiSpeedTargetKmh;
  if (slowOpponentTimer > 0) effectiveTarget = Math.max(5, effectiveTarget - 40);

  // adjust current ai speed toward target
  if (aiSpeedKmh === undefined) aiSpeedKmh = 50;
  const accel = 30; // km/h per second approx
  if (aiSpeedKmh < effectiveTarget) aiSpeedKmh = Math.min(effectiveTarget, aiSpeedKmh + accel*dt);
  else aiSpeedKmh = Math.max(effectiveTarget, aiSpeedKmh - accel*dt);

  // advance along curve
  const v_mps = aiSpeedKmh / 3.6;
  const dtParam = (v_mps * dt) / trackTotalMeters;
  aiT = mod1(aiT + dtParam);

  const pos = trackCurve.getPointAt(aiT);
  const tangent = trackCurve.getTangentAt(aiT);
  aiCar.position.copy(pos).add(new THREE.Vector3(0,0.4,0));
  // orient car along tangent
  const angle = Math.atan2(tangent.x, tangent.z);
  aiCar.rotation.y = angle;
  checkPickups(aiT, aiCar, false);
  checkObstacles(aiT, aiCar, false);
}

// ---------- Spiel-Loop ----------
function update(dt){
  // timers
  if (boostActive){ boostTimer -= dt; if (boostTimer <= 0) boostActive=false; }
  if (shieldTimer > 0){ shieldTimer -= dt; if (shieldTimer <= 0) hasShield=false; }
  if (slowOpponentTimer > 0) slowOpponentTimer -= dt;

  // Input -> target speed
  const baseAcceleration = 25; // km/h per second when pressing gas
  const braking = 40;
  if (keys.ArrowUp) {
    playerSpeedKmh = Math.min(maxSpeedKmh, playerSpeedKmh + baseAcceleration * dt);
  } else {
    // natural friction
    playerSpeedKmh = Math.max(0, playerSpeedKmh - 12 * dt);
  }
  if (keys.ArrowDown) {
    playerSpeedKmh = Math.max(0, playerSpeedKmh - braking * dt);
  }

  // boost effect
  let effectiveSpeedKmh = playerSpeedKmh;
  if (boostActive) effectiveSpeedKmh = Math.min(maxSpeedKmh * 1.6, effectiveSpeedKmh + 60);

  // move along curve
  const v_mps = effectiveSpeedKmh / 3.6;
  const dtParam = (v_mps * dt) / trackTotalMeters;
  playerT = mod1(playerT + dtParam);

  // Steering: small lateral offset by rotating car along tangent and small offset
  const pos = trackCurve.getPointAt(playerT);
  const tangent = trackCurve.getTangentAt(playerT);
  playerCar.position.copy(pos).add(new THREE.Vector3(0,0.4,0));
  const angle = Math.atan2(tangent.x, tangent.z);

  // allow small left/right by offsetting position perpendicular
  let lateral = 0;
  if (keys.ArrowLeft) lateral = -1.8;
  if (keys.ArrowRight) lateral = 1.8;
  // compute perpendicular 2D vector to tangent
  const perp = new THREE.Vector3(-tangent.z,0,tangent.x).normalize().multiplyScalar(lateral);
  playerCar.position.add(perp);

  playerCar.rotation.y = angle + (lateral*0.04);

  // check pickups & obstacles
  checkPickups(playerT, playerCar, true);
  checkObstacles(playerT, playerCar, true);

  // update camera to follow player
  const camOffset = new THREE.Vector3(0, 6, -12).applyAxisAngle(new THREE.Vector3(0,1,0), playerCar.rotation.y);
  camera.position.lerp(playerCar.position.clone().add(camOffset), 0.12);
  camera.lookAt(playerCar.position.clone().add(new THREE.Vector3(0,1.2,0)));

  // update AI
  updateAI(dt);

  // HUD
  hudSpeed.innerText = `Geschw.: ${Math.round(effectiveSpeedKmh)} km/h`;
  // compute distance remaining (player)
  const distTravelled = playerT * trackTotalMeters;
  const remaining = Math.max(0, Math.round(trackTotalMeters - distTravelled));
  hudDistance.innerText = `Rest: ${remaining} m`;

  // win/lose check (first to complete track)
  if (distTravelled >= trackTotalMeters - 1) {
    showMsg('Du hast gewonnen! Strecke geschafft.');
    running = false;
  }
  const aiTravelled = aiT * trackTotalMeters;
  if (aiTravelled >= trackTotalMeters - 1) {
    showMsg('Der Computer hat gewonnen!');
    running = false;
  }
}

// main loop
let running = true;
function animate(){
  const now = performance.now();
  let dt = (now - lastTime) / 1000;
  if (dt > 0.05) dt = 0.05;
  lastTime = now;

  if (running) update(dt);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

// Handle resize
window.addEventListener('resize', ()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
