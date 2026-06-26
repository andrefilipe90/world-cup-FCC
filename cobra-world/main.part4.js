    state.width / 2,
    state.height / 2,
    Math.min(state.width, state.height) * 0.25,
    state.width / 2,
    state.height / 2,
    Math.max(state.width, state.height) * 0.75,
  );

  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.24)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, state.width, state.height);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function clampAngle(angle) {
  let result = angle;

  while (result > Math.PI) {
    result -= Math.PI * 2;
  }

  while (result < -Math.PI) {
    result += Math.PI * 2;
  }

  return result;
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function getSelectedSkin() {
  return getLightenedSkin(skins[state.selectedSkin] || skins.classic, state.skinLightness);
}

function selectSkin(skinName) {
  if (!skins[skinName]) {
    return;
  }

  state.selectedSkin = skinName;
  writeStoredValue(storageKeys.skin, skinName);
  updateSkinButtons();
  menuStatus.textContent = "Skin equipada";
}

function renderSkinButtons() {
  skinSwatches.innerHTML = "";

  skinCatalog.forEach((skinItem) => {
    const button = document.createElement("button");
    button.className = "skin-swatch";
    button.type = "button";
    button.dataset.skin = skinItem.id;
    button.setAttribute("aria-label", `Skin ${skinItem.name}`);

    const image = document.createElement("img");
    image.className = "skin-preview";
    image.alt = `Skin ${skinItem.name}`;
    image.src = createSkinPreview(skinItem.id);

    const name = document.createElement("strong");
    name.textContent = skinItem.name;

    const price = document.createElement("span");
    price.className = "item-price";
    price.textContent = `Valor: ${getPriceLabel(skinItem.price)}`;

    const status = document.createElement("span");
    status.className = "item-status";
    status.textContent = getSkinStatusLabel(skinItem.id);

    button.append(image, name, price, status);
    button.addEventListener("click", () => selectSkin(skinItem.id));
    skinSwatches.append(button);
  });

  updateSkinButtons();
}

function updateSkinButtons() {
  skinSwatches.querySelectorAll(".skin-swatch").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.skin === state.selectedSkin);
    const image = button.querySelector(".skin-preview");
    const status = button.querySelector(".item-status");

    if (image) {
      image.src = createSkinPreview(button.dataset.skin);
    }

    if (status) {
      status.textContent = getSkinStatusLabel(button.dataset.skin);
    }
  });
}

function getSkinItem(skinName) {
  return skinCatalog.find((skinItem) => skinItem.id === skinName);
}

function getSkinStatusLabel(skinName) {
  return skinName === state.selectedSkin ? "Equipada" : "Usar";
}

function renderAccessoryButtons() {
  accessoryList.innerHTML = "";

  accessoryCatalog.forEach((accessory) => {
    const button = document.createElement("button");
    button.className = "accessory-button";
    button.type = "button";
    button.dataset.accessory = accessory.id;

    const image = document.createElement("img");
    image.className = "accessory-image";
    image.alt = accessory.name;
    image.src = createAccessoryPreview(accessory.id);

    const name = document.createElement("strong");
    name.textContent = accessory.name;

    const price = document.createElement("span");
    price.className = "item-price";
    price.textContent = `Valor: ${getPriceLabel(accessory.price)}`;

    const label = document.createElement("span");
    label.className = "item-status";
    label.textContent = getAccessoryLabel(accessory);

    button.append(image, name, price, label);
    button.addEventListener("click", () => chooseAccessory(accessory.id));
    accessoryList.append(button);
  });

  updateAccessoryButtons();
}

function chooseAccessory(accessoryId) {
  const accessory = getAccessory(accessoryId);

  if (!accessory) {
    return;
  }

  if (!isAccessoryOwned(accessoryId)) {
    buyAccessory(accessory);
    return;
  }

  equipAccessory(accessoryId);
}

function buyAccessory(accessory) {
  if (state.coins < accessory.price) {
    menuStatus.textContent = `Faltam ${accessory.price - state.coins} moedas`;
    return;
  }

  state.coins -= accessory.price;
  state.ownedAccessories.push(accessory.id);
  writeStoredValue(storageKeys.coins, String(state.coins));
  writeStoredValue(storageKeys.ownedAccessories, JSON.stringify(state.ownedAccessories));
  equipAccessory(accessory.id);
  menuStatus.textContent = `${accessory.name} comprado`;
  updateMenuCounters();
  updateHud();
}

