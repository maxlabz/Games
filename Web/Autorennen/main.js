// main.js - 3D Autorennen Starter

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();

// Kamera & Licht
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 10000);
const dir = new THREE.DirectionalLight(0xffffff, 1.5);
dir.position.set(5, 10, 7);
scene.add(dir);
scene.add(new THREE.AmbientLight(0xffffff, 0.4));

const controls = new THREE.OrbitControls(camera, renderer.domElement);

// ---------- Strecke ----------
const trackLengthMeters = 5000;
const points = [];
const R = 100;
for (let i=0;i<12;i++){
  const a = i/12 * Math.PI * 2;
  const radius = R * (1 + 0.3 * Math.sin(i*0.9));
  const x = Math.cos(a) * radius + (Math.random()-0.5)*20;
  const z = Math.sin(a) * radius + (Math.random()-0.5)*20;
  points.push(new THREE.Vector3(x, 0, z));
}
points.push(points[0].clone());
const trackCurve = new THREE.CatmullRomCurve3(points, true);
const trackVisualPts = trackCurve.getPoints(400);

// Straße
const trackGeometry = new THREE.TubeGeometry(trackCurve, 400, 6, 8, true);
const trackMaterial = new THREE.MeshStandardMaterial({ color: 0x2b2b2b });
const trackMesh = new THREE.Mesh(trackGeometry, trackMaterial);
trackMesh.position.y = 0.01;
scene.add(trackMesh);

// Boden
const groundGeo = new THREE.PlaneGeometry(2000,2000,8,8);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x66bb66 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI/2;
scene.add(ground);

// ---------- Autos ----------
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

let playerT = 0;
let aiT = 0.05;

const playerCar = createCar(0x0044ff);
scene.add(playerCar);
playerCar.position.copy(trackCurve.getPointAt(playerT)).add(new THREE.Vector3(0,0.4,0));

const aiCar = createCar(0xff3300);
scene.add(aiCar);
aiCar.position.copy(trackCurve.getPointAt(aiT)).add(new THREE.Vector3(0,0.4,0));

// Kamera am Start ausrichten
const startPos = trackCurve.getPointAt(0);
camera.position.copy(startPos.clone().add(new THREE.Vector3(0, 6, -12)));
camera.lookAt(startPos);
controls.target.copy(startPos);

// ---------- HUD ----------
const hudSpeed = document.getElementById('speed');
const hudDistance = document.getElementById('distance');
const msg = document.getElementById('message');

// ---------- Steuerung ----------
const keys = { ArrowUp:false, ArrowDown:false, ArrowLeft:false, ArrowRight:false };
window.addEventListener('keydown', e=>{ if(e.key in keys) keys[e.key]=true; });
window.addEventListener('keyup', e=>{ if(e.key in keys) keys[e.key]=false; });

// ---------- Powerups / Hindernisse ----------
const powerups = [];
const powerupTypes = ['boost','shield','slowOpp'];
for (let i=0;i<25;i++){
  powerups.push({
    t: Math.random(),
    type: powerupTypes[Math.floor(Math.random()*powerupTypes.length)],
    used:false
  });
}

const obstacles = [];
for (let i=0;i<40;i++){
  obstacles.push({ t: Math.random(), hit:false });
}

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

const obstGroup = new THREE.Group();
obstacles.forEach(ob=>{
  const p = trackCurve.getPointAt(ob.t);
  const m = new THREE.Mesh(new THREE.BoxGeometry(1.8,0.6,1.8), new THREE.MeshStandardMaterial({color:0x443322}));
  m.position.copy(p).add(new THREE.Vector3(0,0.3,0));
  ob.mesh = m;
  obstGroup.add(m);
});
scene.add(obstGroup);

// ---------- Spiel-Parameter ----------
let lastTime = performance.now();
let playerSpeedKmh = 0;
const maxSpeedKmh = 100;
const maxSpeedMps = maxSpeedKmh/3.6;
const trackTotalMeters = trackLengthMeters;

// Powerup States
let hasShield = false;
let boostActive = false;
let boostTimer = 0;
let shieldTimer = 0;
let slowOpponentTimer = 0;

let aiSpeedTargetKmh = 70;
let aiSpeedKmh = 50;

// ---------- Funktionen ----------
function mod1(t){ return ((t%1)+1)%1; }
function distanceAlong(t1,t2){
  let dparam = Math.abs(t2 - t1);
  if (dparam > 0.5) dparam = 1 - dparam;
  return dparam * trackTotalMeters;
}

function showMsg(t){
  msg.innerText = t;
  setTimeout(()=>{ if(msg.innerText===t) msg.innerText=''; }, 2000);
}

