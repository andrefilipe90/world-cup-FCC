const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const gameShell = document.querySelector(".game-shell");
const coinHud = document.getElementById("coinHud");
const positionEl = document.getElementById("position");
const speedEl = document.getElementById("speed");
const powerHud = document.getElementById("powerHud");
const botHud = document.getElementById("botHud");
const onlineHud = document.getElementById("onlineHud");
const resetButton = document.getElementById("resetButton");
const eventMessage = document.getElementById("eventMessage");
const playButton = document.getElementById("playButton");
const menuStatus = document.getElementById("menuStatus");
const wardrobeButton = document.getElementById("wardrobeButton");
const wardrobePanel = document.getElementById("wardrobePanel");
const settingsButton = document.getElementById("settingsButton");
const settingsPanel = document.getElementById("settingsPanel");
const coinCounter = document.getElementById("coinCounter");
const recordCounter = document.getElementById("recordCounter");
const skinSwatches = document.getElementById("skinSwatches");
const lightnessSlider = document.getElementById("lightnessSlider");
const lightnessValue = document.getElementById("lightnessValue");
const volumeSlider = document.getElementById("volumeSlider");
const volumeValue = document.getElementById("volumeValue");
const accessoryList = document.getElementById("accessoryList");

const arena = {
  size: 2400,
  border: 34,
};

const snakeDefaults = {
  x: arena.size / 2,
  y: arena.size / 2,
  speed: 190,
  headRadius: 24,
  segmentCount: 30,
  segmentGap: 13,
};

const skins = {
  classic: {
    head: "#ffef75",
    bodyA: "#fedc5a",
    bodyB: "#e8e15a",
    stroke: "#775f1f",
    eye: "#6fd6ff",
    pupil: "#28566d",
  },
  leaf: {
    head: "#a5f27a",
    bodyA: "#7fd95f",
    bodyB: "#62bf58",
    stroke: "#2f6b37",
    eye: "#fff0a8",
    pupil: "#3f6b3f",
  },
  sky: {
    head: "#8fe3ff",
    bodyA: "#64c8f0",
    bodyB: "#4ca6de",
    stroke: "#295b78",
    eye: "#fff4b8",
    pupil: "#27556d",
  },
  berry: {
    head: "#ff9aca",
    bodyA: "#ff76b1",
    bodyB: "#e85d9d",
    stroke: "#7b315b",
    eye: "#dff7ff",
    pupil: "#5a3a79",
  },
  red: {
    head: "#ff5a5a",
    bodyA: "#ef3838",
    bodyB: "#c92834",
    stroke: "#7a2028",
    eye: "#7fe8ff",
    pupil: "#23566b",
  },
  orange: {
    head: "#ff9d3e",
    bodyA: "#f47c24",
    bodyB: "#d85b1f",
    stroke: "#7a351c",
    eye: "#d8f6ff",
    pupil: "#3d5b70",
  },
  purple: {
    head: "#b98cff",
    bodyA: "#935ee8",
    bodyB: "#7546c4",
    stroke: "#40256f",
    eye: "#fff0a8",
    pupil: "#5a3a79",
  },
  cyan: {
    head: "#6ff5dc",
    bodyA: "#39d8c1",
    bodyB: "#27a99c",
    stroke: "#1d6864",
    eye: "#fff2a6",
    pupil: "#28566d",
  },
  white: {
    head: "#f7f7ef",
    bodyA: "#dfefe5",
    bodyB: "#cce0d5",
    stroke: "#65736f",
    eye: "#70d5ff",
    pupil: "#28566d",
  },
  black: {
    head: "#3b3d48",
    bodyA: "#282b35",
    bodyB: "#1d2029",
    stroke: "#0d0f15",
    eye: "#ffe978",
    pupil: "#4c351a",
  },
  brazil: {
    head: "#1fb75a",
    bodyA: "#199b47",
    bodyB: "#2467d8",
    stroke: "#0f5fa8",
    eye: "#fffdf0",
    pupil: "#174a88",
  },
};