function equipAccessory(accessoryId) {
  state.selectedAccessory = accessoryId;
  writeStoredValue(storageKeys.accessory, accessoryId);
  updateAccessoryButtons();
  menuStatus.textContent = `${getAccessory(accessoryId).name} equipado`;
}

function updateAccessoryButtons() {
  accessoryList.querySelectorAll(".accessory-button").forEach((button) => {
    const accessory = getAccessory(button.dataset.accessory);
    button.classList.toggle("is-selected", accessory.id === state.selectedAccessory);
    button.querySelector(".item-status").textContent = getAccessoryLabel(accessory);
  });
}

function createAccessoryPreview(accessoryId) {
  const previewCanvas = document.createElement("canvas");
  const previewCtx = previewCanvas.getContext("2d");

  previewCanvas.width = 96;
  previewCanvas.height = 96;

  previewCtx.fillStyle = "rgba(255, 239, 117, 0.95)";
  previewCtx.beginPath();
  previewCtx.arc(48, 52, 28, 0, Math.PI * 2);
  previewCtx.fill();
  previewCtx.lineWidth = 4;
  previewCtx.strokeStyle = "#775f1f";
  previewCtx.stroke();

  if (accessoryId === "roundGlasses") {
    drawPreviewGlasses(previewCtx, "#fff0a0", 9);
  } else if (accessoryId === "cap") {
    previewCtx.fillStyle = "#2a66ff";
    previewCtx.beginPath();
    previewCtx.ellipse(48, 30, 22, 11, 0, Math.PI, 0);
    previewCtx.fill();
    previewCtx.fillRect(28, 30, 40, 10);
    previewCtx.fillStyle = "#ffd659";
    previewCtx.fillRect(34, 23, 28, 6);
  } else if (accessoryId === "backpack") {
    previewCtx.fillStyle = "#fedc5a";
    previewCtx.beginPath();
    previewCtx.arc(24, 54, 18, 0, Math.PI * 2);
    previewCtx.fill();
    previewCtx.fillStyle = "#8b5a35";
    fillPreviewRoundedRect(previewCtx, 16, 35, 26, 34, 9);
    previewCtx.fillStyle = "#d19a57";
    previewCtx.fillRect(20, 43, 18, 6);
  } else if (accessoryId === "bow") {
    previewCtx.fillStyle = "#ff6faa";
    previewCtx.beginPath();
    previewCtx.ellipse(38, 28, 14, 9, -0.25, 0, Math.PI * 2);
    previewCtx.ellipse(58, 28, 14, 9, 0.25, 0, Math.PI * 2);
    previewCtx.fill();
    previewCtx.fillStyle = "#ffe1ef";
    previewCtx.beginPath();
    previewCtx.arc(48, 28, 5, 0, Math.PI * 2);
    previewCtx.fill();
  } else if (accessoryId === "starHat") {
    previewCtx.fillStyle = "#7444c7";
    previewCtx.beginPath();
    previewCtx.moveTo(30, 33);
    previewCtx.lineTo(48, 7);
    previewCtx.lineTo(68, 33);
    previewCtx.closePath();
    previewCtx.fill();
    previewCtx.fillStyle = "#ffd659";
    drawPreviewStar(previewCtx, 49, 22, 8);
  } else if (accessoryId === "flower") {
    previewCtx.fillStyle = "#ff70b7";
    for (let petal = 0; petal < 6; petal += 1) {
      const angle = petal * (Math.PI / 3);
      previewCtx.beginPath();
      previewCtx.ellipse(48 + Math.cos(angle) * 10, 28 + Math.sin(angle) * 10, 8, 5, angle, 0, Math.PI * 2);
      previewCtx.fill();
    }
    previewCtx.fillStyle = "#ffd659";
    previewCtx.beginPath();
    previewCtx.arc(48, 28, 5, 0, Math.PI * 2);
    previewCtx.fill();
  } else if (accessoryId === "scarf") {
    previewCtx.fillStyle = "#ff4f78";
    previewCtx.fillRect(25, 50, 46, 12);
    previewCtx.fillStyle = "#ffd1dc";
    previewCtx.fillRect(56, 60, 9, 18);
  } else if (accessoryId === "visor") {
    previewCtx.fillStyle = "#00d3b8";
    previewCtx.fillRect(29, 30, 38, 9);
    previewCtx.fillStyle = "rgba(255, 255, 255, 0.55)";
    previewCtx.fillRect(35, 20, 26, 10);
  } else if (accessoryId === "headphones") {
    previewCtx.lineWidth = 5;
    previewCtx.strokeStyle = "#4b5568";
    previewCtx.beginPath();
    previewCtx.arc(48, 52, 31, Math.PI * 1.12, Math.PI * 1.88);
    previewCtx.stroke();
    previewCtx.fillStyle = "#70d5ff";
    fillPreviewRoundedRect(previewCtx, 23, 43, 13, 23, 6);
    fillPreviewRoundedRect(previewCtx, 60, 43, 13, 23, 6);
  } else if (accessoryId === "wizardHat") {
    previewCtx.fillStyle = "#4f3ccf";
    previewCtx.beginPath();
    previewCtx.moveTo(28, 34);
    previewCtx.lineTo(48, 4);
    previewCtx.lineTo(68, 34);
    previewCtx.closePath();
    previewCtx.fill();
    previewCtx.fillStyle = "#ffd659";
    drawPreviewStar(previewCtx, 48, 20, 7);
    previewCtx.fillStyle = "#a98dff";
    previewCtx.fillRect(29, 33, 38, 6);
  } else if (accessoryId === "juliette") {
    drawPreviewGlasses(previewCtx, "#2f2f35", 10);
    previewCtx.fillStyle = "rgba(255, 255, 255, 0.45)";
    previewCtx.fillRect(37, 42, 8, 5);
    previewCtx.fillRect(56, 42, 8, 5);
  } else if (accessoryId === "rocketPack") {
    previewCtx.fillStyle = "#fedc5a";
    previewCtx.beginPath();
    previewCtx.arc(24, 54, 18, 0, Math.PI * 2);
    previewCtx.fill();
    previewCtx.fillStyle = "#687384";
    fillPreviewRoundedRect(previewCtx, 14, 34, 30, 36, 9);
    previewCtx.fillStyle = "#dce6ef";
    previewCtx.fillRect(19, 42, 20, 7);
    previewCtx.fillStyle = "#ff6a3d";
    previewCtx.beginPath();
    previewCtx.moveTo(20, 71);
    previewCtx.lineTo(29, 84);
    previewCtx.lineTo(38, 71);
    previewCtx.closePath();
    previewCtx.fill();
  } else if (accessoryId === "crown") {
    previewCtx.fillStyle = "#ffd659";
    previewCtx.beginPath();
    previewCtx.moveTo(29, 34);
    previewCtx.lineTo(36, 13);
    previewCtx.lineTo(48, 31);
    previewCtx.lineTo(60, 13);
    previewCtx.lineTo(67, 34);
    previewCtx.closePath();
    previewCtx.fill();
    previewCtx.fillStyle = "#fff2a1";
    previewCtx.fillRect(33, 34, 30, 7);
  }

  return previewCanvas.toDataURL("image/png");
}

