  ctx.strokeStyle = "rgba(246, 247, 215, 0.2)";
  ctx.lineWidth = 5;
  ctx.strokeRect(center - 160, center - 160, 320, 320);
  ctx.strokeRect(center - 6, center - 6, 12, 12);
}

function drawItems() {
  state.items.forEach((item) => {
    if (!isWorldVisible(item.x, item.y, performanceSettings.drawPadding)) {
      return;
    }

    drawAppleItem(item);
  });
}

function drawAppleItem(item) {
  const config = itemTypes[item.type];

  ctx.save();
  ctx.translate(Math.round(item.x), Math.round(item.y));

  ctx.beginPath();
  ctx.arc(0, 0, config.radius + 8, 0, Math.PI * 2);
  ctx.fillStyle = config.glow;
  ctx.fill();

  ctx.fillStyle = config.shade;
  ctx.beginPath();
  ctx.arc(-7, 0, 12, 0, Math.PI * 2);
  ctx.arc(7, 0, 12, 0, Math.PI * 2);
  ctx.arc(0, 8, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = config.fill;
  ctx.beginPath();
  ctx.arc(-6, -1, 10, 0, Math.PI * 2);
  ctx.arc(6, -1, 10, 0, Math.PI * 2);
  ctx.arc(0, 7, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#6d431d";
  ctx.fillRect(-2, -23, 4, 10);

  ctx.fillStyle = "#8bf06d";
  ctx.beginPath();
  ctx.ellipse(9, -20, 8, 4, -0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.68)";
  ctx.beginPath();
  ctx.arc(-7, -7, 3.4, 0, Math.PI * 2);
  ctx.fill();

  if (item.type === "turbo") {
    drawItemSymbol(">>", "#e9fbff");
  }

  if (item.type === "shield") {
    drawItemSymbol("O", "#efffed");
  }

  if (item.type === "brazil") {
    ctx.fillStyle = "#ffdf4f";
    ctx.beginPath();
    ctx.arc(0, 5, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2467d8";
    ctx.beginPath();
    ctx.arc(0, 5, 8, 0, Math.PI * 2);
    ctx.fill();
    drawItemSymbol("BR", "#ffffff", 16);
  }

  if (item.type === "magnet") {
    drawItemSymbol("$", "#fff8c8");
  }

  ctx.restore();
}

function drawItemSymbol(symbol, color, size = 13) {
  ctx.fillStyle = color;
  ctx.font = `800 ${size}px 'Courier New', monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(symbol, 0, 5);
}

function drawCoinDrops() {
  state.coinDrops.forEach((coin) => {
    if (!isWorldVisible(coin.x, coin.y, performanceSettings.drawPadding)) {
      return;
    }

    ctx.save();
    ctx.translate(Math.round(coin.x), Math.round(coin.y));

    ctx.beginPath();
    ctx.arc(0, 0, coinSettings.radius + 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 214, 89, 0.2)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, coinSettings.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffd659";
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#9e6b16";
    ctx.stroke();

    ctx.fillStyle = "#fff0a0";
    ctx.fillRect(-2, -5, 4, 10);

    ctx.restore();
  });
}

function isWorldVisible(x, y, padding = 0) {
  return (
    x >= state.camera.x - padding &&
    x <= state.camera.x + state.width + padding &&
    y >= state.camera.y - padding &&
    y <= state.camera.y + state.height + padding
  );
}

function drawSnake() {
  drawSnakeEntity(
    state.snake,
    getPlayerSkin(),
    state.playerAccessoryOverride || state.selectedAccessory,
  );
}

function drawBots() {
  state.bots.forEach((bot) => {
    if (!bot.alive) {
      return;
    }

    drawSnakeEntity(bot.snake, skins[bot.skin] || skins.classic, bot.accessory, 0.92);
  });
}

function drawOnlinePlayers() {
  state.onlinePlayers.forEach((player) => {
    if (!isWorldVisible(player.snake.head.x, player.snake.head.y, performanceSettings.drawPadding)) {
      return;
    }

    drawSnakeEntity(player.snake, skins[player.skin] || skins.classic, player.accessory, 0.84);
    drawPlayerLabel(player);
  });
}

function drawPlayerLabel(player) {
  const head = player.snake.head;

  ctx.save();
  ctx.translate(Math.round(head.x), Math.round(head.y - 42));
  ctx.fillStyle = "rgba(7, 10, 16, 0.72)";
  ctx.fillRect(-52, -14, 104, 22);
  ctx.strokeStyle = "rgba(255, 243, 160, 0.55)";
  ctx.lineWidth = 2;
  ctx.strokeRect(-52, -14, 104, 22);
  ctx.fillStyle = "#fff3a0";
  ctx.font = "800 11px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(player.name, 0, -3);
  ctx.restore();
}

function drawSnakeEntity(snake, skin, accessoryId, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;

  for (let index = snake.segmentCount; index >= 1; index -= 1) {
    const segment = sampleTrail(index * snake.segmentGap, snake);
    const size = Math.max(18, 36 - index * 0.25);
    const shade = getSegmentColor(skin, accessoryId, index);

    drawCirclePart(segment.x, segment.y, size, shade, skin.stroke);
  }

  drawBodyAccessory(accessoryId, snake);
  drawHead(snake.head.x, snake.head.y, snake.angle, skin, accessoryId);
  ctx.restore();
}

function getSegmentColor(skin, accessoryId, index) {
  if (accessoryId === "brazilKit") {
    const brazilColors = ["#199b47", "#ffdf4f", "#2467d8"];
    return brazilColors[index % brazilColors.length];
  }

  return index % 2 === 0 ? skin.bodyB : skin.bodyA;
}

function getPlayerSkin() {
  if (state.playerSkinOverride) {
    return skins[state.playerSkinOverride] || skins.brazil;
  }

  return getSelectedSkin();
}

function drawPowerEffects() {
  const head = state.snake.head;

  if (isPowerActive("shield")) {
    drawPowerRing(head.x, head.y, 38, "#80ff8a", 0.6);
  }

  if (isPowerActive("magnet")) {
    drawPowerRing(head.x, head.y, 62, "#ffd659", 0.34);
  }

  if (isPowerActive("turbo")) {
    const backX = head.x - Math.cos(state.snake.angle) * 34;
    const backY = head.y - Math.sin(state.snake.angle) * 34;
    drawPowerRing(backX, backY, 24, "#48c6ff", 0.34);
  }

  state.bots.forEach((bot) => {
    if (!bot.alive) {
      return;
    }

    if (isBotPowerActive(bot, "shield")) {
      drawPowerRing(bot.snake.head.x, bot.snake.head.y, 38, "#80ff8a", 0.38);
    }

    if (isBotPowerActive(bot, "magnet")) {
      drawPowerRing(bot.snake.head.x, bot.snake.head.y, 62, "#ffd659", 0.22);
    }

    if (isBotPowerActive(bot, "turbo")) {
      const backX = bot.snake.head.x - Math.cos(bot.snake.angle) * 34;
      const backY = bot.snake.head.y - Math.sin(bot.snake.angle) * 34;
      drawPowerRing(backX, backY, 24, "#48c6ff", 0.22);
    }
  });
}

function drawPowerRing(x, y, radius, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 4;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(Math.round(x), Math.round(y), radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawHead(x, y, angle, skin, accessoryId) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  drawCirclePart(0, 0, snakeDefaults.headRadius * 2, skin.head, skin.stroke);
  if (!isHeadTopAccessory(accessoryId)) {
    drawAccessoryBase(accessoryId);
  }

  drawCuteEye(8, -12, skin.eye, skin.pupil);
  drawCuteEye(8, 12, skin.eye, skin.pupil);
  drawAccessoryFront(accessoryId);

  ctx.restore();
  drawHeadTopAccessory(x, y, accessoryId);
}

function drawBodyAccessory(accessoryId, snake) {
  if (accessoryId !== "backpack" && accessoryId !== "rocketPack" && accessoryId !== "scarf" && accessoryId !== "brazilKit") {
    return;
  }

  const segment = sampleTrail(snake.segmentGap * 5, snake);

  ctx.save();
  ctx.translate(segment.x, segment.y);
  ctx.rotate(snake.angle);

  if (accessoryId === "backpack") {
    ctx.fillStyle = "#8b5a35";
    fillRoundedRect(-12, -18, 24, 30, 8);
    ctx.fillStyle = "#d19a57";
    ctx.fillRect(-8, -11, 16, 5);
    ctx.fillStyle = "#5f3b28";
    ctx.fillRect(-9, 13, 18, 4);
  }

  if (accessoryId === "brazilKit") {
    ctx.fillStyle = "#10131a";
    fillRoundedRect(-14, -19, 28, 32, 8);
    ctx.strokeStyle = "#2b3342";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#199b47";
    ctx.fillRect(-9, -12, 6, 8);
    ctx.fillStyle = "#ffdf4f";
    ctx.fillRect(-3, -12, 6, 8);
    ctx.fillStyle = "#2467d8";
    ctx.fillRect(3, -12, 6, 8);
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 6px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("MALTE", 0, 8);
  }

  if (accessoryId === "rocketPack") {
    ctx.fillStyle = "#687384";
    fillRoundedRect(-15, -19, 30, 34, 8);
    ctx.fillStyle = "#dce6ef";
    ctx.fillRect(-10, -12, 20, 7);
    ctx.fillStyle = "#ff6a3d";
    ctx.beginPath();
    ctx.moveTo(-9, 17);
    ctx.lineTo(0, 30);
    ctx.lineTo(9, 17);
    ctx.closePath();
    ctx.fill();
  }

  if (accessoryId === "scarf") {
    ctx.fillStyle = "#ff4f78";
    ctx.fillRect(-20, -6, 40, 12);
    ctx.fillStyle = "#ffd1dc";
    ctx.fillRect(7, 6, 8, 18);
  }

  ctx.restore();
}

function isHeadTopAccessory(accessoryId) {
  return (
    accessoryId === "cap" ||
    accessoryId === "bow" ||
    accessoryId === "starHat" ||
    accessoryId === "flower" ||
    accessoryId === "visor" ||
    accessoryId === "wizardHat" ||
    accessoryId === "crown" ||
    accessoryId === "brazilKit"
  );
}

function drawHeadTopAccessory(x, y, accessoryId) {
  if (!isHeadTopAccessory(accessoryId)) {
    return;
  }

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  if (accessoryId === "cap") {
    ctx.fillStyle = "#2a66ff";
    ctx.beginPath();
    ctx.ellipse(0, -25, 19, 9, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-17, -25, 34, 8);
    ctx.fillStyle = "#ffd659";
    ctx.fillRect(-12, -31, 24, 5);
  }

  if (accessoryId === "bow") {
    ctx.fillStyle = "#ff6faa";
    ctx.beginPath();
    ctx.ellipse(-9, -27, 12, 7, -0.25, 0, Math.PI * 2);
    ctx.ellipse(9, -27, 12, 7, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffe1ef";
    ctx.beginPath();
    ctx.arc(0, -27, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  if (accessoryId === "starHat") {
    ctx.fillStyle = "#7444c7";
    ctx.beginPath();
    ctx.moveTo(-17, -20);
    ctx.lineTo(0, -48);
    ctx.lineTo(17, -20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffd659";
    drawStar(0, -33, 7);
  }

  if (accessoryId === "flower") {
    ctx.fillStyle = "#ff70b7";
    for (let petal = 0; petal < 6; petal += 1) {
      const angle = petal * (Math.PI / 3);
      ctx.beginPath();
      ctx.ellipse(Math.cos(angle) * 8, -29 + Math.sin(angle) * 8, 7, 4, angle, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#ffd659";
    ctx.beginPath();
    ctx.arc(0, -29, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  if (accessoryId === "visor") {
    ctx.fillStyle = "#00d3b8";
    ctx.fillRect(-18, -24, 36, 8);
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.fillRect(-12, -32, 24, 8);
  }

  if (accessoryId === "wizardHat") {
    ctx.fillStyle = "#4f3ccf";
    ctx.beginPath();
    ctx.moveTo(-18, -20);
    ctx.lineTo(0, -52);
    ctx.lineTo(18, -20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffd659";
    drawStar(0, -36, 6);
    ctx.fillStyle = "#a98dff";
    ctx.fillRect(-18, -22, 36, 5);
  }

  if (accessoryId === "crown") {
    ctx.fillStyle = "#ffd659";
    ctx.beginPath();
    ctx.moveTo(-17, -21);
    ctx.lineTo(-10, -40);
    ctx.lineTo(0, -25);
    ctx.lineTo(10, -40);
    ctx.lineTo(17, -21);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff2a1";
    ctx.fillRect(-13, -22, 26, 5);
  }

  if (accessoryId === "brazilKit") {
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#10131a";
    ctx.strokeRect(-18, -34, 15, 12);
    ctx.strokeRect(3, -34, 15, 12);
    ctx.beginPath();
    ctx.moveTo(-3, -28);
    ctx.lineTo(3, -28);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.36)";
    ctx.fillRect(-15, -31, 6, 3);
    ctx.fillRect(6, -31, 6, 3);
  }

  ctx.restore();
}

function drawAccessoryBase(accessoryId) {
  if (accessoryId === "cap") {
    ctx.fillStyle = "#2a66ff";
    ctx.beginPath();
    ctx.ellipse(0, -22, 18, 9, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-16, -22, 32, 8);
    ctx.fillStyle = "#ffd659";
    ctx.fillRect(-11, -28, 22, 5);
    return;
  }

  if (accessoryId === "bow") {
    ctx.fillStyle = "#ff6faa";
    ctx.beginPath();
    ctx.ellipse(-4, -22, 11, 7, -0.25, 0, Math.PI * 2);
    ctx.ellipse(12, -22, 11, 7, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffe1ef";
    ctx.beginPath();
    ctx.arc(4, -22, 4, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (accessoryId === "starHat") {
    ctx.fillStyle = "#7444c7";
    ctx.beginPath();
    ctx.moveTo(-17, -18);
    ctx.lineTo(0, -44);
    ctx.lineTo(17, -18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffd659";
    drawStar(0, -29, 7);
    return;
  }

  if (accessoryId === "flower") {
    ctx.fillStyle = "#ff70b7";
    for (let petal = 0; petal < 6; petal += 1) {
      const angle = petal * (Math.PI / 3);
      ctx.beginPath();
      ctx.ellipse(Math.cos(angle) * 8, -24 + Math.sin(angle) * 8, 7, 4, angle, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#ffd659";
    ctx.beginPath();
    ctx.arc(0, -24, 4, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (accessoryId === "visor") {
    ctx.fillStyle = "#00d3b8";
    ctx.fillRect(-18, -20, 36, 8);
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.fillRect(-12, -28, 24, 8);
    return;
  }

  if (accessoryId === "wizardHat") {
    ctx.fillStyle = "#4f3ccf";
    ctx.beginPath();
    ctx.moveTo(-18, -18);
    ctx.lineTo(0, -50);
    ctx.lineTo(18, -18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffd659";
    drawStar(-1, -33, 6);
    ctx.fillStyle = "#a98dff";
    ctx.fillRect(-18, -20, 36, 5);
    return;
  }

  if (accessoryId === "crown") {
    ctx.fillStyle = "#ffd659";
    ctx.beginPath();
    ctx.moveTo(-17, -18);
    ctx.lineTo(-10, -37);
    ctx.lineTo(0, -22);
    ctx.lineTo(10, -37);
    ctx.lineTo(17, -18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff2a1";
    ctx.fillRect(-13, -18, 26, 5);
  }
}

function drawAccessoryFront(accessoryId) {
  if (accessoryId === "roundGlasses") {
    drawGlasses("#fff0a0", 6.8);
    return;
  }

  if (accessoryId === "juliette") {
    drawGlasses("#2f2f35", 7.6);
    ctx.fillStyle = "rgba(255, 255, 255, 0.42)";
    ctx.fillRect(4, -15, 7, 4);
    ctx.fillRect(4, 7, 7, 4);
    return;
  }

  if (accessoryId === "headphones") {
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#4b5568";
    ctx.beginPath();
    ctx.arc(-1, 0, 23, -1.8, 1.8);
    ctx.stroke();

    ctx.fillStyle = "#70d5ff";
    fillRoundedRect(2, -21, 8, 14, 4);
    fillRoundedRect(2, 7, 8, 14, 4);
  }
}

function drawGlasses(color, radius) {
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(8, -12, radius, 0, Math.PI * 2);
  ctx.arc(8, 12, radius, 0, Math.PI * 2);
  ctx.moveTo(8, -4);
  ctx.lineTo(8, 4);
  ctx.stroke();
}

function drawStar(x, y, radius) {
  ctx.beginPath();

  for (let point = 0; point < 10; point += 1) {
    const angle = -Math.PI / 2 + point * (Math.PI / 5);
    const pointRadius = point % 2 === 0 ? radius : radius * 0.45;
    const px = x + Math.cos(angle) * pointRadius;
    const py = y + Math.sin(angle) * pointRadius;

    if (point === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }

  ctx.closePath();
  ctx.fill();
}

function fillRoundedRect(x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
  ctx.fill();
}

function drawCuteEye(x, y, iris, pupil) {
  ctx.beginPath();
  ctx.arc(x, y, 8.2, 0, Math.PI * 2);
  ctx.fillStyle = "#fffdf0";
  ctx.fill();

  ctx.lineWidth = 1.7;
  ctx.strokeStyle = "rgba(90, 70, 60, 0.55)";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x + 1.1, y + 0.9, 4.8, 0, Math.PI * 2);
  ctx.fillStyle = iris;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x + 2.1, y + 1.2, 2.2, 0, Math.PI * 2);
  ctx.fillStyle = pupil;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x - 2, y - 2.4, 2.1, 0, Math.PI * 2);
  ctx.arc(x + 1, y - 3.4, 1.1, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
}

function drawCirclePart(x, y, size, fill, stroke) {
  const radius = size / 2;
  const centerX = Math.round(x);
  const centerY = Math.round(y);

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
  ctx.fillStyle = stroke;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(centerX - radius * 0.2, centerY - radius * 0.25, radius * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.fill();
}

function sampleTrail(targetDistance, snake = state.snake) {
  const trail = snake.trail;

  if (!trail.length) {
    return snake.head;
  }

  const trailIndex = clamp(
    Math.round(targetDistance / performanceSettings.assumedTrailSpacing),
    0,
    trail.length - 1,
  );

  return trail[trailIndex];
}

function drawPixelLine(x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(Math.round(x1) + 0.5, Math.round(y1) + 0.5);
  ctx.lineTo(Math.round(x2) + 0.5, Math.round(y2) + 0.5);
  ctx.stroke();
}

function drawVignette() {
  const gradient = ctx.createRadialGradient(
