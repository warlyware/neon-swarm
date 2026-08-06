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
  continueRun: document.querySelector("#continue-run-button"),
  quitRun: document.querySelector("#quit-run-button"),
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
  powerupsButton: document.querySelector("#powerups-button"),
  powerups: document.querySelector("#powerups-panel"),
  powerupsClose: document.querySelector("#powerups-close"),
  powerupGuideList: document.querySelector("#powerup-guide-list"),
  menuToggle: document.querySelector("#menu-toggle"),
  pauseControls: document.querySelector("#pause-controls"),
  masterVolume: document.querySelector("#master-volume"),
  masterVolumeValue: document.querySelector("#master-volume-value"),
  sfxVolume: document.querySelector("#sfx-volume"),
  sfxVolumeValue: document.querySelector("#sfx-volume-value"),
  musicVolume: document.querySelector("#music-volume"),
  musicVolumeValue: document.querySelector("#music-volume-value"),
  mouseModeMove: document.querySelector("#mouse-mode-move"),
  mouseModeShoot: document.querySelector("#mouse-mode-shoot"),
  mouseControlHint: document.querySelector("#mouse-control-hint"),
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
  cyan: 0x00f5ff,
  pink: 0xff00b8,
  violet: 0x922bff,
  yellow: 0xffff32,
  orange: 0xff6500,
  dark: 0x120528,
  white: 0xffffff,
};

const POWER_DEFS = {
  overdrive: { type: "overdrive", color: COLORS.yellow, icon: "⚡", name: "TRIPLE OVERDRIVE", duration: 11 },
  chrono: { type: "chrono", color: COLORS.cyan, icon: "◷", name: "CHRONO FIELD", duration: 11 },
  shield: { type: "shield", color: COLORS.pink, icon: "◇", name: "PHASE SHIELD", duration: 9 },
  plasma: { type: "plasma", color: 0x72f7ff, icon: "┃", name: "PLASMA BEAM", duration: 8 },
  homing: { type: "homing", color: 0xffb347, icon: "⌁", name: "HOMING SWARM", duration: 10 },
  drones: { type: "drones", color: 0xb58cff, icon: "◆", name: "MIRROR DRONES", duration: 10 },
  magnet: { type: "magnet", color: 0x62ff9f, icon: "∩", name: "MAGNETIC FIELD", duration: 10 },
  multiplier: { type: "multiplier", color: 0xff79d1, icon: "×2", name: "SCORE MULTIPLIER", duration: 12 },
  spread: { type: "spread", color: 0x8fb7ff, icon: "⋰", name: "ANGLE CANNONS", duration: 10 },
  chain: { type: "chain", color: COLORS.orange, icon: "ϟ", name: "CHAIN LIGHTNING", duration: 10 },
  emp: { type: "emp", color: 0x68f7ff, icon: "◎", name: "EMP LOCKDOWN", duration: 4.5 },
  decoy: { type: "decoy", color: 0xff5bc8, icon: "◈", name: "HOLOGRAM DECOY", duration: 10 },
  reflector: { type: "reflector", color: 0x7df9ff, icon: "↺", name: "REFLECTOR ARRAY", duration: 10 },
  scavenger: { type: "scavenger", color: 0x7dff8a, icon: "✣", name: "SCAVENGER SWARM", duration: 10 },
  singularity: { type: "singularity", color: 0xe36bff, icon: "●", name: "SINGULARITY CORE", duration: 8 },
};
const EXTRA_SHIP_POWER = {
  type: "extra-ship",
  color: COLORS.white,
  icon: "◆",
  name: "EXTRA SHIP",
};
const NOVA_POWER = {
  type: "nova",
  color: 0xd7b8ff,
  icon: "✦",
  name: "NOVA BOMB",
};
const WARP_DASH_POWER = {
  type: "warp",
  color: 0x7df9ff,
  icon: "➤",
  name: "WARP DASH",
};
const POWERUP_DESCRIPTIONS = {
  overdrive: "Triple-shot firepower with heavier, faster blasts.",
  chrono: "Slows enemy movement and incoming projectiles.",
  shield: "Absorbs one hit before burning out.",
  plasma: "Replaces normal shots with a continuous piercing beam.",
  homing: "Adds missiles that steer toward nearby enemies.",
  drones: "Deploys mirror drones that add side fire.",
  magnet: "Pulls nearby powerups toward your ship.",
  multiplier: "Doubles score from enemy kills and stage bonuses.",
  spread: "Adds angled cannons to your main fire.",
  chain: "Hits arc to up to two nearby enemies.",
  emp: "Clears enemy fire and locks enemies in place.",
  decoy: "Deploys a hologram that draws and absorbs enemy fire.",
  reflector: "Periodically redirects nearby enemy bullets back toward their attackers.",
  scavenger: "Destroyed enemies release small autonomous attack drones.",
  singularity: "Pulls nearby enemies inward and pulses damage.",
  "extra-ship": "Adds one ship, up to the six-ship cap.",
  nova: "Destroys enemy fire and damages every enemy.",
  warp: "Teleports you in your movement direction and grants brief invulnerability.",
};
const POWERUP_GUIDE = [
  ...Object.values(POWER_DEFS),
  EXTRA_SHIP_POWER,
  NOVA_POWER,
  WARP_DASH_POWER,
].map((power) => ({
  ...power,
  description: POWERUP_DESCRIPTIONS[power.type],
}));
const MAX_PLAYER_LIVES = 6;
const EXTRA_SHIP_GRACE_SECONDS = 0.35;
const MOUSE_BUTTON_MODES = {
  MOVE_AND_SHOOT: "move-and-shoot",
  SHOOT_ONLY: "shoot-only",
};
const GAMEPAD_DEADZONE = 0.16;
const SINGULARITY_EFFECTIVENESS = 0.5;
const ENEMY_FIRE_INTERVAL_BASE = 0.84;
const ENEMY_FIRE_INTERVAL_STAGE_SCALE = 0.02;
const ENEMY_FIRE_INTERVAL_MIN = 0.34;
const DECOY_ORBIT_RADIUS = 4.2;
const DECOY_VERTICAL_OFFSET = 0.8;
const DECOY_VERTICAL_SWING = 0.55;

const state = {
  mode: "title",
  paused: false,
  masterVolume: 1,
  sfxVolume: 1,
  musicVolume: 1,
  mouseButtonMode: MOUSE_BUTTON_MODES.MOVE_AND_SHOOT,
  score: 0,
  stage: 1,
  lives: 3,
  stageTimer: 0,
  formationTime: 0,
  enemyFireTimer: 1,
  singularityPulseTimer: 0,
  powers: Object.fromEntries(Object.keys(POWER_DEFS).map((type) => [type, 0])),
  shake: 0,
};

const keys = new Set();
const enemies = [];
const playerShots = [];
const enemyShots = [];
const powerups = [];
const particles = [];
const scavengerDrones = [];
let player;
let audio;
let audioMasterBus;
let sfxBus;
let musicBus;
let musicTimer;
let musicStep = 0;
let activeMusicTrack = null;
let nextMusicTime = 0;
let pointerDown = false;
let pointerX = 0;
let pointerY = 0;
let activePointerType = "mouse";
let decoy = null;
const gamepadInput = {
  index: null,
  buttons: [],
  moveX: 0,
  moveY: 0,
  firing: false,
  active: false,
  confirmPressed: false,
  cancelPressed: false,
  pausePressed: false,
};
const gamepadNavigation = {
  focus: null,
  returnFocus: null,
  index: 0,
  repeatDirection: 0,
  repeatTimer: 0,
};
let portalsReady = false;
let portalsPlayer = null;

function mat(color, emissive = color, intensity = 2.3) {
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
    uniforms: {
      glowColor: { value: new THREE.Color(color) },
      glowOpacity: { value: 1 },
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
      uniform float glowOpacity;
      varying vec2 vUv;
      void main() {
        float radius = length((vUv - 0.5) * 2.0);
        float alpha = pow(max(0.0, 1.0 - radius), 2.0) * 0.72 * glowOpacity;
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
  mint: mat(0x32ffad, 0x00ed89, 2.55),
  white: mat(COLORS.white, COLORS.cyan, 0.7),
  enemyShot: new THREE.MeshBasicMaterial({ color: COLORS.pink }),
  playerShot: new THREE.MeshBasicMaterial({ color: COLORS.cyan }),
  homingShot: new THREE.MeshBasicMaterial({ color: 0xffb347 }),
  enemyShotGlow: projectileGlowMaterial(COLORS.pink),
  playerShotGlow: projectileGlowMaterial(COLORS.cyan),
  homingShotGlow: projectileGlowMaterial(0xffb347),
};

const shipGlowMaterials = {
  player: projectileGlowMaterial(0x00f5ff),
  scout: projectileGlowMaterial(COLORS.violet),
  guard: projectileGlowMaterial(COLORS.pink),
  ace: projectileGlowMaterial(COLORS.yellow),
  bomber: projectileGlowMaterial(COLORS.orange),
  phantom: projectileGlowMaterial(COLORS.cyan),
  lancer: projectileGlowMaterial(0x32ffad),
};

function enemyWireMaterial(color) {
  return new THREE.MeshBasicMaterial({
    color,
    wireframe: true,
    transparent: true,
    opacity: 0.98,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

const enemyWireMaterials = {
  scout: enemyWireMaterial(COLORS.violet),
  guard: enemyWireMaterial(COLORS.pink),
  ace: enemyWireMaterial(COLORS.yellow),
  bomber: enemyWireMaterial(COLORS.orange),
  phantom: enemyWireMaterial(COLORS.cyan),
  lancer: enemyWireMaterial(0x32ffad),
};

const playerWireMaterial = enemyWireMaterial(COLORS.cyan);

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

  const grid = new THREE.GridHelper(100, 34, 0xff00d9, 0xa000ff);
  grid.position.set(0, -11.2, -18);
  grid.material.transparent = true;
  grid.material.opacity = 0.72;
  grid.material.blending = THREE.AdditiveBlending;
  grid.material.depthWrite = false;
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

  const shipAura = new THREE.Mesh(
    new THREE.PlaneGeometry(5.4, 5.4),
    shipGlowMaterials.player
  );
  shipAura.position.z = -0.36;
  ship.add(shipAura);

  // A single glowing wireframe hull matches the minimal enemy silhouettes.
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3.25, 4), playerWireMaterial);
  body.rotation.y = Math.PI / 4;
  body.position.set(0, 0.15, 0.22);
  ship.add(body);

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

  const drones = [-1, 1].map((side) => {
    const drone = new THREE.Group();
    const droneAura = new THREE.Mesh(new THREE.PlaneGeometry(1.65, 1.65), shipGlowMaterials.scout);
    droneAura.position.z = -0.2;
    drone.add(droneAura);
    drone.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), materials.violet));
    const droneWing = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.12, 0.12), materials.cyan);
    drone.position.set(side * 2.55, -0.2, 0.05);
    drone.add(droneWing);
    drone.visible = false;
    ship.add(drone);
    return drone;
  });

  ship.scale.setScalar(0.45);
  ship.position.set(0, -8, 0);
  ship.userData = {
    radius: 0.55,
    fireTimer: 0,
    invulnerable: 0,
    destroyed: false,
    velocityX: 0,
    velocityY: 0,
    reflectorTimer: 0,
    reflectorField: null,
    thrusters,
    engineLight,
    drones,
    beam: null,
    beamDamageTimer: 0,
    beamSoundTimer: 0,
  };
  world.add(ship);
  return ship;
}