function drawPreviewGlasses(previewCtx, color, radius) {
  previewCtx.lineWidth = 4;
  previewCtx.strokeStyle = color;
  previewCtx.beginPath();
  previewCtx.arc(39, 48, radius, 0, Math.PI * 2);
  previewCtx.arc(59, 48, radius, 0, Math.PI * 2);
  previewCtx.moveTo(48, 48);
  previewCtx.lineTo(50, 48);
  previewCtx.stroke();
}

function drawPreviewStar(previewCtx, x, y, radius) {
  previewCtx.beginPath();

  for (let point = 0; point < 10; point += 1) {
    const angle = -Math.PI / 2 + point * (Math.PI / 5);
    const pointRadius = point % 2 === 0 ? radius : radius * 0.45;
    const px = x + Math.cos(angle) * pointRadius;
    const py = y + Math.sin(angle) * pointRadius;

    if (point === 0) {
      previewCtx.moveTo(px, py);
    } else {
      previewCtx.lineTo(px, py);
    }
  }

  previewCtx.closePath();
  previewCtx.fill();
}

function fillPreviewRoundedRect(previewCtx, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  previewCtx.beginPath();
  previewCtx.moveTo(x + safeRadius, y);
  previewCtx.lineTo(x + width - safeRadius, y);
  previewCtx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  previewCtx.lineTo(x + width, y + height - safeRadius);
  previewCtx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  previewCtx.lineTo(x + safeRadius, y + height);
  previewCtx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  previewCtx.lineTo(x, y + safeRadius);
  previewCtx.quadraticCurveTo(x, y, x + safeRadius, y);
  previewCtx.closePath();
  previewCtx.fill();
}

