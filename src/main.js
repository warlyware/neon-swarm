import * as THREE from "three";
import "./style.css";

const canvas = document.querySelector("#game");
const ui = {
  score: document.querySelector("#score"),
  stage: document.querySelector("#stage"),
  lives: document.querySelector("#lives"),
  power: document.querySelector("#power-status"),
  powerName: document.querySelector("#power-name"),
  powerIcon: document.querySelector("#power-icon"),
  powerMeter: document.querySelector("#power-meter"),
  start: document.querySelector("#start-screen"),
  startButton: document.querySelector("#start-button"),
  message: document.querySelector("#message-screen"),
  messageKicker: document.querySelector("#message-kicker"),
  messageTitle: document.querySelector("#message-title"),
  messageCopy: document.querySelector("#message-copy"),
  gameOver: document.querySelector("#game-over-screen"),
  finalScore: document.querySelector("#final-score"),
  finalStage: document.querySelector("#final-stage"),
  restart: document.querySelector("#restart-button"),
  sound: document.querySelector("#sound-toggle"),
  pause: document.querySelector("#pause-toggle"),
  flash: document.querySelector("#flash"),
};

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x080315, 0.025);
const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.1, 160);
camera.position.set(0, 2, 30);
camera.lookAt(0, 2, 0);

const world = new THREE.Group();
scene.add(world);

const COLORS = {
  cyan: 0x23e8ff,
  pink: 0xff2da8,
  violet: 0x8754ff,
  yellow: 0xffe66d,
  orange: 0xff8a3d,
  dark: 0x120528,
  white: 0xffffff,
};

const state = {
  mode: "title",
  paused: false,
  sound: true,
  score: 0,
  stage: 1,
  lives: 3,
  stageTimer: 0,
  formationTime: 0,
  enemyFireTimer: 1,
  power: null,
  powerTime: 0,
  powerMax: 0,
  shake: 0,
};

const keys = new Set();
const enemies = [];
const playerShots = [];
const enemyShots = [];
const powerups = [];
const particles = [];
let player;
let audio;
let pointerDown = false;
let pointerX = 0;
let pointerY = 0;

function mat(color, emissive = color, intensity = 1.4) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: intensity,
    metalness: 0.55,
    roughness: 0.24,
  });
}

const materials = {
  cyan: mat(COLORS.cyan),
  pink: mat(COLORS.pink),
  violet: mat(COLORS.violet),
  yellow: mat(COLORS.yellow),
  orange: mat(COLORS.orange),
  dark: mat(COLORS.dark, 0x210743, 0.65),
  white: mat(COLORS.white, COLORS.cyan, 0.7),
  enemyShot: new THREE.MeshBasicMaterial({ color: COLORS.pink }),
  playerShot: new THREE.MeshBasicMaterial({ color: COLORS.cyan }),
};

scene.add(new THREE.HemisphereLight(0x7030ff, 0x07020f, 1.4));
const keyLight = new THREE.PointLight(COLORS.cyan, 28, 42);
keyLight.position.set(-10, -3, 12);
scene.add(keyLight);
const rimLight = new THREE.PointLight(COLORS.pink, 35, 45);
rimLight.position.set(12, 9, 8);
scene.add(rimLight);

function createBackdrop() {
  const starsGeo = new THREE.BufferGeometry();
  const positions = [];
  const colors = [];
  for (let i = 0; i < 900; i++) {
    positions.push((Math.random() - 0.5) * 90, (Math.random() - 0.3) * 85, -8 - Math.random() * 65);
    const c = new THREE.Color(Math.random() > 0.73 ? COLORS.pink : COLORS.cyan);
    colors.push(c.r, c.g, c.b);
  }
  starsGeo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  starsGeo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const stars = new THREE.Points(starsGeo, new THREE.PointsMaterial({
    size: 0.105,
    transparent: true,
    opacity: 0.86,
    vertexColors: true,
    sizeAttenuation: true,
  }));
  stars.name = "stars";
  scene.add(stars);

  const sun = new THREE.Mesh(
    new THREE.CircleGeometry(5.4, 64),
    new THREE.MeshBasicMaterial({ color: 0xff477e, transparent: true, opacity: 0.65 })
  );
  sun.position.set(0, 7, -35);
  scene.add(sun);

  for (let i = 0; i < 6; i++) {
    const bar = new THREE.Mesh(
      new THREE.PlaneGeometry(11.5, 0.14 + i * 0.03),
      new THREE.MeshBasicMaterial({ color: 0x080315 })
    );
    bar.position.set(0, 4 + i * 0.9, -34.8);
    scene.add(bar);
  }

  const grid = new THREE.GridHelper(100, 34, COLORS.pink, 0x3d1978);
  grid.position.set(0, -11.2, -18);
  grid.material.transparent = true;
  grid.material.opacity = 0.42;
  scene.add(grid);

  const horizon = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-50, -7.7, -18), new THREE.Vector3(50, -7.7, -18)]),
    new THREE.LineBasicMaterial({ color: COLORS.cyan, transparent: true, opacity: 0.6 })
  );
  scene.add(horizon);
}
createBackdrop();