function createReflectorField() {
  const field = new THREE.Group();
  const fieldMaterial = new THREE.MeshBasicMaterial({
    color: POWER_DEFS.reflector.color,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const outerRing = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.075, 8, 36), fieldMaterial);
  outerRing.rotation.x = Math.PI / 2;
  field.add(outerRing);

  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.62, 0.035, 6, 28),
    fieldMaterial.clone()
  );
  innerRing.rotation.y = Math.PI / 2;
  field.add(innerRing);
  field.userData = { outerRing, innerRing, phase: 0 };
  field.visible = false;
  player.add(field);
  return field;
}

function createHologramDecoy() {
  const group = new THREE.Group();
  const auraMaterial = projectileGlowMaterial(POWER_DEFS.decoy.color);
  const aura = new THREE.Mesh(new THREE.PlaneGeometry(5.1, 5.1), auraMaterial);
  aura.position.z = -0.34;
  group.add(aura);

  const bodyMaterial = enemyWireMaterial(POWER_DEFS.decoy.color);
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3.25, 4), bodyMaterial);
  body.rotation.y = Math.PI / 4;
  body.position.set(0, 0.15, 0.2);
  group.add(body);

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: POWER_DEFS.decoy.color,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.16, 0.045, 6, 24), ringMaterial);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  group.scale.setScalar(0.45);
  group.userData = {
    radius: 0.55,
    aura,
    bodyMaterial,
    ring,
    phase: 0,
  };
  group.visible = false;
  world.add(group);
  return group;
}

function updateDecoy(dt) {
  if (!decoy) {
    if (state.powers.decoy > 0) decoy = createHologramDecoy();
    else return;
  }
  if (state.powers.decoy <= 0 || state.mode !== "playing") {
    decoy.visible = false;
    return;
  }
  const data = decoy.userData;
  data.phase += dt;
  const targetX = THREE.MathUtils.clamp(
    player.position.x + Math.sin(data.phase * 2.2) * DECOY_ORBIT_RADIUS,
    -12.5,
    12.5
  );
  const targetY = THREE.MathUtils.clamp(
    player.position.y + DECOY_VERTICAL_OFFSET + Math.cos(data.phase * 1.7) * DECOY_VERTICAL_SWING,
    -9.5,
    3.6
  );
  decoy.position.x = THREE.MathUtils.lerp(decoy.position.x, targetX, 1 - Math.exp(-dt * 8));
  decoy.position.y = THREE.MathUtils.lerp(decoy.position.y, targetY, 1 - Math.exp(-dt * 8));
  decoy.rotation.z = Math.sin(data.phase * 2.7) * 0.1;
  data.ring.rotation.z += dt * 3.2;
  data.bodyMaterial.opacity = 0.55 + Math.sin(data.phase * 8) * 0.2;
  data.aura.material.uniforms.glowOpacity.value = 0.45 + Math.sin(data.phase * 6) * 0.18;
  decoy.visible = true;
}

function updateReflectorField(dt) {
  if (!player.userData.reflectorField && state.powers.reflector > 0) {
    player.userData.reflectorField = createReflectorField();
  }
  const field = player.userData.reflectorField;
  if (!field) return;
  const active = state.powers.reflector > 0;
  field.visible = active;
  if (!active) {
    player.userData.reflectorTimer = 0;
    return;
  }
  const data = field.userData;
  data.phase += dt;
  data.outerRing.rotation.z += dt * 2.4;
  data.innerRing.rotation.z -= dt * 3.1;
  const pulse = 0.94 + Math.sin(data.phase * 7) * 0.08;
  field.scale.setScalar(pulse);
  data.outerRing.material.opacity = 0.58 + Math.sin(data.phase * 8) * 0.14;
}

function createScavengerDrone(position) {
  if (scavengerDrones.length >= 12) return;
  const drone = new THREE.Group();
  const color = POWER_DEFS.scavenger.color;
  const aura = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), projectileGlowMaterial(color));
  aura.position.z = -0.18;
  drone.add(aura);
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.2, 0),
    new THREE.MeshBasicMaterial({ color, blending: THREE.AdditiveBlending })
  );
  drone.add(core);
  const wing = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.08, 0.08),
    new THREE.MeshBasicMaterial({ color: COLORS.white, blending: THREE.AdditiveBlending })
  );
  drone.add(wing);
  drone.position.copy(position);
  drone.userData = {
    radius: 0.28,
    life: 5.5,
    phase: Math.random() * Math.PI * 2,
    vx: 0,
    vy: 0,
    aura,
    core,
  };
  world.add(drone);
  scavengerDrones.push(drone);
}

function updateScavengerDrones(dt) {
  for (let i = scavengerDrones.length - 1; i >= 0; i--) {
    const drone = scavengerDrones[i];
    const data = drone.userData;
    data.life -= dt;
    data.phase += dt;
    const target = enemies
      .filter((enemy) => !enemy.userData.respawning)
      .sort((a, b) => (
        drone.position.distanceToSquared(a.position) - drone.position.distanceToSquared(b.position)
      ))[0];

    if (target) {
      const dx = target.position.x - drone.position.x;
      const dy = target.position.y - drone.position.y;
      const distance = Math.hypot(dx, dy) || 1;
      const speed = 8.5 + Math.sin(data.phase * 3) * 0.8;
      data.vx = THREE.MathUtils.lerp(data.vx, dx / distance * speed, 1 - Math.exp(-dt * 8));
      data.vy = THREE.MathUtils.lerp(data.vy, dy / distance * speed, 1 - Math.exp(-dt * 8));
      drone.position.x += data.vx * dt;
      drone.position.y += data.vy * dt;
      drone.rotation.z = -Math.atan2(data.vx, data.vy);
      if (distance < target.userData.radius + 0.34) {
        burst(drone.position, POWER_DEFS.scavenger.color, 10);
        killEnemy(target, {
          position: drone.position,
          userData: { damage: 1 },
        }, {
          suppressScavenger: true,
        });
        removeAt(scavengerDrones, i);
        continue;
      }
    } else {
      drone.position.y += dt * 1.6;
    }

    data.core.rotation.x += dt * 7;
    data.core.rotation.y -= dt * 5;
    data.aura.material.uniforms.glowOpacity.value = 0.45 + Math.sin(data.phase * 8) * 0.16;
    if (data.life <= 0 || drone.position.y > 14) removeAt(scavengerDrones, i);
  }
}

function createEnemy(type, row, col) {
  const enemy = new THREE.Group();
  const primary = enemyWireMaterials[type].clone();
  const auraMaterial = shipGlowMaterials[type].clone();

  const enemyAura = new THREE.Mesh(
    new THREE.PlaneGeometry(type === "bomber" ? 2.9 : type === "ace" ? 2.55 : 2.25, type === "lancer" ? 2.7 : 2.25),
    auraMaterial
  );
  enemyAura.position.z = -0.32;
  enemy.add(enemyAura);

  const addPiece = (geometry, material, position = [0, 0, 0], rotation = [0, 0, 0]) => {
    const piece = new THREE.Mesh(geometry, material);
    piece.position.set(...position);
    piece.rotation.set(...rotation);
    enemy.add(piece);
    return piece;
  };

  const profiles = {
    scout: {
      body: () => new THREE.TetrahedronGeometry(0.52, 0),
      bodyScale: [0.72, 1.3, 0.7],
      bodyRotation: [0, 0, Math.PI / 4],
    },
    guard: {
      body: () => new THREE.OctahedronGeometry(0.56, 0),
      bodyScale: [0.82, 1.2, 0.78],
      bodyRotation: [0, 0, 0],
    },
    ace: {
      body: () => new THREE.ConeGeometry(0.48, 1.42, 4),
      bodyScale: [1, 1, 1],
      bodyRotation: [0, 0, Math.PI],
    },
    bomber: {
      body: () => new THREE.DodecahedronGeometry(0.62, 0),
      bodyScale: [1.18, 0.9, 0.72],
      bodyRotation: [0.18, 0.34, Math.PI / 10],
    },
    phantom: {
      body: () => new THREE.ConeGeometry(0.5, 1.3, 3),
      bodyScale: [1, 1, 0.72],
      bodyRotation: [0, 0, Math.PI],
    },
    lancer: {
      body: () => new THREE.ConeGeometry(0.3, 1.72, 4),
      bodyScale: [1, 1, 1],
      bodyRotation: [0, 0, Math.PI],
    },
  };
  const profile = profiles[type];
  const hull = addPiece(profile.body(), primary, [0, -0.08, 0.1], profile.bodyRotation);
  hull.scale.set(...profile.bodyScale);

  const hp = {
    ace: 3 + Math.floor((state.stage - 1) / 6),
    guard: 2,
    scout: 1,
    bomber: 5 + Math.floor((state.stage - 1) / 8),
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
    respawning: false,
    respawnT: 0,
    wireMaterial: primary,
    auraMaterial,
  };
  world.add(enemy);
  enemies.push(enemy);
  return enemy;
}

function spawnStage() {
  clearEntities();
  state.formationTime = 0;
  state.enemyFireTimer = Math.max(
    ENEMY_FIRE_INTERVAL_MIN,
    ENEMY_FIRE_INTERVAL_BASE - state.stage * ENEMY_FIRE_INTERVAL_STAGE_SCALE
  );
  const rows = Math.min(5, 3 + Math.floor(state.stage / 2));
  const cols = Math.min(10, 6 + state.stage);
  const spacingX = Math.min(2.85, 18 / (cols - 1));

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (state.stage < 3 && row === rows - 1 && (col === 0 || col === cols - 1)) continue;
      let type = row === 0 ? "ace" : row < 3 ? "guard" : "scout";
      if (state.stage >= 2 && row === 1 && col % 4 === 1) type = "bomber";
      if (state.stage >= 3 && row === rows - 1 && col % 3 === 0) type = "phantom";
      if (state.stage >= 4 && row === 2 && col % 3 === 2) type = "lancer";
      const e = createEnemy(type, row, col);
      e.userData.homeX = (col - (cols - 1) / 2) * spacingX;
      e.userData.homeY = 7.6 - row * 2.25;
      e.position.set(e.userData.homeX, 18 + row * 2, 0);
    }
  }
}

function clearEntities() {
  const removable = [...enemies, ...playerShots, ...enemyShots, ...particles, ...powerups, ...scavengerDrones];
  removable.forEach((object) => world.remove(object));
  if (decoy) {
    world.remove(decoy);
    decoy = null;
  }
  enemies.length = 0;
  playerShots.length = 0;
  enemyShots.length = 0;
  particles.length = 0;
  powerups.length = 0;
  scavengerDrones.length = 0;
}