function getAccessoryLabel(accessory) {
  if (accessory.id === state.selectedAccessory) {
    return "Equipado";
  }

  if (isAccessoryOwned(accessory.id)) {
    return "Usar";
  }

  if (accessory.price === 0) {
    return "Grátis";
  }

  return `${accessory.price} moedas`;
}

function getPriceLabel(price) {
  return price === 0 ? "Grátis" : `${price} moedas`;
}

function createSkinPreview(skinName) {
  const skin = getLightenedSkin(skins[skinName] || skins.classic, state.skinLightness);
  const previewCanvas = document.createElement("canvas");
  const previewCtx = previewCanvas.getContext("2d");

  previewCanvas.width = 92;
  previewCanvas.height = 92;

  previewCtx.fillStyle = skin.stroke;
  previewCtx.beginPath();
  previewCtx.arc(46, 46, 31, 0, Math.PI * 2);
  previewCtx.fill();

  previewCtx.fillStyle = skin.head;
  previewCtx.beginPath();
  previewCtx.arc(46, 46, 27, 0, Math.PI * 2);
  previewCtx.fill();

  previewCtx.fillStyle = "#fffdf0";
  previewCtx.beginPath();
  previewCtx.arc(55, 35, 8, 0, Math.PI * 2);
  previewCtx.arc(55, 57, 8, 0, Math.PI * 2);
  previewCtx.fill();

  previewCtx.fillStyle = skin.eye;
  previewCtx.beginPath();
  previewCtx.arc(57, 36, 4.7, 0, Math.PI * 2);
  previewCtx.arc(57, 58, 4.7, 0, Math.PI * 2);
  previewCtx.fill();

  previewCtx.fillStyle = "#ffffff";
  previewCtx.beginPath();
  previewCtx.arc(54, 33, 2, 0, Math.PI * 2);
  previewCtx.arc(54, 55, 2, 0, Math.PI * 2);
  previewCtx.fill();

  return previewCanvas.toDataURL("image/png");
}

function updateLightnessControl() {
  lightnessSlider.value = String(state.skinLightness);
  lightnessValue.textContent = `${state.skinLightness}%`;
}

function setSkinLightness(value) {
  state.skinLightness = clamp(Number(value) || 0, 0, 55);
  writeStoredValue(storageKeys.skinLightness, String(state.skinLightness));
  updateLightnessControl();
  updateSkinButtons();
}

function updateVolumeControl() {
  volumeSlider.value = String(state.volume);
  volumeValue.textContent = `${state.volume}%`;
}

function setVolume(value) {
  state.volume = clamp(Math.round(Number(value) || 0), 0, 100);
  writeStoredValue(storageKeys.volume, String(state.volume));
  updateVolumeControl();
  applyMusicVolume();
}

function applyMusicVolume() {
  if (musicState.master) {
    musicState.master.gain.value = musicSettings.masterVolume * (state.volume / 100);
  }
}

function getLightenedSkin(skin, amount) {
  return {
    head: lightenColor(skin.head, amount),
    bodyA: lightenColor(skin.bodyA, amount),
    bodyB: lightenColor(skin.bodyB, amount),
    stroke: lightenColor(skin.stroke, Math.max(0, amount - 18)),
    eye: skin.eye,
    pupil: skin.pupil,
  };
}