const skinCatalog = [
  { id: "classic", name: "Amarela", price: 0 },
  { id: "leaf", name: "Verde", price: 0 },
  { id: "sky", name: "Azul", price: 0 },
  { id: "berry", name: "Rosa", price: 0 },
  { id: "red", name: "Vermelha", price: 0 },
  { id: "orange", name: "Laranja", price: 0 },
  { id: "purple", name: "Roxa", price: 0 },
  { id: "cyan", name: "Ciano", price: 0 },
  { id: "white", name: "Branca", price: 0 },
  { id: "black", name: "Preta", price: 0 },
];

const storageKeys = {
  skin: "cobraWorldSkin",
  skinLightness: "cobraWorldSkinLightness",
  accessory: "cobraWorldAccessory",
  ownedAccessories: "cobraWorldOwnedAccessories",
  coins: "cobraWorldCoins",
  bestTime: "cobraWorldBestTime",
  volume: "cobraWorldVolume",
  playerId: "cobraWorldPlayerId",
  playerName: "cobraWorldPlayerName",
};

const accessoryCatalog = [
  { id: "roundGlasses", name: "Óculos", price: 0 },
  { id: "cap", name: "Boné", price: 0 },
  { id: "backpack", name: "Mochila", price: 0 },
  { id: "bow", name: "Laço", price: 18 },
  { id: "starHat", name: "Chapéu estrela", price: 35 },
  { id: "flower", name: "Flor", price: 28 },
  { id: "scarf", name: "Cachecol", price: 32 },
  { id: "visor", name: "Viseira", price: 42 },
  { id: "headphones", name: "Fone", price: 50 },
  { id: "wizardHat", name: "Chapéu mágico", price: 65 },
  { id: "juliette", name: "Óculos Juliette", price: 75 },
  { id: "rocketPack", name: "Mochila foguete", price: 95 },
  { id: "crown", name: "Coroa", price: 110 },
];

const freeAccessoryIds = accessoryCatalog
  .filter((accessory) => accessory.price === 0)
  .map((accessory) => accessory.id);

const itemTypes = {
  apple: {
    fill: "#f44747",
    shade: "#b82035",
    glow: "rgba(244, 71, 71, 0.28)",
    radius: 18,
  },
  turbo: {
    fill: "#48c6ff",
    shade: "#1b6fbd",
    glow: "rgba(72, 198, 255, 0.32)",
    radius: 18,
  },
  shield: {
    fill: "#65e66f",
    shade: "#218949",
    glow: "rgba(101, 230, 111, 0.32)",
    radius: 18,
  },
  brazil: {
    fill: "#1fb75a",
    shade: "#0f7a38",
    glow: "rgba(255, 223, 79, 0.38)",
    radius: 26,
  },
  magnet: {
    fill: "#ffd95a",
    shade: "#c7891e",
    glow: "rgba(255, 217, 90, 0.34)",
    radius: 18,
  },
};

const itemCounts = {
  apple: 26,
  brazil: 15,
  turbo: 6,
  shield: 5,
  magnet: 5,
};

const powerDurations = {
  turbo: 5200,
  shield: 7000,
  magnet: 6500,
};

const coinSettings = {
  count: 48,
  radius: 8,
  magnetRange: 230,
  magnetPullSpeed: 420,
};

const performanceSettings = {
  maxTrailLength: 560,
  assumedTrailSpacing: 4,
  maxCoinDrops: 82,
  hudInterval: 120,
  drawPadding: 110,
};

const onlineSettings = {
  syncInterval: 140,
  maxTrailPoints: 320,
  reconnectDelay: 1800,
  stalePlayerMs: 3000,
  roomId: "cobra-world-public-room-v1",
  peerOptions: {
    host: "0.peerjs.com",
    port: 443,
    path: "/",
    secure: true,
  },
};

const musicSettings = {
  stepMs: 175,
  leadVolume: 0.05,
  harmonyVolume: 0.025,
  masterVolume: 0.42,
  melody: [
    1174.66, 1318.51, 1567.98, 1760,
    1567.98, 1318.51, 1174.66, 987.77,
    880, 987.77, 1046.5, 1174.66,
    783.99, 880, 987.77, 659.25,
  ],
  harmony: [
    293.66, 329.63, 392, 329.63,
    261.63, 329.63, 392, 329.63,
  ],
};

