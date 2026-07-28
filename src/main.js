import * as THREE from "three";
import "@fontsource/chakra-petch/latin-400.css";
import "@fontsource/chakra-petch/latin-600.css";
import "@fontsource/chakra-petch/latin-700.css";
import "@fontsource/orbitron/latin-700.css";
import "@fontsource/orbitron/latin-900.css";
import "./style.css";

const canvas = document.querySelector("#game");
const ui = {
  score: document.querySelector("#score"),
  stage: document.querySelector("#stage"),
  lives: document.querySelector("#lives"),
  power: document.querySelector("#power-status"),
  powerList: document.querySelector("#power-list"),
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
  leaderboard: document.querySelector("#leaderboard-panel"),
  leaderboardButton: document.querySelector("#leaderboard-button"),
  gameOverLeaderboardButton: document.querySelector("#game-over-leaderboard-button"),
  leaderboardClose: document.querySelector("#leaderboard-close"),
  leaderboardStatus: document.querySelector("#leaderboard-status"),
  leaderboardList: document.querySelector("#leaderboard-list"),
  leaderboardSignIn: document.querySelector("#leaderboard-sign-in"),
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

const POWER_DEFS = {
  overdrive: { type: "overdrive", color: COLORS.yellow, icon: "⚡", name: "TRIPLE OVERDRIVE", duration: 11 },
  chrono: { type: "chrono", color: COLORS.cyan, icon: "◷", name: "CHRONO FIELD", duration: 11 },
  shield: { type: "shield", color: COLORS.pink, icon: "◇", name: "PHASE SHIELD", duration: 9 },
};
const EXTRA_SHIP_POWER = {
  type: "extra-ship",
  color: COLORS.white,
  icon: "◆",
  name: "EXTRA SHIP",
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
  powers: { overdrive: 0, chrono: 0, shield: 0 },
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
let portalsReady = false;
let portalsPlayer = null;

function mat(color, emissive = color, intensity = 1.4) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: intensity,
    metalness: 0.55,
    roughness: 0.24,
  });
}