function createPlayer() {
  const ship = new THREE.Group();
  const extrude = (shape, material, depth = 0.22, bevel = 0.06) => {
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: bevel,
      bevelThickness: bevel,
      curveSegments: 2,
    });
    geometry.translate(0, 0, -depth / 2);
    return new THREE.Mesh(geometry, material);
  };

  // A long, arrow-like fuselage gives the ship a readable arcade silhouette.
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(0, 1.85);
  bodyShape.lineTo(0.5, 0.72);
  bodyShape.lineTo(0.43, -0.82);
  bodyShape.lineTo(0.22, -1.35);
  bodyShape.lineTo(-0.22, -1.35);
  bodyShape.lineTo(-0.43, -0.82);
  bodyShape.lineTo(-0.5, 0.72);
  bodyShape.closePath();
  const body = extrude(bodyShape, materials.cyan, 0.42, 0.08);
  body.position.z = 0.08;
  ship.add(body);

  // Swept wings are separate armored panels, with a deep notch at the tail.
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0.3, 0.72);
  wingShape.lineTo(1.08, 0.45);
  wingShape.lineTo(2.2, -0.92);
  wingShape.lineTo(1.3, -0.72);
  wingShape.lineTo(0.72, -1.32);
  wingShape.lineTo(0.34, -0.9);
  wingShape.closePath();
  const rightWing = extrude(wingShape, materials.violet, 0.24, 0.055);
  rightWing.position.z = -0.08;
  ship.add(rightWing);
  const leftWing = rightWing.clone();
  leftWing.scale.x = -1;
  ship.add(leftWing);

  // Bright leading-edge strips keep the wing shape visible against the grid.
  [-1, 1].forEach((side) => {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 1.72, 0.12),
      materials.pink
    );
    rail.position.set(side * 1.38, -0.08, 0.13);
    rail.rotation.z = side * -0.68;
    ship.add(rail);

    const wingTip = new THREE.Mesh(
      new THREE.ConeGeometry(0.17, 0.72, 4),
      materials.cyan
    );
    wingTip.position.set(side * 1.85, -0.57, 0.12);
    wingTip.rotation.z = Math.PI;
    wingTip.rotation.y = Math.PI / 4;
    ship.add(wingTip);
  });

  // Raised glass canopy with a hot-pink internal glow.
  const canopyMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x28115e,
    emissive: COLORS.pink,
    emissiveIntensity: 1.25,
    metalness: 0.15,
    roughness: 0.08,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
  });
  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.46, 20, 12), canopyMaterial);
  cockpit.scale.set(0.68, 1.35, 0.46);
  cockpit.position.set(0, 0.34, 0.48);
  ship.add(cockpit);

  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.45, 0.09), materials.white);
  spine.position.set(0, -0.42, 0.5);
  ship.add(spine);

  const thrusters = [];
  [-0.62, 0.62].forEach((x) => {
    const housing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.31, 0.7, 8),
      materials.dark
    );
    housing.position.set(x, -1.03, 0.02);
    ship.add(housing);

    const nozzle = new THREE.Mesh(
      new THREE.TorusGeometry(0.23, 0.075, 6, 12),
      materials.pink
    );
    nozzle.position.set(x, -1.38, 0.02);
    nozzle.rotation.x = Math.PI / 2;
    ship.add(nozzle);

    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 0.92, 8, 1, true),
      new THREE.MeshBasicMaterial({
        color: COLORS.cyan,
        transparent: true,
        opacity: 0.82,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    flame.position.set(x, -1.84, 0.02);
    flame.rotation.z = Math.PI;
    ship.add(flame);
    thrusters.push(flame);
  });

  // Twin forward cannons line up with the existing two-shot firing pattern.
  [-0.62, 0.62].forEach((x) => {
    const cannon = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.82, 0.18), materials.white);
    cannon.position.set(x, 0.83, 0.23);
    ship.add(cannon);
    const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.12, 0.24), materials.pink);
    muzzle.position.set(x, 1.25, 0.23);
    ship.add(muzzle);
  });

  const engineLight = new THREE.PointLight(COLORS.cyan, 6.5, 5.5);
  engineLight.position.set(0, -1.5, 0.7);
  ship.add(engineLight);

  ship.scale.setScalar(1 / 3);
  ship.position.set(0, -8, 0);
  ship.userData = {
    radius: 0.35,
    fireTimer: 0,
    invulnerable: 0,
    velocityX: 0,
    velocityY: 0,
    thrusters,
    engineLight,
  };
  world.add(ship);
  return ship;
}

