  });
  bot.baseSpeed = baseSpeed;
  bot.target = randomWorldPoint();
  bot.alive = true;
  bot.turboUntil = 0;
  bot.shieldUntil = 0;
  bot.magnetUntil = 0;
  bot.skin = config.skin;
  bot.accessory = config.accessory;
}

function defeatBot(bot) {
  bot.alive = false;
  bot.respawnAt = performance.now() + 1400;
  dropCoinsFromBot(bot);
}

function dropCoinsFromBot(bot) {
  const head = bot.snake.head;
  const dropCount = Math.min(12, Math.max(4, Math.floor(bot.snake.segmentCount / 8)));

  for (let index = 0; index < dropCount; index += 1) {
    const angle = (Math.PI * 2 * index) / dropCount;
    const distance = 34 + Math.random() * 34;

    state.coinDrops.push({
      id: `coin-drop-${Math.random().toString(36).slice(2)}`,
      value: 1,
      x: clamp(head.x + Math.cos(angle) * distance, arena.border + 60, arena.size - arena.border - 60),
      y: clamp(head.y + Math.sin(angle) * distance, arena.border + 60, arena.size - arena.border - 60),
    });
  }

  trimCoinDrops();
}

function steerBot(bot, deltaSeconds) {
  const snake = bot.snake;
  const target = getBotTarget(bot);
  const dx = target.x - snake.head.x;
  const dy = target.y - snake.head.y;
  const distance = Math.hypot(dx, dy);

  if (distance <= 1) {
    return;
  }

  const desiredAngle = Math.atan2(dy, dx);
  const turnAmount = clampAngle(desiredAngle - snake.angle);
  snake.angle += clamp(turnAmount, -2.8 * deltaSeconds, 2.8 * deltaSeconds);

  snake.head.x += Math.cos(snake.angle) * snake.speed * deltaSeconds;
  snake.head.y += Math.sin(snake.angle) * snake.speed * deltaSeconds;
}

function getBotTarget(bot) {
  const wallTarget = getWallSafetyTarget(bot.snake.head);

  if (wallTarget) {
    bot.target = wallTarget;
    return bot.target;
  }

  const collectible = findNearestCollectible(bot.snake.head, 720);

  if (collectible) {
    bot.target = collectible;
    return bot.target;
  }

  const distanceToTarget = Math.hypot(bot.target.x - bot.snake.head.x, bot.target.y - bot.snake.head.y);

  if (distanceToTarget < 55 || Math.random() < 0.012) {
    bot.target = randomWorldPoint();
  }

  return bot.target;
}

function getWallSafetyTarget(head) {
  const margin = arena.border + 160;
  const center = arena.size / 2;

  if (head.x < margin || head.x > arena.size - margin || head.y < margin || head.y > arena.size - margin) {
    return {
      x: center + (Math.random() - 0.5) * 220,
      y: center + (Math.random() - 0.5) * 220,
    };
  }

  return null;
}

function findNearestCollectible(head, maxDistance) {
  let nearest = null;
  let nearestDistance = maxDistance;

  state.items.forEach((item) => {
    const distance = Math.hypot(item.x - head.x, item.y - head.y);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = { x: item.x, y: item.y };
    }
  });

  state.coinDrops.forEach((coin) => {
    const distance = Math.hypot(coin.x - head.x, coin.y - head.y);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = { x: coin.x, y: coin.y };
    }
  });

  return nearest;
}

function collectBotItems(bot) {
  const snake = bot.snake;

  for (let index = state.items.length - 1; index >= 0; index -= 1) {
    const item = state.items[index];
    const itemConfig = itemTypes[item.type];
    const distance = Math.hypot(item.x - snake.head.x, item.y - snake.head.y);

    if (distance <= snakeDefaults.headRadius + itemConfig.radius) {
      applyBotItemEffect(bot, item.type);
      if (item.type === "brazil") {
        state.items.splice(index, 1);
        continue;
      }
      state.items[index] = createItem(item.type);
    }
  }
}

function applyBotItemEffect(bot, type) {
  const now = performance.now();

  if (type === "apple") {
    bot.snake.segmentCount = Math.min(bot.snake.segmentCount + 3, 80);
    bot.score += 1;
    return;
  }

  if (type === "brazil") {
    applyBrazilLookToBot(bot);
    bot.snake.segmentCount = Math.min(bot.snake.segmentCount + 4, 80);
    bot.score += 3;
    return;
  }

  if (type === "turbo") {
    bot.turboUntil = now + powerDurations.turbo;
    return;
  }

  if (type === "shield") {
    bot.shieldUntil = now + powerDurations.shield;
    return;
  }

  if (type === "magnet") {
    bot.magnetUntil = now + powerDurations.magnet;
  }
}