const botConfigs = [
  {
    name: "Computador Azul",
    skin: "sky",
    accessory: "headphones",
    x: arena.size / 2 - 300,
    y: arena.size / 2 - 180,
  },
  {
    name: "Computador Verde",
    skin: "leaf",
    accessory: "cap",
    x: arena.size / 2 + 320,
    y: arena.size / 2 + 210,
  },
];

const state = {
  width: 0,
  height: 0,
  dpr: 1,
  camera: { x: 0, y: 0 },
  pointer: { x: snakeDefaults.x + 180, y: snakeDefaults.y, screenX: 0, screenY: 0, active: false },
  snake: makeSnake(),
  bots: [],
  onlinePlayers: [],
  items: [],
  coinDrops: [],
  mode: "menu",
  selectedSkin: readStoredText(storageKeys.skin, "classic"),
  skinLightness: readStoredNumber(storageKeys.skinLightness, 0),
  selectedAccessory: readStoredText(storageKeys.accessory, "roundGlasses"),
  playerSkinOverride: null,
  playerAccessoryOverride: null,
  ownedAccessories: readOwnedAccessories(),
  coins: readStoredNumber(storageKeys.coins, 0),
  bestTime: readStoredNumber(storageKeys.bestTime, 0),
  volume: clamp(readStoredNumber(storageKeys.volume, 100), 0, 100),
  playerId: ensureOnlinePlayerId(),
  playerName: ensureOnlinePlayerName(),
  onlineConnected: false,
  onlineSyncing: false,
  onlineLastSyncAt: 0,
  onlinePeer: null,
  onlinePeerConnecting: false,
  onlinePeerIsHost: false,
  onlineHostConnection: null,
  onlinePeerConnections: new Map(),
  onlinePeerPlayers: new Map(),
  onlinePeerLastAttemptAt: 0,
  onlinePeerLastBroadcastAt: 0,
  onlinePeerManualClose: false,
  turboUntil: 0,
  shieldUntil: 0,
  magnetUntil: 0,
  runStartedAt: 0,
  pausedAt: 0,
  pausedDuration: 0,
  lastTime: 0,
  hudLastUpdatedAt: 0,
  eventMessageTimer: 0,
  lastTapAt: 0,
  lastTapX: 0,
  lastTapY: 0,
};

const musicState = {
  context: null,
  master: null,
  timer: 0,
  step: 0,
  playing: false,
};

function makeSnake(options = {}) {
  const head = {
    x: options.x ?? snakeDefaults.x,
    y: options.y ?? snakeDefaults.y,
  };
  const trail = [];

  for (let index = 0; index < 900; index += 1) {
    trail.push({
      x: head.x - index * Math.cos(options.angle ?? 0),
      y: head.y - index * Math.sin(options.angle ?? 0),
    });
  }

  return {
    head,
    angle: options.angle ?? 0,
    trail,
    speed: options.speed ?? snakeDefaults.speed,
    segmentCount: options.segmentCount ?? snakeDefaults.segmentCount,
    segmentGap: snakeDefaults.segmentGap,
  };
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  state.dpr = dpr;
  state.width = Math.max(1, window.innerWidth);
  state.height = Math.max(1, window.innerHeight);
  canvas.width = Math.floor(state.width * dpr);
  canvas.height = Math.floor(state.height * dpr);
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (!state.pointer.active) {
    state.pointer.screenX = state.width * 0.62;
    state.pointer.screenY = state.height * 0.5;
  }
  centerCameraOnSnake();
}