function checkPickups(carT, isPlayer){
  powerups.forEach(pu=>{
    if (pu.used) return;
    const d = distanceAlong(carT, pu.t);
    if (d < 20){
      pu.used = true;
      pu.mesh.visible = false;
      if (isPlayer) {
        if (pu.type==='boost'){ boostActive=true; boostTimer=3; showMsg('Boost!'); }
        if (pu.type==='shield'){ hasShield=true; shieldTimer=4; showMsg('Shield!'); }
        if (pu.type==='slowOpp'){ slowOpponentTimer=3; showMsg('Gegner verlangsamt!'); }
      } else {
        aiSpeedTargetKmh = Math.min(maxSpeedKmh, aiSpeedTargetKmh + 20);
      }
    }
  });
}

function checkObstacles(carT, isPlayer){
  obstacles.forEach(ob=>{
    if (ob.hit) return;
    const d = distanceAlong(carT, ob.t);
    if (d < 5){
      ob.hit = true;
      ob.mesh.material.color.setHex(0x333333);
      if (isPlayer){
        if (hasShield){ hasShield=false; shieldTimer=0; showMsg('Shield hat Hindernis blockiert'); }
        else {
          playerSpeedKmh = Math.max(10, playerSpeedKmh - 30);
          showMsg('Hindernis! Langsamer!');
        }
      } else {
        aiSpeedTargetKmh = Math.max(10, aiSpeedTargetKmh - 25);
      }
    }
  });
}

function updateAI(dt){
  let effectiveTarget = aiSpeedTargetKmh;
  if (slowOpponentTimer > 0) effectiveTarget = Math.max(5, effectiveTarget - 40);

  const accel = 30;
  if (aiSpeedKmh < effectiveTarget) aiSpeedKmh = Math.min(effectiveTarget, aiSpeedKmh + accel*dt);
  else aiSpeedKmh = Math.max(effectiveTarget, aiSpeedKmh - accel*dt);

  const v_mps = aiSpeedKmh / 3.6;
  aiT = mod1(aiT + (v_mps*dt)/trackTotalMeters);

  const pos = trackCurve.getPointAt(aiT);
  const tangent = trackCurve.getTangentAt(aiT);
  aiCar.position.copy(pos).add(new THREE.Vector3(0,0.4,0));
  aiCar.rotation.y = Math.atan2(tangent.x, tangent.z);

  checkPickups(aiT, false);
  checkObstacles(aiT, false);
}

// ---------- Hauptloop ----------
let running = true;
function update(dt){
  if (boostActive){ boostTimer -= dt; if (boostTimer <= 0) boostActive=false; }
  if (shieldTimer > 0){ shieldTimer -= dt; if (shieldTimer <= 0) hasShield=false; }
  if (slowOpponentTimer > 0) slowOpponentTimer -= dt;

  if (keys.ArrowUp) playerSpeedKmh = Math.min(maxSpeedKmh, playerSpeedKmh + 25*dt);
  else playerSpeedKmh = Math.max(0, playerSpeedKmh - 12*dt);

  if (keys.ArrowDown) playerSpeedKmh = Math.max(0, playerSpeedKmh - 40*dt);

  let effectiveSpeedKmh = playerSpeedKmh;
  if (boostActive) effectiveSpeedKmh = Math.min(maxSpeedKmh*1.6, effectiveSpeedKmh + 60);

  const v_mps = effectiveSpeedKmh / 3.6;
  playerT = mod1(playerT + (v_mps*dt)/trackTotalMeters);

  const pos = trackCurve.getPointAt(playerT);
  const tangent = trackCurve.getTangentAt(playerT);
  playerCar.position.copy(pos).add(new THREE.Vector3(0,0.4,0));

  let lateral = 0;
  if (keys.ArrowLeft) lateral = -1.8;
  if (keys.ArrowRight) lateral = 1.8;
  const perp = new THREE.Vector3(-tangent.z,0,tangent.x).normalize().multiplyScalar(lateral);
  playerCar.position.add(perp);
  playerCar.rotation.y = Math.atan2(tangent.x, tangent.z) + (lateral*0.04);

  checkPickups(playerT, true);
  checkObstacles(playerT, true);

  // Kamera folgt
  const camOffset = new THREE.Vector3(0,6,-12).applyAxisAngle(new THREE.Vector3(0,1,0), playerCar.rotation.y);
  camera.position.lerp(playerCar.position.clone().add(camOffset), 0.1);
  camera.lookAt(playerCar.position.clone().add(new THREE.Vector3(0,1.2,0)));

  updateAI(dt);

  hudSpeed.innerText = `Geschw.: ${Math.round(effectiveSpeedKmh)} km/h`;
  const distTravelled = playerT * trackTotalMeters;
  const remaining = Math.max(0, Math.round(trackTotalMeters - distTravelled));
  hudDistance.innerText = `Rest: ${remaining} m`;

  if (distTravelled >= trackTotalMeters - 1){
    showMsg('Du hast gewonnen!');
    running = false;
  }
  const aiTravelled = aiT * trackTotalMeters;
  if (aiTravelled >= trackTotalMeters - 1){
    showMsg('Der Computer hat gewonnen!');
    running = false;
  }
}

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

window.addEventListener('resize', ()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