function projectileGlowMaterial(color) {
  return new THREE.ShaderMaterial({
    uniforms: { glowColor: { value: new THREE.Color(color) } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      varying vec2 vUv;
      void main() {
        float radius = length((vUv - 0.5) * 2.0);
        float alpha = pow(max(0.0, 1.0 - radius), 2.0) * 0.72;
        gl_FragColor = vec4(glowColor, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

const materials = {
  cyan: mat(COLORS.cyan),
  pink: mat(COLORS.pink),
  violet: mat(COLORS.violet),
  yellow: mat(COLORS.yellow),
  orange: mat(COLORS.orange),
  dark: mat(COLORS.dark, 0x210743, 0.65),
  enemyWing: mat(0x6c55b3, 0x3f2384, 0.72),
  white: mat(COLORS.white, COLORS.cyan, 0.7),
  enemyShot: new THREE.MeshBasicMaterial({ color: COLORS.pink }),
  playerShot: new THREE.MeshBasicMaterial({ color: COLORS.cyan }),
  enemyShotGlow: projectileGlowMaterial(COLORS.pink),
  playerShotGlow: projectileGlowMaterial(COLORS.cyan),
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
  for (let i = 0; i < 4500; i++) {
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
  const pearl = mat(0xe5e2ff, 0x6763a8, 0.42);
  const violet = mat(0x624db7, 0x37217d, 0.72);
  const blue = mat(0x2779d8, 0x0757bc, 0.92);

  // A single shallow chevron supplies the complete wing silhouette.
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0.72);
  wingShape.lineTo(1.85, -0.92);
  wingShape.lineTo(0.58, -0.62);
  wingShape.lineTo(0, -1.2);
  wingShape.lineTo(-0.58, -0.62);
  wingShape.lineTo(-1.85, -0.92);
  wingShape.closePath();
  const wingGeometry = new THREE.ExtrudeGeometry(wingShape, {
    depth: 0.2,
    bevelEnabled: false,
  });
  wingGeometry.translate(0, 0, -0.12);
  ship.add(new THREE.Mesh(wingGeometry, violet));

  // The entire body is one low-poly arrow, capped by one simple cockpit.
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.58, 3.25, 4), pearl);
  body.rotation.y = Math.PI / 4;
  body.position.set(0, 0.15, 0.22);
  ship.add(body);

  const cockpit = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 0), blue);
  cockpit.scale.set(0.72, 1.05, 0.55);
  cockpit.position.set(0, 0.36, 0.58);
  ship.add(cockpit);

  const exhaust = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.82, 0.2),
    new THREE.MeshBasicMaterial({
      color: 0x65f5ff,
      transparent: true,
      opacity: 0.86,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  exhaust.position.set(0, -1.72, 0.02);
  ship.add(exhaust);
  const thrusters = [exhaust];

  const engineLight = new THREE.PointLight(0x42e8ff, 5, 4);
  engineLight.position.set(0, -1.35, 0.45);
  ship.add(engineLight);

  ship.scale.setScalar(0.45);
  ship.position.set(0, -8, 0);
  ship.userData = {
    radius: 0.55,
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
  const wing = new THREE.Mesh(new THREE.ShapeGeometry(wingShape), materials.enemyWing);
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
  state.enemyFireTimer = Math.max(0.213, 0.769 - state.stage * 0.0385);
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
  const strong = state.powers.overdrive > 0;
  const spread = strong ? [-0.36, 0, 0.36] : [-0.24, 0.24];
  spread.forEach((offset, index) => {
    if (!strong && index > 1) return;
    const shot = new THREE.Mesh(new THREE.BoxGeometry(0.12, strong ? 0.95 : 0.7, 0.14), materials.playerShot);
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.72, strong ? 1.75 : 1.4),
      materials.playerShotGlow
    );
    glow.position.z = -0.08;
    shot.add(glow);
    shot.position.set(player.position.x + offset, player.position.y + 0.76, 0);
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
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(type === "bomber" ? 0.9 : 0.72, type === "bomber" ? 1.05 : 0.72),
      materials.enemyShotGlow
    );
    glow.position.z = -0.08;
    shot.add(glow);
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
  const kinds = Object.values(POWER_DEFS);
  const kind = Math.random() < 0.1
    ? EXTRA_SHIP_POWER
    : kinds[Math.floor(Math.random() * kinds.length)];
  const group = new THREE.Group();

  const haloMaterial = new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(kind.color) },
      glowStrength: { value: 0.52 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      uniform float glowStrength;
      varying vec2 vUv;
      void main() {
        float radius = length(vUv - 0.5) * 2.0;
        float alpha = pow(max(0.0, 1.0 - radius), 2.2) * glowStrength;
        gl_FragColor = vec4(glowColor, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), haloMaterial);
  halo.position.z = -0.22;
  group.add(halo);

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: kind.color,
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const outerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.63, 0.055, 8, 28),
    ringMaterial
  );
  outerRing.rotation.z = Math.PI / 4;
  group.add(outerRing);

  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.44, 0.035, 6, 22),
    ringMaterial.clone()
  );
  innerRing.rotation.x = 1.05;
  innerRing.rotation.y = 0.35;
  group.add(innerRing);

  const coreGeometry = kind.type === "overdrive"
    ? new THREE.TetrahedronGeometry(0.36, 0)
    : kind.type === "chrono"
      ? new THREE.TorusKnotGeometry(0.23, 0.065, 40, 6)
      : kind.type === "extra-ship"
        ? new THREE.ConeGeometry(0.3, 0.72, 4)
        : new THREE.IcosahedronGeometry(0.34, 0);
  const core = new THREE.Mesh(coreGeometry, mat(0xffffff, kind.color, 2.8));
  if (kind.type === "overdrive") core.scale.y = 1.35;
  group.add(core);

  const orbit = new THREE.Group();
  [-1, 1].forEach((side) => {
    const mote = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 6, 4),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    mote.position.x = side * 0.82;
    orbit.add(mote);
  });
  group.add(orbit);

  const light = new THREE.PointLight(kind.color, 7.5, 5.5);
  light.position.z = 0.65;
  group.add(light);

  group.position.copy(position);
  group.userData = {
    ...kind,
    radius: 0.72,
    vy: -2.3,
    phase: 0,
    halo,
    outerRing,
    innerRing,
    core,
    orbit,
    light,
  };
  world.add(group);
  powerups.push(group);
}