function resetSnake() {
  state.snake = makeSnake();
  state.pointer = {
    x: snakeDefaults.x + 180,
    y: snakeDefaults.y,
    screenX: state.width * 0.62,
    screenY: state.height * 0.5,
    active: false,
  };
  state.items = createItems();
  state.coinDrops = createCoins();
  state.bots = createBots();
  state.onlinePlayers = [];
  state.onlineConnected = false;
  state.onlineLastSyncAt = 0;
  state.turboUntil = 0;
  state.shieldUntil = 0;
  state.magnetUntil = 0;
  state.playerSkinOverride = null;
  state.playerAccessoryOverride = null;
  state.lastTime = performance.now();
  state.hudLastUpdatedAt = 0;
  hideEventMessage();
  centerCameraOnSnake();
  updateHud(true);
}

function startGame() {
  if (state.mode === "paused") {
    resumeGame();
    return;
  }

  resetSnake();
  state.mode = "playing";
  state.runStartedAt = performance.now();
  state.pausedAt = 0;
  state.pausedDuration = 0;
  playButton.textContent = "Jogar";
  startMusic();
  syncScreenState();
}

function pauseGame() {
  if (state.mode !== "playing") {
    return;
  }

  hideEventMessage();
  state.mode = "paused";
  state.pausedAt = performance.now();
  menuStatus.textContent = "Jogo pausado";
  playButton.textContent = "Continuar";
  updateMenuCounters();
  sendOnlineLeave();
  syncScreenState();
}

function resumeGame() {
  if (state.mode !== "paused") {
    return;
  }

  if (state.pausedAt) {
    state.pausedDuration += performance.now() - state.pausedAt;
  }

  state.mode = "playing";
  state.pausedAt = 0;
  state.lastTime = performance.now();
  startMusic();
  syncScreenState();
}

function endGame(message = "Fim de jogo") {
  saveBestTime();
  stopMusic();
  hideEventMessage();
  sendOnlineLeave();
  state.mode = "menu";
  menuStatus.textContent = message;
  playButton.textContent = "Jogar de novo";
  updateMenuCounters();
  syncScreenState();
}

function syncScreenState() {
  gameShell.classList.toggle("is-playing", state.mode === "playing");
  gameShell.classList.toggle("is-menu", state.mode !== "playing");
}

function centerCameraOnSnake() {
  const snake = state.snake;
  state.camera.x = clamp(
    snake.head.x - state.width / 2,
    0,
    Math.max(0, arena.size - state.width),
  );
  state.camera.y = clamp(
    snake.head.y - state.height / 2,
    0,
    Math.max(0, arena.size - state.height),
  );
}

function screenToWorld(clientX, clientY) {
  return {
    x: clientX + state.camera.x,
    y: clientY + state.camera.y,
  };
}

function setPointer(event) {
  setPointerFromClient(event.clientX, event.clientY);
}

function setPointerFromClient(clientX, clientY) {
  state.pointer.screenX = clientX;
  state.pointer.screenY = clientY;
  updatePointerWorldTarget();
}

function updatePointerWorldTarget() {
  const worldPoint = screenToWorld(state.pointer.screenX, state.pointer.screenY);
  state.pointer.x = clamp(worldPoint.x, arena.border, arena.size - arena.border);
  state.pointer.y = clamp(worldPoint.y, arena.border, arena.size - arena.border);
}

function update(deltaSeconds) {
  if (state.mode !== "playing") {
    return;
  }

  updatePowerSpeeds();
  updatePointerWorldTarget();

  const snake = state.snake;
  const dx = state.pointer.x - snake.head.x;
  const dy = state.pointer.y - snake.head.y;
  const distance = Math.hypot(dx, dy);

  if (distance > 6) {
    snake.angle = Math.atan2(dy, dx);
  }

  snake.head.x += Math.cos(snake.angle) * snake.speed * deltaSeconds;
  snake.head.y += Math.sin(snake.angle) * snake.speed * deltaSeconds;

  if (hasHitWall()) {
    endGame();
    return;
  }

  snake.trail.unshift({ x: snake.head.x, y: snake.head.y });
  if (snake.trail.length > performanceSettings.maxTrailLength) {
    snake.trail.length = performanceSettings.maxTrailLength;
  }

  if (checkSelfCollision()) {
    endGame("Bateu no próprio corpo");
    return;
  }

  updateBots(deltaSeconds);
  collectItems();
  updateCoinDrops(deltaSeconds);
  collectCoins();
  if (checkPlayerBotCollisions()) {
    return;
  }
  if (checkPlayerOnlineCollisions()) {
    return;
  }
  syncOnlinePlayers();
  centerCameraOnSnake();
  updateHud();
}