function createEnemy(type, row, col) {
  const enemy = new THREE.Group();
  const primary = {
    ace: materials.yellow,
    guard: materials.pink,
    scout: materials.violet,
    bomber: materials.orange,
    phantom: materials.cyan,
    lancer: materials.white,
  }[type];

  const coreGeometry = type === "bomber"
    ? new THREE.DodecahedronGeometry(0.68, 0)
    : type === "phantom"
      ? new THREE.TetrahedronGeometry(0.7, 0)
      : new THREE.OctahedronGeometry(type === "ace" ? 0.7 : 0.58, 0);
  const core = new THREE.Mesh(coreGeometry, primary);
  core.scale.y = 1.2;
  enemy.add(core);

  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0.3);
  wingShape.lineTo(1.15, 0.75);
  wingShape.lineTo(0.82, -0.55);
  wingShape.lineTo(0, -0.25);
  const wing = new THREE.Mesh(new THREE.ShapeGeometry(wingShape), materials.dark);
  wing.position.z = -0.03;
  enemy.add(wing);
  const wing2 = wing.clone();
  wing2.scale.x = -1;
  enemy.add(wing2);

  const eye = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.13, 0.22), materials.cyan);
  eye.position.set(0, -0.08, 0.58);
  enemy.add(eye);

  if (type === "bomber") {
    [-0.92, 0.92].forEach((x) => {
      const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.9, 8), materials.dark);
      pod.position.set(x, -0.28, 0.05);
      enemy.add(pod);
      const port = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.055, 5, 10), materials.orange);
      port.position.set(x, -0.72, 0.06);
      port.rotation.x = Math.PI / 2;
      enemy.add(port);
    });
  } else if (type === "phantom") {
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.07, 6, 18), materials.cyan);
    halo.scale.y = 0.55;
    halo.position.z = -0.05;
    enemy.add(halo);
  } else if (type === "lancer") {
    const lance = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.35, 5), materials.white);
    lance.position.set(0, -0.72, 0.1);
    lance.rotation.z = Math.PI;
    enemy.add(lance);
  }

  const hp = {
    ace: 3 + Math.floor(state.stage / 3),
    guard: 2,
    scout: 1,
    bomber: 5 + Math.floor(state.stage / 4),
    phantom: 1,
    lancer: 3,
  }[type];
  const scale = { ace: 1.08, guard: 0.88, scout: 0.88, bomber: 1.18, phantom: 0.82, lancer: 0.92 }[type];
  enemy.scale.setScalar(scale);
  enemy.userData = {
    type,
    row,
    col,
    homeX: 0,
    homeY: 0,
    radius: type === "bomber" ? 0.95 : type === "phantom" ? 0.62 : 0.72,
    hp,
    maxHp: hp,
    phase: Math.random() * Math.PI * 2,
    diving: false,
    diveT: 0,
    diveStart: new THREE.Vector3(),
  };
  world.add(enemy);
  enemies.push(enemy);
  return enemy;
}

function spawnStage() {
  clearEntities();
  state.formationTime = 0;
  state.enemyFireTimer = Math.max(0.36, 1.3 - state.stage * 0.065);
  const rows = Math.min(5, 3 + Math.floor(state.stage / 2));
  const cols = Math.min(10, 6 + state.stage);
  const spacingX = Math.min(2.65, 17 / (cols - 1));

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (state.stage < 3 && row === rows - 1 && (col === 0 || col === cols - 1)) continue;
      let type = row === 0 ? "ace" : row < 3 ? "guard" : "scout";
      if (state.stage >= 2 && row === 1 && col % 4 === 1) type = "bomber";
      if (state.stage >= 3 && row === rows - 1 && col % 3 === 0) type = "phantom";
      if (state.stage >= 4 && row === 2 && col % 3 === 2) type = "lancer";
      const e = createEnemy(type, row, col);
      e.userData.homeX = (col - (cols - 1) / 2) * spacingX;
      e.userData.homeY = 7.6 - row * 2.05;
      e.position.set(e.userData.homeX, 18 + row * 2, 0);
    }
  }
}