function beginPowerupTransitionFade() {
  const duration = 0.65;
  for (const powerup of powerups) {
    const materialOpacities = new Map();
    powerup.traverse((object) => {
      if (!object.material) return;
      const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of objectMaterials) {
        if (materialOpacities.has(material)) continue;
        material.transparent = true;
        materialOpacities.set(material, material.opacity);
      }
    });
    powerup.userData.transitionFade = {
      elapsed: 0,
      duration,
      materialOpacities,
      scale: powerup.scale.x,
      haloStrength: powerup.userData.halo.material.uniforms.glowStrength.value,
      lightIntensity: powerup.userData.light.intensity,
      accentIntensity: powerup.userData.accentLight?.intensity ?? 0,
    };
  }

  for (const particle of particles) {
    if (particle.userData.sparkle) {
      particle.userData.life = Math.min(particle.userData.life, duration);
    }
  }
}

function updateTransitionPowerups(dt) {
  for (let i = powerups.length - 1; i >= 0; i--) {
    const powerup = powerups[i];
    const fade = powerup.userData.transitionFade;
    if (!fade) {
      removeAt(powerups, i);
      continue;
    }

    fade.elapsed += dt;
    const progress = Math.min(1, fade.elapsed / fade.duration);
    const visibility = 1 - progress * progress;
    fade.materialOpacities.forEach((opacity, material) => {
      material.opacity = opacity * visibility;
    });
    powerup.userData.halo.material.uniforms.glowStrength.value = fade.haloStrength * visibility;
    powerup.userData.light.intensity = fade.lightIntensity * visibility;
    if (powerup.userData.accentLight) {
      powerup.userData.accentLight.intensity = fade.accentIntensity * visibility;
    }
    powerup.scale.setScalar(fade.scale * (0.72 + visibility * 0.28));
    powerup.rotation.z += dt * 1.8;

    if (progress >= 1) removeAt(powerups, i);
  }
}

function spawnPlayerProjectile(offsetX, {
  vx = 0,
  vy = 18,
  damage = 1,
  homing = false,
  originY = 0.76,
  chain = state.powers.chain > 0,
} = {}) {
  const strong = state.powers.overdrive > 0;
  const shot = new THREE.Mesh(
    homing
      ? new THREE.ConeGeometry(0.16, 0.58, 5)
      : new THREE.BoxGeometry(0.12, strong ? 0.95 : 0.7, 0.14),
    homing ? materials.homingShot : materials.playerShot
  );
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(homing ? 0.86 : 0.72, homing ? 1.15 : strong ? 1.75 : 1.4),
    homing ? materials.homingShotGlow : materials.playerShotGlow
  );
  glow.position.z = -0.08;
  shot.add(glow);
  shot.position.set(player.position.x + offsetX, player.position.y + originY, 0);
  shot.userData = {
    vx,
    vy,
    damage,
    homing,
    chain,
    radius: homing ? 0.3 : 0.24,
  };
  world.add(shot);
  playerShots.push(shot);
}

function shootPlayer(auxiliaryOnly = false) {
  if (!player || player.userData.fireTimer > 0 || state.mode !== "playing") return;
  const strong = state.powers.overdrive > 0;
  const baseShots = strong ? [-0.36, 0, 0.36] : [-0.24, 0.24];
  if (!auxiliaryOnly) {
    baseShots.forEach((offset) => {
      spawnPlayerProjectile(offset, {
        vy: strong ? 21 : 18,
        damage: strong ? 2 : 1,
      });
    });
    if (state.powers.drones > 0) {
      [-1.15, 1.15].forEach((offset) => {
        spawnPlayerProjectile(offset, { vy: strong ? 21 : 18, damage: strong ? 2 : 1, originY: 0.5 });
      });
    }
  }
  if (state.powers.homing > 0) {
    spawnPlayerProjectile(0, { vy: 12, damage: strong ? 2 : 1, homing: true, originY: 0.58 });
  }
  if (state.powers.spread > 0) {
    spawnPlayerProjectile(-0.38, { vx: -7.2, vy: 16, damage: strong ? 2 : 1 });
    spawnPlayerProjectile(0.38, { vx: 7.2, vy: 16, damage: strong ? 2 : 1 });
  }
  player.userData.fireTimer = strong ? 0.12 : 0.22;
  if (!auxiliaryOnly) sfx("shoot");
}

function setGamepadNavigationActive(active) {
  gamepadInput.active = active;
  document.documentElement.classList.toggle("gamepad-active", active);
  if (active) return;
  clearGamepadFocus();
  gamepadNavigation.returnFocus = null;
  gamepadNavigation.repeatDirection = 0;
  gamepadNavigation.repeatTimer = 0;
}

function applyGamepadDeadzone(value) {
  const magnitude = Math.abs(value);
  if (magnitude <= GAMEPAD_DEADZONE) return 0;
  return Math.sign(value) * (magnitude - GAMEPAD_DEADZONE) / (1 - GAMEPAD_DEADZONE);
}

function updateGamepadInput() {
  gamepadInput.confirmPressed = false;
  gamepadInput.cancelPressed = false;
  gamepadInput.pausePressed = false;

  if (typeof navigator.getGamepads !== "function") {
    gamepadInput.index = null;
    gamepadInput.buttons = [];
    gamepadInput.moveX = 0;
    gamepadInput.moveY = 0;
    gamepadInput.firing = false;
    setGamepadNavigationActive(false);
    return;
  }

  const pads = Array.from(navigator.getGamepads());
  let pad = gamepadInput.index === null ? null : pads[gamepadInput.index];
  if (!pad) {
    pad = pads.find(Boolean) ?? null;
    gamepadInput.index = pad?.index ?? null;
  }
  if (!pad) {
    gamepadInput.buttons = [];
    gamepadInput.moveX = 0;
    gamepadInput.moveY = 0;
    gamepadInput.firing = false;
    setGamepadNavigationActive(false);
    return;
  }

  const previousButtons = gamepadInput.buttons;
  const isPressed = (index) => Boolean(pad.buttons[index]?.pressed || pad.buttons[index]?.value > 0.5);
  const pressedButtons = pad.buttons.map((button) => Boolean(button?.pressed || button?.value > 0.5));
  const justPressed = (index) => pressedButtons[index] && !previousButtons[index];
  const dpadX = (isPressed(15) ? 1 : 0) - (isPressed(14) ? 1 : 0);
  const dpadY = (isPressed(13) ? 1 : 0) - (isPressed(12) ? 1 : 0);
  let moveX = applyGamepadDeadzone(pad.axes[0] ?? 0);
  let moveY = applyGamepadDeadzone(pad.axes[1] ?? 0);
  if (moveX === 0) moveX = dpadX;
  if (moveY === 0) moveY = dpadY;

  gamepadInput.buttons = pressedButtons;
  gamepadInput.moveX = moveX;
  gamepadInput.moveY = moveY;
  gamepadInput.firing = isPressed(0) || isPressed(7);
  gamepadInput.confirmPressed = justPressed(0);
  gamepadInput.cancelPressed = justPressed(1);
  gamepadInput.pausePressed = justPressed(9);
  if (pressedButtons.some(Boolean) || moveX !== 0 || moveY !== 0) setGamepadNavigationActive(true);
}

function clearGamepadFocus() {
  gamepadNavigation.focus?.classList.remove("gamepad-focus");
  gamepadNavigation.focus = null;
}

function setGamepadFocus(element) {
  if (gamepadNavigation.focus === element) return;
  clearGamepadFocus();
  gamepadNavigation.focus = element;
  if (!element) return;
  element.classList.add("gamepad-focus");
  element.focus({ preventScroll: true });
  element.scrollIntoView?.({ block: "nearest" });
}

function getGamepadNavigationItems() {
  if (!ui.leaderboard.classList.contains("hidden")) {
    const items = [ui.leaderboardClose, ui.leaderboardList];
    if (!ui.leaderboardSignIn.classList.contains("hidden")) items.push(ui.leaderboardSignIn);
    return items;
  }
  if (!ui.powerups.classList.contains("hidden")) {
    return [ui.powerupsClose, ...ui.powerupGuideList.children];
  }
  if (state.mode === "paused") {
    return [
      ui.continueRun,
      ui.masterVolume,
      ui.sfxVolume,
      ui.musicVolume,
      ui.mouseModeMove,
      ui.mouseModeShoot,
      ui.quitRun,
    ];
  }
  if (state.mode === "title" && ui.start.classList.contains("visible")) {
    return [ui.startButton, ui.leaderboardButton, ui.powerupsButton];
  }
  if (state.mode === "gameover" && ui.gameOver.classList.contains("visible")) {
    return [ui.restart, ui.gameOverLeaderboardButton];
  }
  return [];
}

function getGamepadNavigationDirection(dt) {
  const verticalDirection = gamepadInput.moveY < -0.55 ? -1 : gamepadInput.moveY > 0.55 ? 1 : 0;
  const horizontalDirection = gamepadInput.moveX < -0.55 ? -1 : gamepadInput.moveX > 0.55 ? 1 : 0;
  const focusedVolume = gamepadNavigation.focus?.matches("input[type=range]");
  const direction = focusedVolume && horizontalDirection !== 0
    ? horizontalDirection
    : verticalDirection;
  if (direction === 0) {
    gamepadNavigation.repeatDirection = 0;
    gamepadNavigation.repeatTimer = 0;
    return 0;
  }
  if (direction !== gamepadNavigation.repeatDirection) {
    gamepadNavigation.repeatDirection = direction;
    gamepadNavigation.repeatTimer = 0.32;
    return direction;
  }
  gamepadNavigation.repeatTimer -= dt;
  if (gamepadNavigation.repeatTimer > 0) return 0;
  gamepadNavigation.repeatTimer = 0.14;
  return direction;
}

function updateGamepadFocus(dt) {
  const items = getGamepadNavigationItems();
  if (!items.length) {
    clearGamepadFocus();
    return;
  }
  let index = items.indexOf(gamepadNavigation.focus);
  if (index < 0) index = Math.min(gamepadNavigation.index, items.length - 1);
  const direction = getGamepadNavigationDirection(dt);
  if (direction) index = (index + direction + items.length) % items.length;
  gamepadNavigation.index = index;
  setGamepadFocus(items[index]);
}

function restoreGamepadFocus() {
  const returnFocus = gamepadNavigation.returnFocus;
  gamepadNavigation.returnFocus = null;
  const items = getGamepadNavigationItems();
  const index = items.indexOf(returnFocus);
  if (index < 0) {
    clearGamepadFocus();
    return;
  }
  gamepadNavigation.index = index;
  setGamepadFocus(returnFocus);
}

function adjustFocusedGamepadVolume(dt) {
  const slider = gamepadNavigation.focus;
  if (!slider?.matches("input[type=range]") || Math.abs(gamepadInput.moveX) <= 0.55) return false;
  const direction = getGamepadNavigationDirection(dt);
  if (direction) {
    slider.value = String(THREE.MathUtils.clamp(Number(slider.value) + direction * 5, 0, 100));
    slider.dispatchEvent(new Event("input", { bubbles: true }));
  }
  return true;
}

function handleGamepadMenus(dt) {
  if (!gamepadInput.active) return;
  if (!adjustFocusedGamepadVolume(dt)) updateGamepadFocus(dt);
  const panelOpen = !ui.leaderboard.classList.contains("hidden")
    || !ui.powerups.classList.contains("hidden");
  if (gamepadInput.cancelPressed) {
    if (!ui.powerups.classList.contains("hidden")) closePowerups();
    else if (!ui.leaderboard.classList.contains("hidden")) closeLeaderboard();
    return;
  }
  if (gamepadInput.pausePressed && !panelOpen && ["playing", "paused"].includes(state.mode)) {
    togglePause();
    return;
  }
  if (gamepadInput.confirmPressed && gamepadNavigation.focus) gamepadNavigation.focus.click();
}