function lightenColor(hex, amount) {
  const rgb = hexToRgb(hex);
  const mix = amount / 100;

  return rgbToHex({
    r: Math.round(rgb.r + (255 - rgb.r) * mix),
    g: Math.round(rgb.g + (255 - rgb.g) * mix),
    b: Math.round(rgb.b + (255 - rgb.b) * mix),
  });
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b]
    .map((value) => clamp(value, 0, 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

function getAccessory(accessoryId) {
  return accessoryCatalog.find((accessory) => accessory.id === accessoryId);
}

function isAccessoryOwned(accessoryId) {
  return freeAccessoryIds.includes(accessoryId) || state.ownedAccessories.includes(accessoryId);
}

function readOwnedAccessories() {
  const storedAccessories = readStoredJson(storageKeys.ownedAccessories, []);
  const uniqueAccessories = new Set([...freeAccessoryIds, ...storedAccessories]);

  return accessoryCatalog
    .filter((accessory) => uniqueAccessories.has(accessory.id))
    .map((accessory) => accessory.id);
}

function normalizeWardrobe() {
  if (!getSkinItem(state.selectedSkin)) {
    state.selectedSkin = "classic";
    writeStoredValue(storageKeys.skin, state.selectedSkin);
  }

  state.skinLightness = clamp(state.skinLightness, 0, 55);

  if (!getAccessory(state.selectedAccessory) || !isAccessoryOwned(state.selectedAccessory)) {
    state.selectedAccessory = freeAccessoryIds[0];
    writeStoredValue(storageKeys.accessory, state.selectedAccessory);
  }
}

function readStoredText(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function readStoredNumber(key, fallback) {
  const value = Number(readStoredText(key, String(fallback)));
  return Number.isFinite(value) ? value : fallback;
}

function readStoredJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeStoredValue(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // O jogo continua funcionando mesmo se o navegador bloquear o armazenamento.
  }
}

function ensureOnlinePlayerId() {
  const storedId = readStoredText(storageKeys.playerId, "");

  if (storedId) {
    return storedId;
  }

  const randomId = window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const playerId = `cobra-${randomId}`;

  writeStoredValue(storageKeys.playerId, playerId);
  return playerId;
}

function ensureOnlinePlayerName() {
  const storedName = readStoredText(storageKeys.playerName, "");

  if (storedName) {
    return storedName;
  }

  const playerName = `Cobra ${Math.floor(100 + Math.random() * 900)}`;
  writeStoredValue(storageKeys.playerName, playerName);
  return playerName;
}

function syncOnlinePlayers() {
  const now = performance.now();

  if (now - state.onlineLastSyncAt < onlineSettings.syncInterval) {
    return;
  }

  state.onlineLastSyncAt = now;

  if (window.Peer) {
    syncPeerOnlinePlayers(now);
    return;
  }

  syncHttpOnlinePlayers();
}

function syncPeerOnlinePlayers(now) {
  ensurePeerNetwork(now);

  if (!state.onlinePeer) {
    state.onlineConnected = false;
    state.onlinePlayers = [];
    return;
  }

  const localPlayer = createOnlinePayload();

  if (state.onlinePeerIsHost) {
    cleanupPeerPlayers(now);
    state.onlineConnected = true;
    state.onlinePlayers = normalizeOnlinePlayers([...state.onlinePeerPlayers.values()]);
    broadcastPeerRoster(localPlayer, now);
    return;
  }

  if (state.onlineHostConnection?.open) {
    sendPeerMessage(state.onlineHostConnection, { type: "state", player: localPlayer });
    state.onlineConnected = true;
    return;
  }

  state.onlineConnected = false;
  state.onlinePlayers = [];
}

function ensurePeerNetwork(now) {
  if (
    state.onlinePeer ||
    state.onlinePeerConnecting ||
    now - state.onlinePeerLastAttemptAt < onlineSettings.reconnectDelay
  ) {
    return;
  }

  state.onlinePeerConnecting = true;
  state.onlinePeerLastAttemptAt = now;
  createHostPeer();
}

function createHostPeer() {
  const peer = new window.Peer(onlineSettings.roomId, onlineSettings.peerOptions);
  state.onlinePeer = peer;

  peer.on("open", () => {
    state.onlinePeerConnecting = false;
    state.onlinePeerIsHost = true;
    state.onlineConnected = true;
  });
  peer.on("connection", setupHostConnection);
  peer.on("error", (error) => {
    if (error?.type === "unavailable-id") {
      state.onlinePeerManualClose = true;
      destroyCurrentPeer();
      createClientPeer();
      return;
    }

    restartPeerNetwork();
  });
  peer.on("close", restartPeerNetwork);
  peer.on("disconnected", () => {
    try {
      peer.reconnect();
    } catch {
      restartPeerNetwork();
    }
  });
}

function createClientPeer() {
  const peer = new window.Peer(undefined, onlineSettings.peerOptions);
  state.onlinePeer = peer;
  state.onlinePeerConnecting = true;
  state.onlinePeerIsHost = false;

  peer.on("open", () => {
    state.onlinePeerConnecting = false;
    connectToHostPeer();
  });
  peer.on("error", restartPeerNetwork);
  peer.on("close", restartPeerNetwork);
  peer.on("disconnected", () => {
    try {
      peer.reconnect();
    } catch {
      restartPeerNetwork();
    }
  });
}

function connectToHostPeer() {