function updateBotSpeed(bot) {
  bot.snake.speed = isBotPowerActive(bot, "turbo") ? bot.baseSpeed + 140 : bot.baseSpeed;
}

function updateBotMagnetCoins(bot, deltaSeconds) {
  if (!isBotPowerActive(bot, "magnet")) {
    return;
  }

  const head = bot.snake.head;

  state.coinDrops.forEach((coin) => {
    const dx = head.x - coin.x;
    const dy = head.y - coin.y;
    const distance = Math.hypot(dx, dy);

    if (distance > coinSettings.magnetRange || distance <= 1) {
      return;
    }

    const step = Math.min(distance, coinSettings.magnetPullSpeed * deltaSeconds);
    coin.x += (dx / distance) * step;
    coin.y += (dy / distance) * step;
  });
}

function collectBotCoins(bot) {
  const head = bot.snake.head;

  for (let index = state.coinDrops.length - 1; index >= 0; index -= 1) {
    const coin = state.coinDrops[index];
    const distance = Math.hypot(coin.x - head.x, coin.y - head.y);

    if (distance <= snakeDefaults.headRadius + coinSettings.radius) {
      bot.score += coin.value;
      state.coinDrops[index] = createCoin();
    }
  }
}

function isBotPowerActive(bot, type) {
  const now = performance.now();

  if (type === "turbo") {
    return now < bot.turboUntil;
  }

  if (type === "shield") {
    return now < bot.shieldUntil;
  }

  if (type === "magnet") {
    return now < bot.magnetUntil;
  }

  return false;
}

function createItems() {
  const items = [];

  Object.entries(itemCounts).forEach(([type, count]) => {
    for (let index = 0; index < count; index += 1) {
      items.push(createItem(type, index));
    }
  });

  return items;
}

function createItem(type, index = 0) {
  if (type === "brazil") {
    return createBrazilTestApple(index);
  }

  return {
    id: `${type}-${Math.random().toString(36).slice(2)}`,
    type,
    ...randomWorldPoint(),
  };
}

function createBrazilTestApple(index) {
  const anchorPoints = [
    { x: snakeDefaults.x + 230, y: snakeDefaults.y - 80 },
    { x: botConfigs[0].x + 160, y: botConfigs[0].y + 70 },
    { x: botConfigs[1].x - 160, y: botConfigs[1].y - 70 },
  ];
  const anchor = anchorPoints[index % anchorPoints.length];
  const ring = Math.floor(index / anchorPoints.length);
  const angle = index * 1.72;
  const distance = ring === 0 ? 0 : 84 + ring * 34;
  const x = clamp(anchor.x + Math.cos(angle) * distance, arena.border, arena.size - arena.border);
  const y = clamp(anchor.y + Math.sin(angle) * distance, arena.border, arena.size - arena.border);

  return {
    id: `brazil-${index}-${Math.random().toString(36).slice(2)}`,
    type: "brazil",
    x,
    y,
  };
}

function createCoins() {
  const coins = [];

  for (let index = 0; index < coinSettings.count; index += 1) {
    coins.push(createCoin());
  }

  return coins;
}

function createCoin(value = 1) {
  return {
    id: `coin-${Math.random().toString(36).slice(2)}`,
    value,
    ...randomWorldPoint(),
  };
}

function randomWorldPoint() {
  const padding = arena.border + 90;
  const max = arena.size - padding;

  return {
    x: padding + Math.random() * (max - padding),
    y: padding + Math.random() * (max - padding),
  };
}

function collectItems() {
  const snake = state.snake;

  for (let index = state.items.length - 1; index >= 0; index -= 1) {
    const item = state.items[index];
    const itemConfig = itemTypes[item.type];
    const distance = Math.hypot(item.x - snake.head.x, item.y - snake.head.y);

    if (distance <= snakeDefaults.headRadius + itemConfig.radius) {
      applyItemEffect(item.type);
      if (item.type === "brazil") {
        state.items.splice(index, 1);
        continue;
      }
      state.items[index] = createItem(item.type);
    }
  }
}

function applyItemEffect(type) {
  const now = performance.now();

  if (type === "apple") {
    state.snake.segmentCount = Math.min(state.snake.segmentCount + 3, 86);
    addCoins(1);
    return;
  }

  if (type === "brazil") {
    applyBrazilLookToPlayer();
    state.snake.segmentCount = Math.min(state.snake.segmentCount + 4, 86);
    addCoins(3);
    return;
  }

  if (type === "turbo") {
    state.turboUntil = now + powerDurations.turbo;
    return;
  }

  if (type === "shield") {
    state.shieldUntil = now + powerDurations.shield;
    return;
  }

  if (type === "magnet") {
    state.magnetUntil = now + powerDurations.magnet;
  }
}