function clearEntities() {
  [...enemies, ...playerShots, ...enemyShots, ...powerups, ...particles].forEach((o) => world.remove(o));
  enemies.length = playerShots.length = enemyShots.length = powerups.length = particles.length = 0;
}

function shootPlayer() {
  if (!player || player.userData.fireTimer > 0 || state.mode !== "playing") return;
  const strong = state.power === "overdrive";
  const spread = strong ? [-0.34, 0, 0.34] : [-0.21, 0.21];
  spread.forEach((offset, index) => {
    if (!strong && index > 1) return;
    const shot = new THREE.Mesh(new THREE.BoxGeometry(0.12, strong ? 0.95 : 0.7, 0.14), materials.playerShot);
    shot.position.set(player.position.x + offset, player.position.y + 0.52, 0);
    shot.userData = { vy: strong ? 21 : 18, damage: strong ? 2 : 1, radius: 0.24 };
    world.add(shot);
    playerShots.push(shot);
  });
  player.userData.fireTimer = strong ? 0.12 : 0.22;
  sfx("shoot");
}

function shootEnemy(enemy) {
  const type = enemy.userData.type;
  const count = type === "bomber" ? 5 : type === "lancer" ? 2 : state.stage >= 5 && type === "ace" ? 3 : 1;
  for (let i = 0; i < count; i++) {
    const shot = new THREE.Mesh(
      type === "bomber" ? new THREE.BoxGeometry(0.22, 0.32, 0.18) : new THREE.IcosahedronGeometry(0.17, 0),
      materials.enemyShot
    );
    shot.position.copy(enemy.position);
    const spread = type === "bomber" ? 2.2 : type === "lancer" ? 1.3 : 3.2;
    const targetX = player.position.x - enemy.position.x + (i - (count - 1) / 2) * spread;
    const targetY = player.position.y - enemy.position.y;
    const len = Math.hypot(targetX, targetY);
    const speed = (type === "lancer" ? 9.2 : type === "bomber" ? 4.4 : 5.6) + state.stage * 0.42;
    shot.userData = { vx: targetX / len * speed, vy: targetY / len * speed, radius: type === "bomber" ? 0.28 : 0.23 };
    world.add(shot);
    enemyShots.push(shot);
  }
  sfx("enemy");
}

function spawnPowerup(position) {
  const kinds = [
    { type: "overdrive", color: COLORS.yellow, icon: "⚡", name: "TRIPLE OVERDRIVE" },
    { type: "chrono", color: COLORS.cyan, icon: "◷", name: "CHRONO FIELD" },
    { type: "shield", color: COLORS.pink, icon: "◇", name: "PHASE SHIELD" },
  ];
  const kind = kinds[Math.floor(Math.random() * kinds.length)];
  const group = new THREE.Group();
  const outer = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.1, 8, 6),
    mat(kind.color)
  );
  outer.rotation.z = Math.PI / 6;
  group.add(outer);
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.27), mat(0xffffff, kind.color, 2.2));
  group.add(core);
  group.position.copy(position);
  group.userData = { ...kind, radius: 0.68, vy: -2.3, phase: 0 };
  world.add(group);
  powerups.push(group);
}

function activatePowerup(p) {
  state.power = p.userData.type;
  state.powerMax = p.userData.type === "shield" ? 9 : 11;
  state.powerTime = state.powerMax;
  ui.powerName.textContent = p.userData.name;
  ui.powerIcon.textContent = p.userData.icon;
  ui.power.style.color = `#${p.userData.color.toString(16).padStart(6, "0")}`;
  ui.power.classList.remove("hidden");
  burst(p.position, p.userData.color, 28);
  sfx("power");
}