function activatePowerup(p) {
  const type = p.userData.type;
  if (type === "extra-ship") {
    state.lives++;
    updateHud();
    burst(p.position, p.userData.color, 36);
    sfx("power");
    return;
  }
  state.powers[type] = POWER_DEFS[type].duration;
  syncPowerHud();
  burst(p.position, p.userData.color, 28);
  sfx("power");
}

function syncPowerHud() {
  const active = Object.values(POWER_DEFS).filter((power) => state.powers[power.type] > 0);
  ui.power.classList.toggle("hidden", active.length === 0);
  ui.powerList.replaceChildren(...active.map((power) => {
    const chip = document.createElement("div");
    chip.className = "power-chip";
    chip.style.setProperty("--power-color", `#${power.color.toString(16).padStart(6, "0")}`);

    const icon = document.createElement("span");
    icon.className = "power-icon";
    icon.textContent = power.icon;

    const details = document.createElement("div");
    const name = document.createElement("span");
    name.textContent = power.name;
    const meter = document.createElement("div");
    meter.className = "meter";
    const fill = document.createElement("i");
    fill.dataset.powerMeter = power.type;
    meter.append(fill);
    details.append(name, meter);
    chip.append(icon, details);
    return chip;
  }));
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
  if (state.powers.shield > 0) {
    state.powers.shield = 0;
    syncPowerHud();
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
  if (Math.random() < Math.min(0.1375, 0.046875 + state.stage * 0.005)) spawnPowerup(enemy.position);
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

function renderLeaderboard(entries = []) {
  ui.leaderboardList.replaceChildren(...entries.map((entry) => {
    const row = document.createElement("li");
    row.className = "leaderboard-entry";
    if (portalsPlayer?.playerId && entry.playerId === portalsPlayer.playerId) row.classList.add("is-player");

    const rank = document.createElement("span");
    rank.className = "leaderboard-rank";
    rank.textContent = String(entry.rank).padStart(2, "0");

    const name = document.createElement("span");
    name.className = "leaderboard-name";
    name.textContent = entry.displayName || "Anonymous Pilot";

    const score = document.createElement("span");
    score.className = "leaderboard-score";
    score.textContent = Number(entry.score).toLocaleString();

    row.append(rank, name, score);
    return row;
  }));
}

function updateLeaderboardIdentity() {
  const signedIn = Boolean(portalsPlayer?.playerId);
  ui.leaderboardSignIn.classList.toggle("hidden", signedIn || !portalsReady);
}

async function refreshLeaderboard() {
  if (!portalsReady) return;
  ui.leaderboardStatus.textContent = "RECEIVING PILOT RECORDS…";
  try {
    const board = await window.Portals.getLeaderboard({ limit: 10 });
    renderLeaderboard(board.entries || []);
    const pilot = portalsPlayer?.displayName || "SIGNED-IN PILOT";
    ui.leaderboardStatus.textContent = portalsPlayer?.playerId
      ? `CONNECTED AS ${pilot.toUpperCase()}`
      : "SIGN IN TO ADD YOUR SCORE";
  } catch (error) {
    console.error("Leaderboard could not be loaded", error);
    ui.leaderboardStatus.textContent = "LEADERBOARD SIGNAL UNAVAILABLE";
  }
  updateLeaderboardIdentity();
}

async function initializePortals() {
  if (!window.Portals) {
    ui.leaderboardStatus.textContent = "LEADERBOARD AVAILABLE ON PORTALS";
    return;
  }
  try {
    const session = await window.Portals.ready();
    portalsReady = true;
    portalsPlayer = session.player;
    window.Portals.identity.onChange((player) => {
      portalsPlayer = player;
      updateLeaderboardIdentity();
      refreshLeaderboard();
    });
    updateLeaderboardIdentity();
    await refreshLeaderboard();
  } catch (error) {
    console.error("Portals SDK is unavailable", error);
    ui.leaderboardStatus.textContent = "PORTALS HOST UNAVAILABLE";
  }
}

async function requestPortalsLogin() {
  if (!portalsReady) return;
  ui.leaderboardStatus.textContent = "AWAITING PILOT IDENTIFICATION…";
  try {
    portalsPlayer = await window.Portals.identity.requestLogin();
    updateLeaderboardIdentity();
    if (state.mode === "gameover") await submitGameScore();
    else await refreshLeaderboard();
  } catch (error) {
    console.error("Portals sign-in was not completed", error);
    ui.leaderboardStatus.textContent = "SIGN-IN WAS NOT COMPLETED";
  }
}

async function submitGameScore() {
  if (!portalsReady || !portalsPlayer?.playerId) {
    updateLeaderboardIdentity();
    return;
  }
  ui.leaderboardStatus.textContent = "TRANSMITTING SCORE…";
  try {
    await window.Portals.submitScore(Math.max(0, Math.floor(state.score)));
    await refreshLeaderboard();
  } catch (error) {
    console.error("Score could not be submitted", error);
    ui.leaderboardStatus.textContent = "SCORE TRANSMISSION FAILED";
  }
}

function openLeaderboard() {
  ui.leaderboard.classList.remove("hidden");
  if (portalsReady) refreshLeaderboard();
}

function closeLeaderboard() {
  ui.leaderboard.classList.add("hidden");
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
    powers: { overdrive: 0, chrono: 0, shield: 0 },
    shake: 0,
  });
  player = createPlayer();
  syncPowerHud();
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
  submitGameScore();
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
    shoot: [440, 210, 0.06, "sawtooth", 0.022],
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
  const slow = state.powers.chrono > 0 ? 0.48 : 1;
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
      if (d.type === "phantom") enemy.visible = true;
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
      state.enemyFireTimer = Math.max(0.165, 0.724 - state.stage * 0.0356) * (0.72 + Math.random() * 0.7);
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

  const enemyProjectileDt = state.powers.chrono > 0 ? dt * 0.48 : dt;
  for (let i = enemyShots.length - 1; i >= 0; i--) {
    const shot = enemyShots[i];
    shot.position.x += shot.userData.vx * enemyProjectileDt;
    shot.position.y += shot.userData.vy * enemyProjectileDt;
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
    const data = p.userData;
    data.phase += dt;
    p.position.y += p.userData.vy * dt;
    p.rotation.z += dt * 0.42;
    data.outerRing.rotation.z += dt * 1.6;
    data.outerRing.rotation.x = Math.sin(data.phase * 1.8) * 0.24;
    data.innerRing.rotation.y += dt * 2.25;
    data.innerRing.rotation.x -= dt * 0.85;
    data.core.rotation.x += dt * 1.35;
    data.core.rotation.y -= dt * 1.7;
    data.orbit.rotation.z -= dt * 2.8;
    const pulse = 1 + Math.sin(data.phase * 6) * 0.09;
    p.scale.setScalar(pulse);
    data.halo.material.uniforms.glowStrength.value = 0.44 + Math.sin(data.phase * 5) * 0.12;
    data.halo.scale.setScalar(0.92 + Math.sin(data.phase * 4) * 0.1);
    data.light.intensity = 6.2 + Math.sin(data.phase * 7) * 2.1;
    if (intersects(p, player)) {
      activatePowerup(p);
      removeAt(powerups, i);
    } else if (p.position.y < -13) removeAt(powerups, i);
  }
  let expired = false;
  for (const power of Object.values(POWER_DEFS)) {
    if (state.powers[power.type] <= 0) continue;
    state.powers[power.type] = Math.max(0, state.powers[power.type] - dt);
    const meter = ui.powerList.querySelector(`[data-power-meter="${power.type}"]`);
    if (meter) meter.style.width = `${Math.min(100, state.powers[power.type] / power.duration * 100)}%`;
    if (state.powers[power.type] === 0) expired = true;
  }
  if (expired) syncPowerHud();
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
ui.leaderboardButton.addEventListener("click", openLeaderboard);
ui.gameOverLeaderboardButton.addEventListener("click", openLeaderboard);
ui.leaderboardClose.addEventListener("click", closeLeaderboard);
ui.leaderboardSignIn.addEventListener("click", requestPortalsLogin);
ui.leaderboard.addEventListener("click", (event) => {
  if (event.target === ui.leaderboard) closeLeaderboard();
});
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

initializePortals();