function applyBrazilLookToPlayer() {
  state.playerSkinOverride = "brazil";
  state.playerAccessoryOverride = "brazilKit";
  menuStatus.textContent = "Skin Brasil ativada";
  showEventMessage("Você conseguiu pegar a maçã do Brasil! Agora você é uma cobra brasileira.");
  playBrazilPickupSound();
}

function applyBrazilLookToBot(bot) {
  bot.skin = "brazil";
  bot.accessory = "brazilKit";
}

function updatePowerSpeeds() {
  state.snake.speed = isPowerActive("turbo") ? 330 : snakeDefaults.speed;
}

function updateCoinDrops(deltaSeconds) {
  if (!isPowerActive("magnet")) {
    return;
  }

  const head = state.snake.head;

  state.coinDrops.forEach((coin) => {
    const dx = head.x - coin.x;
    const dy = head.y - coin.y;
    const distance = Math.hypot(dx, dy);

    if (distance > coinSettings.magnetRange || distance <= 1) {
      return;
    }

    const step = Math.min(distance, coinSettings.magnetPullSpeed * deltaSeconds);
    coin.x += (dx / distance) * step;
    coin.y += (dy / distance) * step;
  });
}

function collectCoins() {
  const head = state.snake.head;

  for (let index = state.coinDrops.length - 1; index >= 0; index -= 1) {
    const coin = state.coinDrops[index];
    const distance = Math.hypot(coin.x - head.x, coin.y - head.y);

    if (distance <= snakeDefaults.headRadius + coinSettings.radius) {
      addCoins(coin.value);
      state.coinDrops[index] = createCoin();
    }
  }
}

function trimCoinDrops() {
  const extraCoins = state.coinDrops.length - performanceSettings.maxCoinDrops;

  if (extraCoins > 0) {
    state.coinDrops.splice(0, extraCoins);
  }
}

function addCoins(amount) {
  state.coins += amount;
  writeStoredValue(storageKeys.coins, String(state.coins));
  updateMenuCounters();
  updateHud(true);
}

function isPowerActive(type) {
  const now = performance.now();

  if (type === "turbo") {
    return now < state.turboUntil;
  }

  if (type === "shield") {
    return now < state.shieldUntil;
  }

  if (type === "magnet") {
    return now < state.magnetUntil;
  }

  return false;
}

function getPowerLabel() {
  const active = [];

  if (isPowerActive("turbo")) {
    active.push("Turbo");
  }

  if (isPowerActive("shield")) {
    active.push("Escudo");
  }

  if (isPowerActive("magnet")) {
    active.push("Imãcobra");
  }

  return active.length ? active.join(" + ") : "Nenhum";
}

function hasHitWall() {
  return hasSnakeHitWall(state.snake);
}

function hasSnakeHitWall(snake) {
  const head = snake.head;
  const radius = snakeDefaults.headRadius;
  const min = arena.border + radius;
  const max = arena.size - arena.border - radius;

  return head.x <= min || head.x >= max || head.y <= min || head.y >= max;
}

function checkPlayerBotCollisions() {
  for (const bot of state.bots) {
    if (!bot.alive) {
      continue;
    }

    const headDistance = Math.hypot(bot.snake.head.x - state.snake.head.x, bot.snake.head.y - state.snake.head.y);

    if (headDistance <= snakeDefaults.headRadius * 1.85) {
      if (resolveHeadCollision(bot)) {
        return true;
      }
      continue;
    }

    if (isSnakeHeadTouchingBody(state.snake.head, bot.snake, 4)) {
      if (isPowerActive("shield")) {
        defeatBot(bot);
        addCoins(2);
        continue;
      }

      endGame();
      return true;
    }

    if (isSnakeHeadTouchingBody(bot.snake.head, state.snake, 6)) {
      defeatBot(bot);
      addCoins(1);
    }
  }

  return false;
}

function checkPlayerOnlineCollisions() {
  for (const player of state.onlinePlayers) {
    const remoteSnake = player.snake;
    const headDistance = Math.hypot(remoteSnake.head.x - state.snake.head.x, remoteSnake.head.y - state.snake.head.y);

    if (headDistance <= snakeDefaults.headRadius * 1.85) {
      if (resolveOnlineHeadCollision(player)) {
        return true;
      }
      continue;
    }

    if (isSnakeHeadTouchingBody(state.snake.head, remoteSnake, 4)) {
      if (isPowerActive("shield")) {
        addCoins(2);
        continue;
      }

      endGame("Bateu em jogador online");
      return true;
    }
  }

  return false;
}