function getPlayerMoveDirection() {
  let dx = (keys.has("ArrowRight") || keys.has("KeyD") ? 1 : 0)
    - (keys.has("ArrowLeft") || keys.has("KeyA") ? 1 : 0);
  let dy = (keys.has("ArrowUp") || keys.has("KeyW") ? 1 : 0)
    - (keys.has("ArrowDown") || keys.has("KeyS") ? 1 : 0);
  if (gamepadInput.moveX !== 0 || gamepadInput.moveY !== 0) {
    dx = gamepadInput.moveX;
    dy = -gamepadInput.moveY;
  }
  if (dx === 0 && dy === 0 && pointerDown && state.mouseButtonMode === MOUSE_BUTTON_MODES.MOVE_AND_SHOOT) {
    const targetX = pointerX * 13.3;
    const targetY = THREE.MathUtils.clamp(pointerY * 11 - 2.5, -10, 4);
    dx = targetX - player.position.x;
    dy = targetY - player.position.y;
  }
  if (dx === 0 && dy === 0) {
    dx = player.userData.velocityX;
    dy = player.userData.velocityY;
  }
  if (dx === 0 && dy === 0) dy = 1;
  const length = Math.hypot(dx, dy) || 1;
  return { x: dx / length, y: dy / length };
}

function triggerWarpDash() {
  const direction = getPlayerMoveDirection();
  const previousPosition = player.position.clone();
  const distance = 3.8;
  player.position.x = THREE.MathUtils.clamp(player.position.x + direction.x * distance, -13.2, 13.2);
  player.position.y = THREE.MathUtils.clamp(player.position.y + direction.y * distance, -10.2, 4);
  player.userData.velocityX = direction.x * 14;
  player.userData.velocityY = direction.y * 14;
  player.userData.invulnerable = Math.max(player.userData.invulnerable, 0.62);
  state.shake = 0.2;
  burst(previousPosition, WARP_DASH_POWER.color, 16);
  burst(player.position, WARP_DASH_POWER.color, 20);
  sfx("power");
}

function createTemporaryBeam(start, end, color, width = 0.1, life = 0.16) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (!length) return;
  const beam = new THREE.Mesh(
    new THREE.PlaneGeometry(length, width),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  beam.position.set((start.x + end.x) / 2, (start.y + end.y) / 2, 0.35);
  beam.rotation.z = Math.atan2(dy, dx);
  beam.userData = {
    vx: 0,
    vy: 0,
    vz: 0,
    life,
    maxLife: life,
    effect: true,
  };
  world.add(beam);
  particles.push(beam);
}

function triggerChainLightning(originEnemy) {
  const targets = enemies
    .filter((enemy) => enemy !== originEnemy && !enemy.userData.respawning)
    .sort((a, b) => (
      originEnemy.position.distanceToSquared(a.position) - originEnemy.position.distanceToSquared(b.position)
    ))
    .filter((enemy) => originEnemy.position.distanceToSquared(enemy.position) < 42)
    .slice(0, 2);
  for (const target of targets) {
    if (!enemies.includes(target)) continue;
    createTemporaryBeam(originEnemy.position, target.position, POWER_DEFS.chain.color, 0.13, 0.2);
    burst(target.position, POWER_DEFS.chain.color, 6);
    killEnemy(target, {
      position: target.position,
      userData: { damage: 1 },
    });
  }
}

function createPlasmaBeam() {
  const beam = new THREE.Group();
  beam.userData.columns = [-1.15, 0, 1.15].map((offset) => {
    const column = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 1, 0.12),
      new THREE.MeshBasicMaterial({ color: 0xc8ffff })
    );
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.86, 1),
      projectileGlowMaterial(0x72f7ff)
    );
    glow.position.z = -0.08;
    column.position.x = offset;
    column.add(glow);
    beam.add(column);
    return column;
  });
  beam.visible = false;
  world.add(beam);
  return beam;
}

function updatePlasmaBeam(dt, firing) {
  if (!player.userData.beam) player.userData.beam = createPlasmaBeam();
  const beam = player.userData.beam;
  const active = firing && state.powers.plasma > 0 && state.mode === "playing";
  beam.visible = active;
  if (!active) return;

  const hasDrones = state.powers.drones > 0;
  const length = 14 - player.position.y;
  beam.position.set(player.position.x, player.position.y + length / 2, 0);
  beam.userData.columns.forEach((column, index) => {
    column.visible = index === 1 || hasDrones;
    column.scale.y = length;
  });

  player.userData.beamDamageTimer -= dt;
  player.userData.beamSoundTimer -= dt;
  if (player.userData.beamSoundTimer <= 0) {
    sfx("shoot");
    player.userData.beamSoundTimer = 0.18;
  }
  if (player.userData.beamDamageTimer > 0) return;

  const beamOffsets = hasDrones ? [-1.15, 0, 1.15] : [0];
  for (const enemy of [...enemies]) {
    if (!enemies.includes(enemy) || enemy.position.y <= player.position.y) continue;
    if (beamOffsets.some((offset) => Math.abs(enemy.position.x - player.position.x - offset) < enemy.userData.radius + 0.14)) {
      killEnemy(enemy, {
        position: enemy.position,
        userData: { damage: 1 },
      });
    }
  }
  player.userData.beamDamageTimer = 0.12;
}

function shootEnemy(enemy) {
  const type = enemy.userData.type;
  const count = type === "bomber" ? 5 : type === "lancer" ? 2 : state.stage >= 5 && type === "ace" ? 3 : 1;
  const target = state.powers.decoy > 0 && decoy?.visible ? decoy : player;
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
    const targetX = target.position.x - enemy.position.x + (i - (count - 1) / 2) * spread;
    const targetY = target.position.y - enemy.position.y;
    const len = Math.hypot(targetX, targetY);
    const speed = (type === "lancer" ? 9.2 : type === "bomber" ? 4.4 : 5.6) + state.stage * 0.42;
    shot.userData = {
      vx: targetX / len * speed,
      vy: targetY / len * speed,
      radius: type === "bomber" ? 0.28 : 0.23,
      target: target === decoy ? "decoy" : "player",
      source: enemy,
      reflected: false,
    };
    world.add(shot);
    enemyShots.push(shot);
  }
  sfx("enemy");
}

function reflectEnemyShots() {
  const reflectionRadius = 6.8;
  let reflectedCount = 0;
  for (const shot of enemyShots) {
    if (shot.userData.reflected) continue;
    const distance = Math.hypot(shot.position.x - player.position.x, shot.position.y - player.position.y);
    if (distance > reflectionRadius) continue;

    let target = shot.userData.source;
    if (!target || !enemies.includes(target)) {
      target = enemies.reduce((nearest, enemy) => {
        if (!nearest) return enemy;
        return shot.position.distanceToSquared(enemy.position) < shot.position.distanceToSquared(nearest.position)
          ? enemy
          : nearest;
      }, null);
    }
    if (!target) continue;

    const dx = target.position.x - shot.position.x;
    const dy = target.position.y - shot.position.y;
    const distanceToTarget = Math.hypot(dx, dy) || 1;
    const speed = Math.max(9, Math.hypot(shot.userData.vx, shot.userData.vy) * 1.15);
    shot.userData.vx = dx / distanceToTarget * speed;
    shot.userData.vy = dy / distanceToTarget * speed;
    shot.userData.reflected = true;
    shot.userData.target = "enemy";
    shot.userData.damage = 2;
    shot.rotation.z = -Math.atan2(shot.userData.vx, shot.userData.vy);

    shot.material = shot.material.clone();
    shot.material.color.set(POWER_DEFS.reflector.color);
    const glow = shot.children[0];
    if (glow?.material?.clone) {
      glow.material = glow.material.clone();
      glow.material.uniforms.glowColor.value.set(POWER_DEFS.reflector.color);
      glow.material.uniforms.glowOpacity.value = 1.25;
    }
    burst(shot.position, POWER_DEFS.reflector.color, 5);
    reflectedCount++;
  }
  if (reflectedCount) sfx("shoot");
}

function spawnPowerup(position) {
  const kinds = [...Object.values(POWER_DEFS), WARP_DASH_POWER].filter((power) => (
    power.type !== "magnet" || state.stage < 10
  ));
  const rareRoll = Math.random();
  let kind;
  if (rareRoll < 0.1 && state.lives < MAX_PLAYER_LIVES) {
    kind = EXTRA_SHIP_POWER;
  } else if (rareRoll >= 0.1 && rareRoll < 0.2) {
    kind = NOVA_POWER;
  } else {
    kind = kinds[Math.floor(Math.random() * kinds.length)];
  }
  const isExtraShip = kind.type === "extra-ship";
  const group = new THREE.Group();

  const haloMaterial = new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(kind.color) },
      glowStrength: { value: isExtraShip ? 0.88 : 0.52 },
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
  const haloSize = isExtraShip ? 3.35 : 2.6;
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(haloSize, haloSize), haloMaterial);
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
    new THREE.TorusGeometry(isExtraShip ? 0.72 : 0.63, isExtraShip ? 0.072 : 0.055, 8, 28),
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

  const coreGeometries = {
    overdrive: () => new THREE.TetrahedronGeometry(0.36, 0),
    chrono: () => new THREE.TorusKnotGeometry(0.23, 0.065, 40, 6),
    shield: () => new THREE.IcosahedronGeometry(0.34, 0),
    plasma: () => new THREE.BoxGeometry(0.18, 0.72, 0.18),
    homing: () => new THREE.ConeGeometry(0.24, 0.62, 5),
    drones: () => new THREE.OctahedronGeometry(0.34, 0),
    magnet: () => new THREE.TorusGeometry(0.3, 0.09, 6, 14),
    multiplier: () => new THREE.BoxGeometry(0.44, 0.44, 0.28),
    spread: () => new THREE.TetrahedronGeometry(0.38, 0),
    "extra-ship": () => new THREE.ConeGeometry(0.3, 0.72, 4),
    nova: () => new THREE.DodecahedronGeometry(0.34, 0),
    warp: () => new THREE.ConeGeometry(0.3, 0.72, 4),
    chain: () => new THREE.TorusKnotGeometry(0.22, 0.07, 28, 5),
    emp: () => new THREE.TorusGeometry(0.34, 0.08, 8, 18),
    decoy: () => new THREE.OctahedronGeometry(0.36, 0),
    reflector: () => new THREE.TorusKnotGeometry(0.22, 0.07, 28, 5),
    singularity: () => new THREE.SphereGeometry(0.3, 12, 8),
  };
  const coreGeometry = coreGeometries[kind.type]();
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

  let starburst = null;
  let accentLight = null;
  if (isExtraShip) {
    starburst = new THREE.Group();
    const rayMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    for (let i = 0; i < 8; i++) {
      const ray = new THREE.Mesh(new THREE.PlaneGeometry(0.055, 0.48), rayMaterial);
      const angle = i / 8 * Math.PI * 2;
      ray.position.set(Math.cos(angle) * 0.91, Math.sin(angle) * 0.91, -0.03);
      ray.rotation.z = angle - Math.PI / 2;
      starburst.add(ray);
    }
    group.add(starburst);

    accentLight = new THREE.PointLight(COLORS.cyan, 8.5, 6.5);
    accentLight.position.set(0, 0, 0.45);
    group.add(accentLight);
  }

  const light = new THREE.PointLight(kind.color, isExtraShip ? 12 : 7.5, isExtraShip ? 7 : 5.5);
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
    starburst,
    accentLight,
    sparkleTimer: Math.random() * 0.05,
  };
  world.add(group);
  powerups.push(group);
}