function burst(position, color, count = 14) {
  for (let i = 0; i < count; i++) {
    const particle = new THREE.Mesh(
      new THREE.TetrahedronGeometry(0.08 + Math.random() * 0.1),
      new THREE.MeshBasicMaterial({ color, transparent: true })
    );
    particle.position.copy(position);
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 7;
    particle.userData = {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      vz: (Math.random() - 0.5) * 4,
      life: 0.45 + Math.random() * 0.6,
      maxLife: 1.05,
    };
    world.add(particle);
    particles.push(particle);
  }
}

function hitPlayer() {
  if (player.userData.invulnerable > 0 || state.mode !== "playing") return;
  if (state.power === "shield") {
    state.powerTime = 0;
    burst(player.position, COLORS.pink, 22);
    state.shake = 0.22;
    sfx("power");
    return;
  }
  state.lives--;
  updateHud();
  player.userData.invulnerable = 2.2;
  player.visible = false;
  state.shake = 0.55;
  burst(player.position, COLORS.cyan, 35);
  flash();
  sfx("explode");
  setTimeout(() => {
    if (state.lives > 0 && state.mode === "playing") {
      player.position.set(0, -8, 0);
      player.userData.velocityX = 0;
      player.userData.velocityY = 0;
      player.visible = true;
    }
  }, 700);
  if (state.lives <= 0) setTimeout(endGame, 900);
}

function killEnemy(enemy, shot) {
  enemy.userData.hp -= shot.userData.damage;
  burst(shot.position, enemy.userData.hp <= 0 ? COLORS.pink : COLORS.cyan, enemy.userData.hp <= 0 ? 16 : 5);
  if (enemy.userData.hp > 0) {
    enemy.scale.multiplyScalar(0.94);
    sfx("hit");
    return;
  }
  const points = {
    ace: 500,
    guard: 250,
    scout: 120,
    bomber: 750,
    phantom: 400,
    lancer: 600,
  }[enemy.userData.type];
  state.score += points * state.stage;
  updateHud();
  state.shake = 0.13;
  sfx("explode");
  if (Math.random() < Math.min(0.22, 0.075 + state.stage * 0.008)) spawnPowerup(enemy.position);
  world.remove(enemy);
  enemies.splice(enemies.indexOf(enemy), 1);
  if (enemies.length === 0) completeStage();
}

function completeStage() {
  state.mode = "transition";
  state.score += 1000 * state.stage;
  updateHud();
  showMessage("WAVE ERASED", `STAGE ${String(state.stage).padStart(2, "0")} CLEAR`, `BONUS +${1000 * state.stage}`, 1700);
  setTimeout(() => {
    if (state.mode !== "transition") return;
    state.stage++;
    updateHud();
    showMessage("WARNING // THREAT RISING", `STAGE ${String(state.stage).padStart(2, "0")}`, stageSubtitle(), 1500);
    setTimeout(() => {
      if (state.mode !== "transition") return;
      spawnStage();
      state.mode = "playing";
      ui.message.classList.remove("visible");
    }, 1500);
  }, 1750);
}

function stageSubtitle() {
  if (state.stage < 3) return "ENEMY VELOCITY INCREASED";
  if (state.stage < 5) return "DIVE SQUADS DETECTED";
  if (state.stage < 8) return "MULTI-SHOT SIGNATURES DETECTED";
  return "MAXIMUM HOSTILITY";
}

function showMessage(kicker, title, copy) {
  ui.messageKicker.textContent = kicker;
  ui.messageTitle.textContent = title;
  ui.messageCopy.textContent = copy;
  ui.message.classList.add("visible");
}

function updateHud() {
  ui.score.textContent = String(state.score).padStart(6, "0");
  ui.stage.textContent = String(state.stage).padStart(2, "0");
  ui.lives.textContent = Array(Math.max(0, state.lives)).fill("◆").join(" ");
  ui.lives.setAttribute("aria-label", `${state.lives} lives`);
}

function resetGame() {
  clearEntities();
  if (player) world.remove(player);
  Object.assign(state, {
    mode: "transition",
    paused: false,
    score: 0,
    stage: 1,
    lives: 3,
    formationTime: 0,
    power: null,
    powerTime: 0,
    shake: 0,
  });
  player = createPlayer();
  ui.power.classList.add("hidden");
  ui.start.classList.remove("visible");
  ui.gameOver.classList.remove("visible");
  ui.pause.textContent = "PAUSE";
  updateHud();
  initAudio();
  showMessage("SYSTEM ONLINE", "STAGE 01", "THE FIRST WAVE APPROACHES");
  setTimeout(() => {
    if (state.mode !== "transition") return;
    spawnStage();
    state.mode = "playing";
    ui.message.classList.remove("visible");
  }, 1450);
}