function resolveOnlineHeadCollision(player) {
  const playerStrength = getSnakeStrength(state.snake, isPowerActive("turbo"));
  const remoteStrength = getSnakeStrength(player.snake, player.turboActive);

  if (isPowerActive("shield") && !player.shieldActive) {
    addCoins(3);
    return false;
  }

  if (player.shieldActive && !isPowerActive("shield")) {
    endGame("Bateu em jogador com escudo");
    return true;
  }

  if (playerStrength > remoteStrength) {
    addCoins(3);
    return false;
  }

  if (playerStrength < remoteStrength) {
    endGame("Bateu em jogador maior");
    return true;
  }

  endGame("Empate de cabeça");
  return true;
}

function checkSelfCollision() {
  if (state.snake.segmentCount < 18) {
    return false;
  }

  return isSnakeHeadTouchingBody(state.snake.head, state.snake, 14);
}

function resolveHeadCollision(bot) {
  const playerStrength = getSnakeStrength(state.snake, isPowerActive("turbo"));
  const botStrength = getSnakeStrength(bot.snake, isBotPowerActive(bot, "turbo"));

  if (isPowerActive("shield") && !isBotPowerActive(bot, "shield")) {
    defeatBot(bot);
    addCoins(3);
    return false;
  }

  if (isBotPowerActive(bot, "shield") && !isPowerActive("shield")) {
    endGame();
    return true;
  }

  if (playerStrength > botStrength) {
    defeatBot(bot);
    addCoins(3);
    return false;
  }

  if (playerStrength < botStrength) {
    endGame();
    return true;
  }

  defeatBot(bot);
  endGame();
  return true;
}

function getSnakeStrength(snake, hasTurbo) {
  return snake.segmentCount + (hasTurbo ? 12 : 0);
}

function isSnakeHeadTouchingBody(head, snake, startSegment) {
  const maxSegments = Math.min(snake.segmentCount, 55);

  for (let index = startSegment; index <= maxSegments; index += 1) {
    const segment = sampleTrail(index * snake.segmentGap, snake);
    const distance = Math.hypot(segment.x - head.x, segment.y - head.y);
    const segmentRadius = Math.max(9, (Math.max(18, 36 - index * 0.25) / 2) * 0.82);

    if (distance <= snakeDefaults.headRadius + segmentRadius) {
      return true;
    }
  }

  return false;
}

function draw() {
  ctx.clearRect(0, 0, state.width, state.height);
  ctx.save();
  ctx.translate(-state.camera.x, -state.camera.y);

  drawArena();
  drawCoinDrops();
  drawItems();
  drawBots();
  drawOnlinePlayers();
  drawSnake();
  drawPowerEffects();

  ctx.restore();
  drawVignette();
}

function drawArena() {
  ctx.fillStyle = "#111722";
  ctx.fillRect(
    state.camera.x - 80,
    state.camera.y - 80,
    state.width + 160,
    state.height + 160,
  );

  ctx.fillStyle = "#2f8a48";
  ctx.fillRect(0, 0, arena.size, arena.size);

  drawFieldStripes();
  drawGrid();
  drawArenaBorder();
  drawCenterMark();
}

function drawFieldStripes() {
  const stripeWidth = 96;

  for (let x = 0; x < arena.size; x += stripeWidth) {
    ctx.fillStyle = Math.floor(x / stripeWidth) % 2 === 0 ? "#328f4b" : "#2a7f43";
    ctx.fillRect(x, 0, stripeWidth, arena.size);
  }
}

function drawGrid() {
  const gridSize = 80;
  const startX = Math.floor(state.camera.x / gridSize) * gridSize;
  const endX = state.camera.x + state.width + gridSize;
  const startY = Math.floor(state.camera.y / gridSize) * gridSize;
  const endY = state.camera.y + state.height + gridSize;

  ctx.strokeStyle = "rgba(246, 247, 215, 0.14)";
  ctx.lineWidth = 2;

  for (let x = startX; x <= endX; x += gridSize) {
    drawPixelLine(x, 0, x, arena.size);
  }

  for (let y = startY; y <= endY; y += gridSize) {
    drawPixelLine(0, y, arena.size, y);
  }
}

function drawArenaBorder() {
  ctx.lineWidth = arena.border;
  ctx.strokeStyle = "#d7e86f";
  ctx.strokeRect(
    arena.border / 2,
    arena.border / 2,
    arena.size - arena.border,
    arena.size - arena.border,
  );

  ctx.lineWidth = 6;
  ctx.strokeStyle = "#14211d";
  ctx.strokeRect(
    arena.border + 8,
    arena.border + 8,
    arena.size - arena.border * 2 - 16,
    arena.size - arena.border * 2 - 16,
  );
}

function drawCenterMark() {
  const center = arena.size / 2;