function activatePowerup(p) {
  const type = p.userData.type;
  if (type === "extra-ship") {
    state.lives = Math.min(MAX_PLAYER_LIVES, state.lives + 1);
    player.userData.invulnerable = Math.max(
      player.userData.invulnerable,
      EXTRA_SHIP_GRACE_SECONDS
    );
    updateHud();
    burst(p.position, p.userData.color, 36);
    sfx("power");
    return;
  }
  if (type === "nova") {
    for (let i = enemyShots.length - 1; i >= 0; i--) {
      burst(enemyShots[i].position, COLORS.pink, 4);
      removeAt(enemyShots, i);
    }
    for (const enemy of [...enemies]) {
      killEnemy(enemy, {
        position: enemy.position,
        userData: { damage: 3 },
      });
    }
    state.shake = 0.45;
    flash();
    burst(p.position, p.userData.color, 55);
    sfx("power");
    return;
  }
  if (type === "warp") {
    triggerWarpDash();
    return;
  }
  if (type === "emp") {
    for (let i = enemyShots.length - 1; i >= 0; i--) {
      burst(enemyShots[i].position, POWER_DEFS.emp.color, 4);
      removeAt(enemyShots, i);
    }
    state.shake = 0.28;
    flash();
  }
  state.powers[type] = POWER_DEFS[type].duration;
  if (type === "decoy") {
    if (!decoy) decoy = createHologramDecoy();
    decoy.position.copy(player.position);
    decoy.position.x = THREE.MathUtils.clamp(player.position.x + DECOY_ORBIT_RADIUS, -12.5, 12.5);
    decoy.position.y += DECOY_VERTICAL_OFFSET;
    decoy.visible = true;
  }
  if (type === "reflector") player.userData.reflectorTimer = 0;
  if (type === "singularity") state.singularityPulseTimer = 0;
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
    details.append(name);
    if (power.duration) {
      const meter = document.createElement("div");
      meter.className = "meter";
      const fill = document.createElement("i");
      fill.dataset.powerMeter = power.type;
      meter.append(fill);
      details.append(meter);
    }
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

function createShockwave(position, color, {
  life = 0.7,
  startScale = 0.7,
  maxScale = 5.8,
  opacity = 0.95,
  rotation = 0,
  rotationSpeed = 2.2,
  z = 0.35,
} = {}) {
  const shockwave = new THREE.Mesh(
    new THREE.RingGeometry(0.14, 0.24, 32),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  shockwave.position.copy(position);
  shockwave.position.z = z;
  shockwave.rotation.z = rotation;
  shockwave.userData = {
    vx: 0,
    vy: 0,
    vz: 0,
    life,
    maxLife: life,
    effect: "shockwave",
    startScale,
    maxScale,
    opacity,
    rotationSpeed,
  };
  world.add(shockwave);
  particles.push(shockwave);
}

function createExplosionFlash(position, color, life, maxScale, opacity = 1) {
  const flashCore = new THREE.Mesh(
    new THREE.CircleGeometry(0.55, 32),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    })
  );
  flashCore.position.copy(position);
  flashCore.position.z = 0.7;
  flashCore.scale.setScalar(0.15);
  flashCore.userData = {
    vx: 0,
    vy: 0,
    vz: 0,
    life,
    maxLife: life,
    effect: "explosion-flash",
    maxScale,
    opacity,
  };
  world.add(flashCore);
  particles.push(flashCore);
}