function endGame() {
  if (state.mode === "gameover") return;
  state.mode = "gameover";
  ui.finalScore.textContent = String(state.score).padStart(6, "0");
  ui.finalStage.textContent = String(Math.max(0, state.stage - (enemies.length ? 1 : 0))).padStart(2, "0");
  ui.gameOver.classList.add("visible");
}

function togglePause() {
  if (!["playing", "paused"].includes(state.mode)) return;
  state.paused = !state.paused;
  state.mode = state.paused ? "paused" : "playing";
  ui.pause.textContent = state.paused ? "RESUME" : "PAUSE";
  if (state.paused) showMessage("SIGNAL SUSPENDED", "PAUSED", "PRESS P TO RETURN");
  else ui.message.classList.remove("visible");
}

function flash() {
  ui.flash.classList.remove("active");
  void ui.flash.offsetWidth;
  ui.flash.classList.add("active");
}

function initAudio() {
  if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
  if (audio.state === "suspended") audio.resume();
}

function sfx(kind) {
  if (!state.sound || !audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.connect(gain);
  gain.connect(audio.destination);
  const now = audio.currentTime;
  const settings = {
    shoot: [620, 1100, 0.045, "square", 0.025],
    enemy: [180, 90, 0.09, "sawtooth", 0.018],
    hit: [130, 65, 0.08, "square", 0.03],
    explode: [95, 28, 0.28, "sawtooth", 0.07],
    power: [320, 1280, 0.45, "sine", 0.06],
  }[kind];
  osc.type = settings[3];
  osc.frequency.setValueAtTime(settings[0], now);
  osc.frequency.exponentialRampToValueAtTime(settings[1], now + settings[2]);
  gain.gain.setValueAtTime(settings[4], now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + settings[2]);
  osc.start(now);
  osc.stop(now + settings[2]);
}

function removeAt(array, index) {
  world.remove(array[index]);
  array.splice(index, 1);
}

function intersects(a, b) {
  const dx = a.position.x - b.position.x;
  const dy = a.position.y - b.position.y;
  const radius = a.userData.radius + b.userData.radius;
  return dx * dx + dy * dy < radius * radius;
}

function updatePlayer(dt) {
  const movingLeft = keys.has("ArrowLeft") || keys.has("KeyA");
  const movingRight = keys.has("ArrowRight") || keys.has("KeyD");
  const movingUp = keys.has("ArrowUp") || keys.has("KeyW");
  const movingDown = keys.has("ArrowDown") || keys.has("KeyS");
  let targetVelocityX = ((movingRight ? 1 : 0) - (movingLeft ? 1 : 0)) * 12;
  let targetVelocityY = ((movingUp ? 1 : 0) - (movingDown ? 1 : 0)) * 10;
  if (pointerDown) {
    const targetX = pointerX * 13.3;
    const targetY = THREE.MathUtils.clamp(pointerY * 11 - 2.5, -10, 4);
    targetVelocityX = THREE.MathUtils.clamp((targetX - player.position.x) * 8, -16, 16);
    targetVelocityY = THREE.MathUtils.clamp((targetY - player.position.y) * 8, -13, 13);
  }
  player.userData.velocityX = THREE.MathUtils.lerp(player.userData.velocityX, targetVelocityX, 1 - Math.exp(-dt * 11));
  player.userData.velocityY = THREE.MathUtils.lerp(player.userData.velocityY, targetVelocityY, 1 - Math.exp(-dt * 11));
  player.position.x = THREE.MathUtils.clamp(player.position.x + player.userData.velocityX * dt, -13.2, 13.2);
  player.position.y = THREE.MathUtils.clamp(player.position.y + player.userData.velocityY * dt, -10.2, 4);
  player.rotation.y = THREE.MathUtils.lerp(player.rotation.y, -player.userData.velocityX * 0.035, 1 - Math.exp(-dt * 9));
  player.rotation.z = THREE.MathUtils.lerp(player.rotation.z, -player.userData.velocityX * 0.018, 1 - Math.exp(-dt * 9));
  player.rotation.x = THREE.MathUtils.lerp(player.rotation.x, player.userData.velocityY * 0.014, 1 - Math.exp(-dt * 9));
  const thrustPulse = 0.82 + Math.sin(clock.elapsedTime * 28) * 0.14 + Math.abs(player.userData.velocityX) * 0.012;
  player.userData.thrusters.forEach((flame, index) => {
    flame.scale.set(0.9 + thrustPulse * 0.14, thrustPulse + index * 0.03, 0.9 + thrustPulse * 0.14);
    flame.material.opacity = 0.55 + thrustPulse * 0.24;
  });
  player.userData.engineLight.intensity = 5.5 + thrustPulse * 2.3;
  player.userData.fireTimer -= dt;
  player.userData.invulnerable -= dt;
  if (player.userData.invulnerable > 0) player.visible = Math.floor(player.userData.invulnerable * 12) % 2 === 0;
  else player.visible = true;
  if (keys.has("Space") || pointerDown) shootPlayer();
}

function updateEnemies(dt) {
  const slow = state.power === "chrono" ? 0.48 : 1;
  const enemyDt = dt * slow;
  state.formationTime += enemyDt;
  state.enemyFireTimer -= enemyDt;
  const entrance = Math.min(1, state.formationTime / 1.65);
  const ease = 1 - Math.pow(1 - entrance, 3);
  const sway = Math.sin(state.formationTime * (0.7 + state.stage * 0.025)) * Math.min(2.2, 0.75 + state.stage * 0.12);

  for (const enemy of enemies) {
    const d = enemy.userData;
    d.phase += enemyDt * 2.5;
    if (!d.diving) {
      const phantomDrift = d.type === "phantom" ? Math.sin(d.phase * 2.4) * 1.35 : 0;
      enemy.position.x = d.homeX + sway + Math.sin(d.phase) * 0.09 + phantomDrift;
      enemy.position.y = THREE.MathUtils.lerp(18 + d.row * 2, d.homeY + Math.sin(d.phase * 0.65) * 0.12, ease);
      enemy.rotation.z = Math.sin(d.phase) * 0.12;
      enemy.rotation.y = Math.sin(d.phase * 0.7) * 0.24;
      if (d.type === "phantom") enemy.visible = Math.sin(d.phase * 3.1) > -0.72;
    } else {
      const diveMultiplier = d.type === "phantom" ? 1.65 : d.type === "lancer" ? 1.3 : d.type === "bomber" ? 0.72 : 1;
      d.diveT += enemyDt * (0.21 + state.stage * 0.009) * diveMultiplier;
      const t = d.diveT;
      const curveWidth = d.type === "lancer" ? 2.4 : 5 + d.row;
      const targetX = d.diveStart.x + Math.sin(t * Math.PI * 2) * curveWidth;
      enemy.position.x = THREE.MathUtils.lerp(d.diveStart.x, targetX, Math.min(1, t * 1.5));
      enemy.position.y = d.diveStart.y - t * 27;
      enemy.rotation.z = Math.sin(t * Math.PI * 2) * 1.3;
      if (enemy.position.y < -13) {
        d.diving = false;
        d.diveT = 0;
        enemy.position.set(d.homeX, 14, 0);
        enemy.visible = true;
      }
    }
    if (intersects(enemy, player)) {
      hitPlayer();
      if (d.diving) {
        burst(enemy.position, COLORS.pink, 18);
        world.remove(enemy);
        enemies.splice(enemies.indexOf(enemy), 1);
        break;
      }
    }
  }

  if (entrance >= 1 && enemies.length) {
    if (state.enemyFireTimer <= 0) {
      const candidates = enemies.filter((e) => e.position.y > -3);
      if (candidates.length) shootEnemy(candidates[Math.floor(Math.random() * candidates.length)]);
      state.enemyFireTimer = Math.max(0.28, 1.22 - state.stage * 0.06) * (0.72 + Math.random() * 0.7);
    }
    const diving = enemies.filter((e) => e.userData.diving).length;
    const maxDivers = Math.min(4, 1 + Math.floor(state.stage / 3));
    if (diving < maxDivers && Math.random() < dt * (0.15 + state.stage * 0.055)) {
      const candidates = enemies.filter((e) => !e.userData.diving && e.userData.row <= 2);
      const e = candidates[Math.floor(Math.random() * candidates.length)];
      if (e) {
        e.userData.diving = true;
        e.userData.diveT = 0;
        e.userData.diveStart.copy(e.position);
      }
    }
  }
}

function updateProjectiles(dt) {
  for (let i = playerShots.length - 1; i >= 0; i--) {
    const shot = playerShots[i];
    shot.position.y += shot.userData.vy * dt;
    let hit = false;
    for (let j = enemies.length - 1; j >= 0; j--) {
      if (intersects(shot, enemies[j])) {
        killEnemy(enemies[j], shot);
        hit = true;
        break;
      }
    }
    if (hit || shot.position.y > 14) removeAt(playerShots, i);
  }

  for (let i = enemyShots.length - 1; i >= 0; i--) {
    const shot = enemyShots[i];
    shot.position.x += shot.userData.vx * dt;
    shot.position.y += shot.userData.vy * dt;
    shot.rotation.x += dt * 7;
    if (intersects(shot, player)) {
      hitPlayer();
      removeAt(enemyShots, i);
    } else if (shot.position.y < -13 || Math.abs(shot.position.x) > 17) {
      removeAt(enemyShots, i);
    }
  }
}

function updatePowerups(dt) {
  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];
    p.userData.phase += dt;
    p.position.y += p.userData.vy * dt;
    p.rotation.z += dt * 1.8;
    p.scale.setScalar(1 + Math.sin(p.userData.phase * 6) * 0.08);
    if (intersects(p, player)) {
      activatePowerup(p);
      removeAt(powerups, i);
    } else if (p.position.y < -13) removeAt(powerups, i);
  }
  if (state.power) {
    state.powerTime -= dt;
    ui.powerMeter.style.width = `${Math.max(0, state.powerTime / state.powerMax) * 100}%`;
    if (state.powerTime <= 0) {
      state.power = null;
      ui.power.classList.add("hidden");
    }
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.userData.life -= dt;
    p.position.x += p.userData.vx * dt;
    p.position.y += p.userData.vy * dt;
    p.position.z += p.userData.vz * dt;
    p.userData.vx *= Math.pow(0.965, dt * 60);
    p.userData.vy *= Math.pow(0.965, dt * 60);
    p.rotation.x += dt * 8;
    p.material.opacity = Math.max(0, p.userData.life / p.userData.maxLife);
    if (p.userData.life <= 0) removeAt(particles, i);
  }
}