function updateHud(force = false) {
  const now = performance.now();

  if (!force && now - state.hudLastUpdatedAt < performanceSettings.hudInterval) {
    return;
  }

  state.hudLastUpdatedAt = now;
  const snake = state.snake;
  coinHud.textContent = `Moedas ${state.coins}`;
  positionEl.textContent = `X ${Math.round(snake.head.x)} / Y ${Math.round(snake.head.y)}`;
  speedEl.textContent = `Vel ${Math.round(snake.speed)}`;
  powerHud.textContent = `Poder ${getPowerLabel()}`;
  botHud.textContent = `Computadores ${state.bots.filter((bot) => bot.alive).length}`;
  onlineHud.textContent = getOnlineStatusLabel();
}

function saveBestTime() {
  if (!state.runStartedAt) {
    return;
  }

  const aliveSeconds = Math.floor((performance.now() - state.runStartedAt - state.pausedDuration) / 1000);

  if (aliveSeconds > state.bestTime) {
    state.bestTime = aliveSeconds;
    writeStoredValue(storageKeys.bestTime, String(state.bestTime));
  }
}

function updateMenuCounters() {
  coinCounter.textContent = `Moedas ${state.coins}`;
  recordCounter.textContent = `Recordes ${formatSeconds(state.bestTime)}`;
}

function getOnlineStatusLabel() {
  if (window.location.protocol === "file:") {
    return "Online abra o link";
  }

  if (state.onlineConnected) {
    return `Online ${state.onlinePlayers.length + 1}`;
  }

  if (state.mode === "playing") {
    return "Online conectando";
  }

  return "Online 0";
}

function formatSeconds(seconds) {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function createBots() {
  return botConfigs.map((config, index) => createBot(config, index));
}

function createBot(config, index) {
  const baseSpeed = 158 + index * 12;

  return {
    id: `bot-${index}`,
    name: config.name,
    skin: config.skin,
    accessory: config.accessory,
    snake: makeSnake({
      x: config.x,
      y: config.y,
      angle: Math.random() * Math.PI * 2,
      speed: baseSpeed,
      segmentCount: 24,
    }),
    baseSpeed,
    target: randomWorldPoint(),
    alive: true,
    score: 0,
    turboUntil: 0,
    shieldUntil: 0,
    magnetUntil: 0,
    originalSkin: config.skin,
    originalAccessory: config.accessory,
    respawnAt: 0,
  };
}

function updateBots(deltaSeconds) {
  const now = performance.now();

  state.bots.forEach((bot, index) => {
    if (!bot.alive) {
      if (now >= bot.respawnAt) {
        respawnBot(bot, index);
      }
      return;
    }

    updateBotSpeed(bot);
    steerBot(bot, deltaSeconds);

    if (hasSnakeHitWall(bot.snake)) {
      defeatBot(bot);
      return;
    }

    bot.snake.trail.unshift({ x: bot.snake.head.x, y: bot.snake.head.y });
    if (bot.snake.trail.length > performanceSettings.maxTrailLength) {
      bot.snake.trail.length = performanceSettings.maxTrailLength;
    }

    if (isSnakeHeadTouchingBody(bot.snake.head, bot.snake, 14)) {
      defeatBot(bot);
      return;
    }

    collectBotItems(bot);
    updateBotMagnetCoins(bot, deltaSeconds);
    collectBotCoins(bot);
  });
}

function respawnBot(bot, index) {
  const config = botConfigs[index];
  const baseSpeed = 158 + index * 12;

  bot.snake = makeSnake({
    x: config.x,
    y: config.y,
    angle: Math.random() * Math.PI * 2,
    speed: baseSpeed,
    segmentCount: 24,