function createExplosionRays(position) {
  const colors = [COLORS.white, COLORS.cyan, COLORS.pink];
  for (let i = 0; i < 20; i++) {
    const angle = Math.PI * 2 * i / 20 + (Math.random() - 0.5) * 0.16;
    const length = 0.7 + Math.random() * 1.35;
    const speed = 4.5 + Math.random() * 6.5;
    const life = 0.32 + Math.random() * 0.34;
    const ray = new THREE.Mesh(
      new THREE.PlaneGeometry(0.045 + Math.random() * 0.075, length),
      new THREE.MeshBasicMaterial({
        color: colors[i % colors.length],
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    const distance = 0.25 + Math.random() * 0.32;
    ray.position.copy(position);
    ray.position.x += Math.cos(angle) * distance;
    ray.position.y += Math.sin(angle) * distance;
    ray.position.z = 0.48 + Math.random() * 0.12;
    ray.rotation.z = angle - Math.PI / 2;
    ray.userData = {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      vz: 0,
      life,
      maxLife: life,
      effect: "explosion-ray",
      opacity: 0.9,
    };
    world.add(ray);
    particles.push(ray);
  }
}

function createExplosionDebris(position) {
  const colors = [COLORS.cyan, COLORS.pink, COLORS.white];
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3.5 + Math.random() * 8.5;
    const life = 0.65 + Math.random() * 0.75;
    const shard = new THREE.Mesh(
      new THREE.TetrahedronGeometry(0.075 + Math.random() * 0.14, 0),
      new THREE.MeshBasicMaterial({
        color: colors[i % colors.length],
        transparent: true,
        blending: THREE.AdditiveBlending,
      })
    );
    shard.position.copy(position);
    shard.position.z = 0.2 + (Math.random() - 0.5) * 0.5;
    shard.scale.set(0.55, 1.2 + Math.random() * 2.4, 0.7);
    shard.rotation.z = angle - Math.PI / 2;
    shard.userData = {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      vz: (Math.random() - 0.5) * 3,
      life,
      maxLife: life,
      effect: "explosion-debris",
      spinX: (Math.random() - 0.5) * 18,
      spinY: (Math.random() - 0.5) * 18,
      spinZ: (Math.random() - 0.5) * 24,
      opacity: 1,
    };
    world.add(shard);
    particles.push(shard);
  }
}

function createPlayerExplosion(position) {
  burst(position, COLORS.cyan, 52);
  burst(position, COLORS.pink, 36);
  burst(position, COLORS.white, 18);
  createExplosionFlash(position, COLORS.white, 0.28, 5.4, 1);
  createExplosionFlash(position, COLORS.cyan, 0.52, 7.2, 0.72);
  createShockwave(position, COLORS.white, {
    life: 0.42,
    startScale: 0.35,
    maxScale: 6.5,
    opacity: 1,
    rotationSpeed: -4.5,
    z: 0.65,
  });
  createShockwave(position, COLORS.pink, {
    life: 0.84,
    startScale: 0.5,
    maxScale: 11.5,
    opacity: 0.92,
    rotation: Math.PI / 16,
    rotationSpeed: 2.8,
    z: 0.5,
  });
  createShockwave(position, COLORS.cyan, {
    life: 1.08,
    startScale: 0.7,
    maxScale: 15,
    opacity: 0.72,
    rotation: -Math.PI / 12,
    rotationSpeed: -1.65,
    z: 0.38,
  });
  createExplosionRays(position);
  createExplosionDebris(position);
  state.shake = 0.95;
}

function emitPowerupSparkles(powerup) {
  for (let i = 0; i < 2; i++) {
    const sparkle = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.035 + Math.random() * 0.055, 0),
      new THREE.MeshBasicMaterial({
        color: Math.random() > 0.28 ? powerup.userData.color : 0xffffff,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    sparkle.position.copy(powerup.position);
    sparkle.position.x += (Math.random() - 0.5) * 0.7;
    sparkle.position.y += (Math.random() - 0.5) * 0.28;
    sparkle.position.z += (Math.random() - 0.5) * 0.35;
    const life = (0.38 + Math.random() * 0.38) * 5;
    sparkle.userData = {
      vx: (Math.random() - 0.5) * 0.8,
      vy: 0.15 + Math.random() * 0.55,
      vz: (Math.random() - 0.5) * 0.7,
      life,
      maxLife: life,
      sparkle: true,
    };
    world.add(sparkle);
    particles.push(sparkle);
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
  if (state.lives <= 0) {
    player.userData.destroyed = true;
    createPlayerExplosion(player.position);
  }
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

function killEnemy(enemy, shot, {
  skipStageClear = false,
  suppressDrop = false,
  suppressScavenger = false,
  quiet = false,
} = {}) {
  enemy.userData.hp -= shot.userData.damage;
  burst(shot.position, enemy.userData.hp <= 0 ? COLORS.pink : COLORS.cyan, enemy.userData.hp <= 0 ? 16 : 5);
  if (enemy.userData.hp > 0) {
    enemy.scale.multiplyScalar(0.94);
    if (!quiet) sfx("hit");
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
  const scoreMultiplier = state.powers.multiplier > 0 ? 2 : 1;
  state.score += points * state.stage * scoreMultiplier;
  updateHud();
  state.shake = 0.13;
  if (!quiet) sfx("explode");
  if (state.powers.scavenger > 0 && !suppressScavenger) createScavengerDrone(enemy.position);
  if (!suppressDrop && Math.random() < Math.min(0.1386, (0.045 + state.stage * 0.0048) * 1.05)) spawnPowerup(enemy.position);
  world.remove(enemy);
  enemies.splice(enemies.indexOf(enemy), 1);
  if (!skipStageClear && enemies.length === 0) completeStage();
}

function completeStage() {
  if (state.mode !== "playing") return;
  state.mode = "transition";
  if (player?.userData.beam) player.userData.beam.visible = false;
  beginPowerupTransitionFade();
  const stageBonus = 1000 * state.stage * (state.powers.multiplier > 0 ? 2 : 1);
  state.score += stageBonus;
  updateHud();
  sfx("success");
  showMessage("WAVE ERASED", `STAGE ${String(state.stage).padStart(2, "0")} CLEAR`, `BONUS +${stageBonus}`, 950);
  setTimeout(() => {
    if (state.mode !== "transition") return;
    state.stage++;
    updateHud();
    showMessage("WARNING // THREAT RISING", `STAGE ${String(state.stage).padStart(2, "0")}`, stageSubtitle(), 750);
    setTimeout(() => {
      if (state.mode !== "transition") return;
      spawnStage();
      state.mode = "playing";
      ui.message.classList.remove("visible");
    }, 750);
  }, 1000);
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
  if (gamepadInput.active) {
    gamepadNavigation.returnFocus = gamepadNavigation.focus;
    gamepadNavigation.index = 0;
    clearGamepadFocus();
  }
  ui.leaderboard.classList.remove("hidden");
  if (portalsReady) refreshLeaderboard();
}

function closeLeaderboard() {
  ui.leaderboard.classList.add("hidden");
  if (gamepadInput.active) restoreGamepadFocus();
}

function renderPowerupGuide() {
  ui.powerupGuideList.replaceChildren(...POWERUP_GUIDE.map((power) => {
    const entry = document.createElement("article");
    entry.className = "powerup-guide-entry";
    entry.tabIndex = -1;
    entry.style.setProperty("--power-color", `#${power.color.toString(16).padStart(6, "0")}`);

    const icon = document.createElement("span");
    icon.className = "powerup-guide-icon";
    icon.textContent = power.icon;
    icon.setAttribute("aria-hidden", "true");

    const details = document.createElement("div");
    const name = document.createElement("span");
    name.className = "powerup-guide-name";
    name.textContent = power.name;
    const description = document.createElement("p");
    description.className = "powerup-guide-description";
    description.textContent = power.description;
    details.append(name, description);
    entry.append(icon, details);
    return entry;
  }));
}

function openPowerups() {
  if (gamepadInput.active) {
    gamepadNavigation.returnFocus = gamepadNavigation.focus;
    gamepadNavigation.index = 0;
    clearGamepadFocus();
  }
  renderPowerupGuide();
  ui.powerups.classList.remove("hidden");
  ui.powerups.setAttribute("aria-hidden", "false");
}

function closePowerups() {
  ui.powerups.classList.add("hidden");
  ui.powerups.setAttribute("aria-hidden", "true");
  if (gamepadInput.active) restoreGamepadFocus();
}

function updateMouseButtonSetting() {
  const moveAndShoot = state.mouseButtonMode === MOUSE_BUTTON_MODES.MOVE_AND_SHOOT;
  ui.mouseModeMove.setAttribute("aria-pressed", String(moveAndShoot));
  ui.mouseModeShoot.setAttribute("aria-pressed", String(!moveAndShoot));
  ui.mouseControlHint.textContent = moveAndShoot ? "HOLD TO MOVE + FIRE" : "CLICK TO FIRE ONLY";
}

function setMouseButtonMode(mode) {
  state.mouseButtonMode = mode;
  updateMouseButtonSetting();
}

function resetGame() {
  stopMusic();
  musicStep = 0;
  clearEntities();
  if (player?.userData.beam) world.remove(player.userData.beam);
  if (player) world.remove(player);
  Object.assign(state, {
    mode: "transition",
    paused: false,
    score: 0,
    stage: 1,
    lives: 3,
    formationTime: 0,
    singularityPulseTimer: 0,
    powers: Object.fromEntries(Object.keys(POWER_DEFS).map((type) => [type, 0])),
    shake: 0,
  });
  player = createPlayer();
  syncPowerHud();
  ui.start.classList.remove("visible");
  ui.gameOver.classList.remove("visible");
  ui.menuToggle.hidden = false;
  ui.pauseControls.hidden = true;
  ui.continueRun.hidden = true;
  ui.quitRun.hidden = true;
  updateHud();
  initAudio();
  startMusic();
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
  ui.menuToggle.hidden = true;
  ui.pauseControls.hidden = true;
  if (player?.userData.beam) player.userData.beam.visible = false;
  stopMusic();
  sfx("gameover");
  submitGameScore();
}

function togglePause() {
  if (!["playing", "paused"].includes(state.mode)) return;
  state.paused = !state.paused;
  state.mode = state.paused ? "paused" : "playing";
  if (state.paused) {
    if (player?.userData.beam) player.userData.beam.visible = false;
    stopMusic();
    updateMouseButtonSetting();
    updateVolumeControls();
    ui.pauseControls.hidden = false;
    ui.continueRun.hidden = false;
    ui.quitRun.hidden = false;
    showMessage("SIGNAL SUSPENDED", "PAUSED", "PRESS START OR ESC TO RESUME");
  } else {
    startMusic();
    ui.pauseControls.hidden = true;
    ui.continueRun.hidden = true;
    ui.quitRun.hidden = true;
    ui.message.classList.remove("visible");
  }
}

function quitRun() {
  if (!["playing", "paused"].includes(state.mode)) return;
  stopMusic();
  clearEntities();
  if (player?.userData.beam) world.remove(player.userData.beam);
  if (player) world.remove(player);
  player = null;
  Object.assign(state, {
    mode: "title",
    paused: false,
    score: 0,
    stage: 1,
    lives: 3,
    formationTime: 0,
    singularityPulseTimer: 0,
    powers: Object.fromEntries(Object.keys(POWER_DEFS).map((type) => [type, 0])),
    shake: 0,
  });
  ui.pauseControls.hidden = true;
  ui.continueRun.hidden = true;
  ui.quitRun.hidden = true;
  ui.menuToggle.hidden = true;
  ui.message.classList.remove("visible");
  ui.gameOver.classList.remove("visible");
  ui.start.classList.add("visible");
  syncPowerHud();
  updateHud();
}

function flash() {
  ui.flash.classList.remove("active");
  void ui.flash.offsetWidth;
  ui.flash.classList.add("active");
}

function updateVolumeControls() {
  const controls = [
    [ui.masterVolume, ui.masterVolumeValue, state.masterVolume],
    [ui.sfxVolume, ui.sfxVolumeValue, state.sfxVolume],
    [ui.musicVolume, ui.musicVolumeValue, state.musicVolume],
  ];
  for (const [input, output, value] of controls) {
    const percentage = Math.round(value * 100);
    input.value = String(percentage);
    output.value = `${percentage}%`;
    output.textContent = `${percentage}%`;
  }
}

function applyAudioVolumes() {
  if (!audio) return;
  const now = audio.currentTime;
  audioMasterBus?.gain.setTargetAtTime(state.masterVolume, now, 0.015);
  sfxBus?.gain.setTargetAtTime(state.sfxVolume, now, 0.015);
  musicBus?.gain.setTargetAtTime(0.42 * state.musicVolume, now, 0.015);
}

function setAudioVolume(key, value) {
  state[key] = THREE.MathUtils.clamp(Number(value) / 100, 0, 1);
  updateVolumeControls();
  applyAudioVolumes();
  if (key !== "musicVolume") return;
  if (state.musicVolume <= 0) stopMusic();
  else if (!musicTimer && ["playing", "transition"].includes(state.mode)) startMusic();
}

function initAudio() {
  if (!audio) {
    audio = new (window.AudioContext || window.webkitAudioContext)();
    audioMasterBus = audio.createGain();
    sfxBus = audio.createGain();
    sfxBus.connect(audioMasterBus);
    audioMasterBus.connect(audio.destination);
  }
  applyAudioVolumes();
  if (audio.state === "suspended") audio.resume();
}

const MUSIC_BPM = 132;
const MUSIC_STEP_SECONDS = 60 / MUSIC_BPM / 4;
const ASSAULT_MUSIC_BPM = 160;
const ASSAULT_MUSIC_STEP_SECONDS = 60 / ASSAULT_MUSIC_BPM / 4;
const MUSIC_CHORDS = [
  [50, 53, 57, 60], // Dm7
  [46, 50, 53, 57], // Bbmaj7
  [53, 57, 60, 64], // Fmaj7
  [48, 52, 55, 62], // Cadd9
];
const MUSIC_BASS = [26, 22, 29, 24];
const ASSAULT_MUSIC_CHORDS = [
  [50, 53, 57, 62], // Dm
  [48, 52, 55, 60], // C
  [46, 50, 53, 58], // Bb
  [45, 49, 52, 57], // A
];
const ASSAULT_MUSIC_BASS = [26, 24, 22, 21];

function midiFrequency(note) {
  return 440 * 2 ** ((note - 69) / 12);
}

function scheduleTone(note, time, duration, {
  type = "triangle",
  volume = 0.02,
  attack = 0.01,
  cutoff = 2200,
  detune = 0,
} = {}) {
  if (!audio || !musicBus) return;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  const filter = audio.createBiquadFilter();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(midiFrequency(note), time);
  oscillator.detune.setValueAtTime(detune, time);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(cutoff, time);
  filter.Q.setValueAtTime(1.2, time);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(volume, time + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(musicBus);
  oscillator.start(time);
  oscillator.stop(time + duration + 0.03);
}

function scheduleMusicStep(step, time) {
  const barStep = step % 16;
  const chordIndex = Math.floor(step / 16) % MUSIC_CHORDS.length;
  const chord = MUSIC_CHORDS[chordIndex];

  // Warm seventh-chord beds bring back the first cue's open, vaporwave space.
  if (barStep === 0) {
    chord.forEach((note, index) => {
      scheduleTone(note, time, MUSIC_STEP_SECONDS * 11.5, {
        type: index % 2 ? "triangle" : "sine",
        volume: 0.01,
        attack: 0.1,
        cutoff: 1450,
        detune: index % 2 ? 5 : -5,
      });
    });
  }

  // A brighter inversion at the midpoint turns the pad into an arcade chord hit.
  if (barStep === 8) {
    [chord[0] + 12, chord[2] + 12, chord[3] + 12].forEach((note) => {
      scheduleTone(note, time, MUSIC_STEP_SECONDS * 2.8, {
        type: "sawtooth",
        volume: 0.008,
        attack: 0.006,
        cutoff: 2100,
      });
    });
  }

  // Syncopated octave bass retains the second cue's forward thrust.
  const bassSteps = [0, 3, 6, 8, 11, 14];
  const bassIndex = bassSteps.indexOf(barStep);
  if (bassIndex !== -1) {
    const octave = bassIndex === 2 || bassIndex === 5 ? 12 : 0;
    scheduleTone(MUSIC_BASS[chordIndex] + octave, time, MUSIC_STEP_SECONDS * 1.35, {
      type: "sawtooth",
      volume: octave ? 0.017 : 0.027,
      attack: 0.004,
      cutoff: octave ? 820 : 580,
    });
  }

  // Each bar grows from spacious eighth notes into a sixteenth-note pursuit.
  const pulseActive = barStep < 8 ? barStep % 2 === 0 : true;
  if (pulseActive) {
    const arpPattern = [0, 2, 1, 3, 2, 1, 3, 1, 0, 1, 2, 3, 2, 1, 3, 2];
    const arpOctave = barStep === 15 ? 24 : 12;
    scheduleTone(chord[arpPattern[barStep]] + arpOctave, time, MUSIC_STEP_SECONDS * 0.75, {
      type: "square",
      volume: barStep % 4 === 0 ? 0.008 : 0.005,
      attack: 0.002,
      cutoff: 2850,
    });
  }

  // Sparse triangle-wave answers add a memorable space-action melody.
  const leadSteps = [2, 7, 10, 15];
  const leadIndex = leadSteps.indexOf(barStep);
  if (leadIndex !== -1) {
    const leadPattern = [2, 3, 1, 2];
    scheduleTone(chord[leadPattern[leadIndex]] + 24, time, MUSIC_STEP_SECONDS * 2.1, {
      type: "triangle",
      volume: 0.0085,
      attack: 0.01,
      cutoff: 3600,
    });
  }
}

function scheduleAssaultMusicStep(step, time) {
  const barStep = step % 16;
  const chordIndex = Math.floor(step / 16) % ASSAULT_MUSIC_CHORDS.length;
  const chord = ASSAULT_MUSIC_CHORDS[chordIndex];

  // Shorter, darker chord beds preserve the vaporwave harmony without softening the pace.
  if (barStep === 0 || barStep === 8) {
    const inversion = barStep === 8 ? [chord[1], chord[2], chord[3]] : chord;
    inversion.forEach((note, index) => {
      scheduleTone(note + (barStep === 8 ? 12 : 0), time, ASSAULT_MUSIC_STEP_SECONDS * 6.5, {
        type: index % 2 ? "triangle" : "sine",
        volume: barStep === 8 ? 0.006 : 0.007,
        attack: 0.018,
        cutoff: barStep === 8 ? 2100 : 1200,
        detune: index % 2 ? 6 : -6,
      });
    });
  }

  // A lighter syncopated bass line keeps the second cue moving without crowding it.
  const bassPattern = [0, 0, 12, 0, 0, 12, 0, 7, 0, 12, 0, 0, 12, 0, 7, 12];
  if (barStep % 2 === 0 || [7, 15].includes(barStep)) {
    scheduleTone(ASSAULT_MUSIC_BASS[chordIndex] + bassPattern[barStep], time, ASSAULT_MUSIC_STEP_SECONDS * 0.82, {
      type: "sawtooth",
      volume: barStep % 4 === 0 ? 0.023 : 0.016,
      attack: 0.002,
      cutoff: barStep % 4 === 0 ? 680 : 880,
    });
  }

  // Broken sixteenth-note motion keeps the pursuit moving while leaving breathing room.
  const arpPattern = [0, 2, 1, 3, 1, 2, 3, 2, 0, 3, 1, 2, 3, 1, 2, 3];
  if (![1, 5, 9, 13].includes(barStep)) {
    const arpOctave = [3, 7, 11, 15].includes(barStep) ? 24 : 12;
    scheduleTone(chord[arpPattern[barStep]] + arpOctave, time, ASSAULT_MUSIC_STEP_SECONDS * 0.68, {
      type: "square",
      volume: barStep % 4 === 0 ? 0.0075 : 0.0048,
      attack: 0.002,
      cutoff: 3000,
    });
  }

  // Angular lead bursts answer the arpeggio without introducing percussion.
  const leadPattern = [2, null, null, 2, null, null, 2, 3, 2, null, null, 1, null, null, 3, 2];
  const leadNote = leadPattern[barStep];
  if (leadNote !== null) {
    scheduleTone(chord[leadNote] + 24 + (barStep >= 12 ? 12 : 0), time, ASSAULT_MUSIC_STEP_SECONDS * 1.25, {
      type: "triangle",
      volume: barStep % 4 === 0 ? 0.0085 : 0.0058,
      attack: 0.005,
      cutoff: 3800,
    });
  }
}

function startMusic() {
  if (state.musicVolume <= 0 || musicTimer || !["playing", "transition"].includes(state.mode)) return;
  initAudio();
  musicBus = audio.createGain();
  const compressor = audio.createDynamicsCompressor();
  musicBus.gain.setValueAtTime(0.42 * state.musicVolume, audio.currentTime);
  compressor.threshold.setValueAtTime(-22, audio.currentTime);
  compressor.knee.setValueAtTime(18, audio.currentTime);
  compressor.ratio.setValueAtTime(4, audio.currentTime);
  musicBus.connect(compressor);
  compressor.connect(audioMasterBus);
  nextMusicTime = audio.currentTime + 0.06;
  musicTimer = window.setInterval(() => {
    while (nextMusicTime < audio.currentTime + 0.12) {
      const requestedTrack = state.stage >= 6 ? "assault" : "original";
      if (activeMusicTrack !== requestedTrack) {
        activeMusicTrack = requestedTrack;
        musicStep = 0;
      }
      if (requestedTrack === "assault") scheduleAssaultMusicStep(musicStep, nextMusicTime);
      else scheduleMusicStep(musicStep, nextMusicTime);
      musicStep = (musicStep + 1) % 64;
      nextMusicTime += requestedTrack === "assault" ? ASSAULT_MUSIC_STEP_SECONDS : MUSIC_STEP_SECONDS;
    }
  }, 25);
}

function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
  if (musicBus && audio) {
    const oldBus = musicBus;
    musicBus = null;
    oldBus.gain.cancelScheduledValues(audio.currentTime);
    oldBus.gain.setValueAtTime(Math.max(0.0001, oldBus.gain.value), audio.currentTime);
    oldBus.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.08);
    window.setTimeout(() => oldBus.disconnect(), 150);
  }
}

function sfx(kind) {
  if (!audio) initAudio();
  if (!audio || state.masterVolume <= 0 || state.sfxVolume <= 0) return;
  if (kind === "gameover") {
    const now = audio.currentTime + 0.04;
    const notes = [392, 329.63, 261.63, 196];
    notes.forEach((frequency, index) => {
      const start = now + index * 0.16;
      const duration = index === notes.length - 1 ? 0.65 : 0.22;
      const oscillator = audio.createOscillator();
      const filter = audio.createBiquadFilter();
      const gain = audio.createGain();
      oscillator.type = index === notes.length - 1 ? "sawtooth" : "triangle";
      oscillator.frequency.setValueAtTime(frequency, start);
      if (index === notes.length - 1) {
        oscillator.frequency.exponentialRampToValueAtTime(98, start + duration);
      }
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(index === notes.length - 1 ? 950 : 1800, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(index === notes.length - 1 ? 0.028 : 0.022, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(sfxBus);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.03);
    });
    return;
  }
  if (kind === "success") {
    const now = audio.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = index === 3 ? "square" : "triangle";
      oscillator.frequency.setValueAtTime(frequency, now + index * 0.085);
      gain.gain.setValueAtTime(0.0001, now + index * 0.085);
      gain.gain.exponentialRampToValueAtTime(index === 3 ? 0.01875 : 0.024, now + index * 0.085 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.085 + 0.2);
      oscillator.connect(gain);
      gain.connect(sfxBus);
      oscillator.start(now + index * 0.085);
      oscillator.stop(now + index * 0.085 + 0.22);
    });
    return;
  }
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.connect(gain);
  gain.connect(sfxBus);
  const now = audio.currentTime;
  const settings = {
    shoot: [440, 210, 0.06, "sawtooth", 0.0165],
    enemy: [180, 90, 0.09, "sawtooth", 0.0135],
    hit: [130, 65, 0.08, "square", 0.0225],
    explode: [95, 28, 0.28, "sawtooth", 0.035],
    power: [320, 1280, 0.45, "sine", 0.045],
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
  if (player.userData.destroyed) {
    player.visible = false;
    updatePlasmaBeam(dt, false);
    return;
  }
  const movingLeft = keys.has("ArrowLeft") || keys.has("KeyA");
  const movingRight = keys.has("ArrowRight") || keys.has("KeyD");
  const movingUp = keys.has("ArrowUp") || keys.has("KeyW");
  const movingDown = keys.has("ArrowDown") || keys.has("KeyS");
  let targetVelocityX = ((movingRight ? 1 : 0) - (movingLeft ? 1 : 0)) * 12;
  let targetVelocityY = ((movingUp ? 1 : 0) - (movingDown ? 1 : 0)) * 10;
  const mouseMovesShip = state.mouseButtonMode === MOUSE_BUTTON_MODES.MOVE_AND_SHOOT;
  const pointerMovesShip = pointerDown && (mouseMovesShip || activePointerType !== "mouse");
  if (pointerMovesShip) {
    const targetX = pointerX * 13.3;
    const targetY = THREE.MathUtils.clamp(pointerY * 11 - 2.5, -10, 4);
    targetVelocityX = THREE.MathUtils.clamp((targetX - player.position.x) * 8, -16, 16);
    targetVelocityY = THREE.MathUtils.clamp((targetY - player.position.y) * 8, -13, 13);
  }
  if (gamepadInput.moveX !== 0 || gamepadInput.moveY !== 0) {
    targetVelocityX = gamepadInput.moveX * 12;
    targetVelocityY = -gamepadInput.moveY * 10;
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
  const dronesActive = state.powers.drones > 0;
  player.userData.drones.forEach((drone, index) => {
    drone.visible = dronesActive;
    drone.position.y = -0.2 + Math.sin(clock.elapsedTime * 4 + index * Math.PI) * 0.18;
    drone.rotation.z += dt * (index === 0 ? -1.8 : 1.8);
  });
  updateDecoy(dt);
  updateReflectorField(dt);
  if (state.powers.reflector > 0) {
    player.userData.reflectorTimer -= dt;
    if (player.userData.reflectorTimer <= 0) {
      reflectEnemyShots();
      player.userData.reflectorTimer = 0.82;
    }
  }
  player.userData.fireTimer -= dt;
  player.userData.invulnerable -= dt;
  if (player.userData.invulnerable > 0) player.visible = Math.floor(player.userData.invulnerable * 12) % 2 === 0;
  else player.visible = true;
  const firing = keys.has("Space") || pointerDown || gamepadInput.firing;
  updatePlasmaBeam(dt, firing);
  if (firing) shootPlayer(state.powers.plasma > 0);
}

function updateSingularity(dt) {
  if (state.powers.singularity <= 0) return;
  const centerX = player.position.x;
  const centerY = THREE.MathUtils.clamp(player.position.y + 4.6, -1, 7.5);
  const radius = 9.5;
  const affected = [];
  for (const enemy of [...enemies]) {
    if (enemy.userData.respawning) continue;
    const dx = centerX - enemy.position.x;
    const dy = centerY - enemy.position.y;
    const distance = Math.hypot(dx, dy);
    if (distance >= radius) continue;
    const pull = 5.8 * SINGULARITY_EFFECTIVENESS * (1 - distance / radius);
    enemy.position.x += dx / (distance || 1) * pull * dt;
    enemy.position.y += dy / (distance || 1) * pull * dt;
    affected.push(enemy);
  }

  state.singularityPulseTimer -= dt;
  if (state.singularityPulseTimer > 0) return;
  state.singularityPulseTimer = 0.72;
  burst({ x: centerX, y: centerY, z: 0 }, POWER_DEFS.singularity.color, 14);
  for (const enemy of affected) {
    if (!enemies.includes(enemy)) continue;
    killEnemy(enemy, {
      position: enemy.position,
      userData: { damage: SINGULARITY_EFFECTIVENESS },
    });
  }
}

function updateEnemies(dt) {
  const slow = state.powers.chrono > 0 ? 0.48 : 1;
  const enemyDt = state.powers.emp > 0 ? 0 : dt * slow;
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
      const formationX = d.homeX + sway + Math.sin(d.phase) * 0.09 + phantomDrift;
      const formationY = d.homeY + Math.sin(d.phase * 0.65) * 0.12;
      enemy.position.x = formationX;
      if (d.respawning) {
        d.respawnT += enemyDt;
        const phaseIn = Math.min(1, d.respawnT / 0.8);
        const phaseEase = phaseIn * phaseIn * (3 - 2 * phaseIn);
        enemy.position.y = THREE.MathUtils.lerp(14, formationY, phaseEase);
        enemy.rotation.z = (1 - phaseEase) * Math.PI * 1.5 + Math.sin(d.phase) * 0.12;
        d.wireMaterial.opacity = 0.98 * phaseEase;
        d.auraMaterial.uniforms.glowOpacity.value = phaseEase;
        if (phaseIn >= 1) {
          d.respawning = false;
          d.respawnT = 0;
          d.wireMaterial.opacity = 0.98;
          d.auraMaterial.uniforms.glowOpacity.value = 1;
        }
      } else {
        enemy.position.y = THREE.MathUtils.lerp(18 + d.row * 2, formationY, ease);
        enemy.rotation.z = Math.sin(d.phase) * 0.12;
      }
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
        d.respawning = true;
        d.respawnT = 0;
        enemy.position.set(d.homeX, 14, 0);
        d.wireMaterial.opacity = 0;
        d.auraMaterial.uniforms.glowOpacity.value = 0;
        enemy.visible = true;
      }
    }
    if (intersects(enemy, player)) {
      hitPlayer();
      if (d.diving) {
        burst(enemy.position, COLORS.pink, 18);
        world.remove(enemy);
        enemies.splice(enemies.indexOf(enemy), 1);
        if (state.mode === "playing" && state.lives > 0 && enemies.length === 0) completeStage();
        break;
      }
    }
  }

  updateSingularity(dt);

  if (state.powers.emp <= 0 && entrance >= 1 && enemies.length) {
    if (state.enemyFireTimer <= 0) {
      const candidates = enemies.filter((e) => e.position.y > -3 && !e.userData.respawning);
      if (candidates.length) shootEnemy(candidates[Math.floor(Math.random() * candidates.length)]);
      const fireInterval = ENEMY_FIRE_INTERVAL_BASE - state.stage * ENEMY_FIRE_INTERVAL_STAGE_SCALE;
      state.enemyFireTimer = Math.max(
        ENEMY_FIRE_INTERVAL_MIN,
        fireInterval * (0.86 + Math.random() * 0.38)
      );
    }
    const diving = enemies.filter((e) => e.userData.diving).length;
    const maxDivers = Math.min(4, 1 + Math.floor(state.stage / 3));
    if (diving < maxDivers && Math.random() < dt * (0.15 + state.stage * 0.055)) {
      const candidates = enemies.filter((e) => !e.userData.diving && !e.userData.respawning && e.userData.row <= 2);
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
    if (shot.userData.homing && enemies.length) {
      let target = enemies[0];
      let nearestDistance = Infinity;
      for (const enemy of enemies) {
        const distance = shot.position.distanceToSquared(enemy.position);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          target = enemy;
        }
      }
      const dx = target.position.x - shot.position.x;
      const dy = target.position.y - shot.position.y;
      const length = Math.hypot(dx, dy) || 1;
      const turn = 1 - Math.exp(-dt * 7);
      shot.userData.vx = THREE.MathUtils.lerp(shot.userData.vx, dx / length * 15, turn);
      shot.userData.vy = THREE.MathUtils.lerp(shot.userData.vy, dy / length * 15, turn);
      shot.rotation.z = -Math.atan2(shot.userData.vx, shot.userData.vy);
    }
    shot.position.x += shot.userData.vx * dt;
    shot.position.y += shot.userData.vy * dt;
    let hit = false;
    for (let j = enemies.length - 1; j >= 0; j--) {
      if (intersects(shot, enemies[j])) {
        const hitEnemy = enemies[j];
        killEnemy(hitEnemy, shot);
        if (state.mode === "playing" && shot.userData.chain) triggerChainLightning(hitEnemy);
        hit = true;
        break;
      }
    }
    if (hit || shot.position.y > 14 || shot.position.y < -13 || Math.abs(shot.position.x) > 17) removeAt(playerShots, i);
  }

  const enemyProjectileDt = state.powers.chrono > 0 ? dt * 0.48 : dt;
  for (let i = enemyShots.length - 1; i >= 0; i--) {
    const shot = enemyShots[i];
    shot.position.x += shot.userData.vx * enemyProjectileDt;
    shot.position.y += shot.userData.vy * enemyProjectileDt;
    if (shot.userData.reflected) {
      let hitEnemy = false;
      for (let j = enemies.length - 1; j >= 0; j--) {
        if (!intersects(shot, enemies[j])) continue;
        burst(shot.position, POWER_DEFS.reflector.color, 8);
        killEnemy(enemies[j], {
          position: shot.position,
          userData: { damage: shot.userData.damage || 2 },
        });
        hitEnemy = true;
        break;
      }
      if (hitEnemy || shot.position.y > 14 || shot.position.y < -13 || Math.abs(shot.position.x) > 17) {
        removeAt(enemyShots, i);
      }
    } else if (shot.userData.target === "decoy" && decoy?.visible && intersects(shot, decoy)) {
      burst(shot.position, POWER_DEFS.decoy.color, 7);
      removeAt(enemyShots, i);
    } else if (intersects(shot, player)) {
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
    if (state.powers.magnet > 0) {
      const dx = player.position.x - p.position.x;
      const dy = player.position.y - p.position.y;
      const distance = Math.hypot(dx, dy) || 1;
      p.position.x += dx / distance * 9 * dt;
      p.position.y += (dy / distance * 9 + p.userData.vy * 0.2) * dt;
    } else {
      p.position.y += p.userData.vy * dt;
    }
    data.sparkleTimer -= dt;
    if (data.sparkleTimer <= 0) {
      emitPowerupSparkles(p);
      data.sparkleTimer = 0.045;
    }
    p.rotation.z += dt * 0.42;
    data.outerRing.rotation.z += dt * 1.6;
    data.outerRing.rotation.x = Math.sin(data.phase * 1.8) * 0.24;
    data.innerRing.rotation.y += dt * 2.25;
    data.innerRing.rotation.x -= dt * 0.85;
    data.core.rotation.x += dt * 1.35;
    data.core.rotation.y -= dt * 1.7;
    data.orbit.rotation.z -= dt * 2.8;
    if (data.starburst) {
      data.starburst.rotation.z += dt * 1.15;
      data.starburst.scale.setScalar(0.92 + Math.sin(data.phase * 8) * 0.12);
      data.starburst.children[0].material.opacity = 0.6 + Math.sin(data.phase * 7) * 0.2;
      data.accentLight.intensity = 7.5 + Math.sin(data.phase * 9) * 3;
    }
    const pulse = 1 + Math.sin(data.phase * 6) * 0.09;
    p.scale.setScalar(pulse);
    const haloBase = data.type === "extra-ship" ? 0.78 : 0.44;
    const haloPulse = data.type === "extra-ship" ? 0.2 : 0.12;
    data.halo.material.uniforms.glowStrength.value = haloBase + Math.sin(data.phase * 5) * haloPulse;
    data.halo.scale.setScalar(0.92 + Math.sin(data.phase * 4) * 0.1);
    data.light.intensity = (data.type === "extra-ship" ? 10.5 : 6.2) + Math.sin(data.phase * 7) * 2.1;
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
    const data = p.userData;
    data.life -= dt;
    p.position.x += data.vx * dt;
    p.position.y += data.vy * dt;
    p.position.z += data.vz * dt;
    data.vx *= Math.pow(0.965, dt * 60);
    data.vy *= Math.pow(0.965, dt * 60);
    const lifeRatio = Math.max(0, data.life / data.maxLife);
    const progress = 1 - lifeRatio;
    let opacity = lifeRatio * (data.opacity ?? 1);
    if (!data.effect) p.rotation.x += dt * 8;
    if (data.effect === "shockwave") {
      const scale = data.startScale + progress * data.maxScale;
      p.scale.set(scale, scale * (1 + Math.sin(progress * Math.PI) * 0.08), 1);
      p.rotation.z += dt * data.rotationSpeed;
      opacity *= 1 - progress * progress;
    } else if (data.effect === "explosion-flash") {
      const scale = 0.15 + Math.sin(progress * Math.PI * 0.72) * data.maxScale;
      p.scale.setScalar(Math.max(0.15, scale));
      opacity *= Math.pow(lifeRatio, 1.8);
    } else if (data.effect === "explosion-ray") {
      p.scale.x = 0.7 + lifeRatio * 0.6;
      p.scale.y = 0.5 + Math.sin(progress * Math.PI) * 1.8;
      opacity *= Math.sin(Math.min(1, progress * 2.5) * Math.PI / 2);
    } else if (data.effect === "explosion-debris") {
      p.rotation.x += dt * data.spinX;
      p.rotation.y += dt * data.spinY;
      p.rotation.z += dt * data.spinZ;
      data.vy -= dt * 1.8;
    }
    p.material.opacity = Math.max(0, opacity);
    if (data.sparkle) {
      const scale = Math.max(0.05, lifeRatio);
      p.scale.setScalar(scale);
      p.rotation.z += dt * 11;
    }
    if (data.life <= 0) removeAt(particles, i);
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
  updateGamepadInput();
  handleGamepadMenus(dt);
  if (state.mode === "playing") {
    updatePlayer(dt);
    updatePowerups(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updateScavengerDrones(dt);
    updateParticles(dt);
  } else if (state.mode === "transition") {
    updateTransitionPowerups(dt);
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
  setGamepadNavigationActive(false);
  keys.add(event.code);
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(event.code)) event.preventDefault();
  if (event.code === "Escape" && !event.repeat) {
    event.preventDefault();
    togglePause();
  }
});
addEventListener("keyup", (event) => keys.delete(event.code));
addEventListener("gamepadconnected", (event) => {
  if (gamepadInput.index === null) gamepadInput.index = event.gamepad.index;
  setGamepadNavigationActive(true);
});
addEventListener("gamepaddisconnected", (event) => {
  if (gamepadInput.index !== event.gamepad.index) return;
  gamepadInput.index = null;
  gamepadInput.buttons = [];
  gamepadInput.moveX = 0;
  gamepadInput.moveY = 0;
  gamepadInput.firing = false;
  setGamepadNavigationActive(false);
});
addEventListener("pointerdown", () => setGamepadNavigationActive(false));
addEventListener("contextmenu", (event) => event.preventDefault());
addEventListener("selectstart", (event) => event.preventDefault());
canvas.addEventListener("pointerdown", (event) => {
  if (state.mode !== "playing") return;
  pointerDown = true;
  activePointerType = event.pointerType;
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
ui.powerupsButton.addEventListener("click", openPowerups);
ui.leaderboardClose.addEventListener("click", closeLeaderboard);
ui.leaderboardSignIn.addEventListener("click", requestPortalsLogin);
ui.leaderboard.addEventListener("click", (event) => {
  if (event.target === ui.leaderboard) closeLeaderboard();
});
ui.powerupsClose.addEventListener("click", closePowerups);
ui.powerups.addEventListener("click", (event) => {
  if (event.target === ui.powerups) closePowerups();
});
ui.menuToggle.addEventListener("click", togglePause);
ui.continueRun.addEventListener("click", togglePause);
ui.quitRun.addEventListener("click", quitRun);
ui.mouseModeMove.addEventListener("click", () => setMouseButtonMode(MOUSE_BUTTON_MODES.MOVE_AND_SHOOT));
ui.mouseModeShoot.addEventListener("click", () => setMouseButtonMode(MOUSE_BUTTON_MODES.SHOOT_ONLY));
ui.masterVolume.addEventListener("input", (event) => setAudioVolume("masterVolume", event.target.value));
ui.sfxVolume.addEventListener("input", (event) => setAudioVolume("sfxVolume", event.target.value));
ui.musicVolume.addEventListener("input", (event) => setAudioVolume("musicVolume", event.target.value));

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
updateMouseButtonSetting();
updateVolumeControls();

const fontsReady = document.fonts?.ready ?? Promise.resolve();
fontsReady.then(() => document.documentElement.classList.add("app-ready"));