function updateBackdrop(dt, elapsed) {
  const stars = scene.getObjectByName("stars");
  if (stars) {
    stars.rotation.z = Math.sin(elapsed * 0.06) * 0.025;
    const pos = stars.geometry.attributes.position;
    for (let i = 1; i < pos.count * 3; i += 3) {
      pos.array[i] -= dt * (0.55 + (i % 7) * 0.05);
      if (pos.array[i] < -30) pos.array[i] = 45;
    }
    pos.needsUpdate = true;
  }
}

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.033);
  const elapsed = clock.elapsedTime;
  updateBackdrop(dt, elapsed);
  if (state.mode === "playing") {
    updatePlayer(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updatePowerups(dt);
    updateParticles(dt);
  } else if (state.mode === "transition") {
    updateParticles(dt);
  }

  if (state.shake > 0) {
    state.shake -= dt;
    camera.position.x = (Math.random() - 0.5) * state.shake;
    camera.position.y = 2 + (Math.random() - 0.5) * state.shake;
  } else {
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, 0.12);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 2, 0.12);
  }
  renderer.render(scene, camera);
}
animate();

addEventListener("keydown", (event) => {
  keys.add(event.code);
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(event.code)) event.preventDefault();
  if (event.code === "KeyP" && !event.repeat) togglePause();
});
addEventListener("keyup", (event) => keys.delete(event.code));
canvas.addEventListener("pointerdown", (event) => {
  if (state.mode !== "playing") return;
  pointerDown = true;
  pointerX = event.clientX / innerWidth * 2 - 1;
  pointerY = 1 - event.clientY / innerHeight * 2;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", (event) => {
  pointerX = event.clientX / innerWidth * 2 - 1;
  pointerY = 1 - event.clientY / innerHeight * 2;
});
canvas.addEventListener("pointerup", () => { pointerDown = false; });
canvas.addEventListener("pointercancel", () => { pointerDown = false; });

ui.startButton.addEventListener("click", resetGame);
ui.restart.addEventListener("click", resetGame);
ui.pause.addEventListener("click", togglePause);
ui.sound.addEventListener("click", () => {
  state.sound = !state.sound;
  ui.sound.textContent = `SOUND: ${state.sound ? "ON" : "OFF"}`;
  if (state.sound) initAudio();
});

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && state.mode === "playing") togglePause();
});
