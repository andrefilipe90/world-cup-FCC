  if (!state.onlinePeer || state.onlinePeerIsHost) {
    return;
  }

  const connection = state.onlinePeer.connect(onlineSettings.roomId, {
    reliable: false,
    metadata: { playerId: state.playerId },
  });
  state.onlineHostConnection = connection;

  connection.on("open", () => {
    state.onlineConnected = true;
    sendPeerMessage(connection, { type: "state", player: createOnlinePayload() });
  });
  connection.on("data", (message) => {
    if (message?.type !== "roster") {
      return;
    }

    state.onlineConnected = true;
    state.onlinePlayers = normalizeOnlinePlayers(message.players || []);
  });
  connection.on("close", restartPeerNetwork);
  connection.on("error", restartPeerNetwork);
}

function setupHostConnection(connection) {
  state.onlinePeerConnections.set(connection.peer, connection);

  connection.on("data", (message) => {
    const playerId = message?.player?.id || message?.id || connection.metadata?.playerId;

    if (message?.type === "leave") {
      removePeerPlayer(playerId);
      return;
    }

    if (message?.type !== "state" || !message.player) {
      return;
    }

    state.onlinePeerPlayers.set(message.player.id, {
      ...message.player,
      receivedAt: performance.now(),
    });
    broadcastPeerRoster(createOnlinePayload(), performance.now());
  });
  connection.on("close", () => {
    state.onlinePeerConnections.delete(connection.peer);
    removePeerPlayer(connection.metadata?.playerId);
  });
  connection.on("error", () => {
    state.onlinePeerConnections.delete(connection.peer);
    removePeerPlayer(connection.metadata?.playerId);
  });
}

function removePeerPlayer(playerId) {
  if (!playerId) {
    return;
  }

  state.onlinePeerPlayers.delete(playerId);

  if (state.onlinePeerIsHost) {
    broadcastPeerRoster(createOnlinePayload(), performance.now());
  }
}

function broadcastPeerRoster(localPlayer, now) {
  if (now - state.onlinePeerLastBroadcastAt < onlineSettings.syncInterval) {
    return;
  }

  state.onlinePeerLastBroadcastAt = now;
  const players = [localPlayer, ...state.onlinePeerPlayers.values()];
  const message = { type: "roster", players };

  state.onlinePeerConnections.forEach((connection, peerId) => {
    if (!connection.open) {
      state.onlinePeerConnections.delete(peerId);
      return;
    }

    sendPeerMessage(connection, message);
  });
}

function cleanupPeerPlayers(now) {
  state.onlinePeerPlayers.forEach((player, playerId) => {
    if (now - (player.receivedAt || 0) > onlineSettings.stalePlayerMs) {
      state.onlinePeerPlayers.delete(playerId);
    }
  });
}

function sendPeerMessage(connection, message) {
  try {
    connection.send(message);
  } catch {
    // A conexão P2P pode fechar no meio do quadro; o próximo ciclo tenta reconectar.
  }
}

function restartPeerNetwork() {
  if (state.onlinePeerManualClose || state.mode !== "playing") {
    state.onlinePeerManualClose = false;
    return;
  }

  closePeerNetwork(false);
  state.onlinePeerLastAttemptAt = performance.now() - onlineSettings.reconnectDelay + 300;
}

function closePeerNetwork(manualClose = true) {
  if (manualClose) {
    state.onlinePeerManualClose = true;
  }

  state.onlinePeerConnections.forEach((connection) => {
    try {
      connection.close();
    } catch {
      // Fechar conexão P2P é melhor esforço.
    }
  });

  if (state.onlineHostConnection) {
    try {
      state.onlineHostConnection.close();
    } catch {
      // Fechar conexão P2P é melhor esforço.
    }
  }

  destroyCurrentPeer();
  state.onlineConnected = false;
  state.onlinePeerConnecting = false;
  state.onlinePeerIsHost = false;
  state.onlineHostConnection = null;
  state.onlinePeerConnections.clear();
  state.onlinePeerPlayers.clear();
  state.onlinePlayers = [];
}

function destroyCurrentPeer() {
  const peer = state.onlinePeer;
  state.onlinePeer = null;

  if (peer && !peer.destroyed) {
    try {
      peer.destroy();
    } catch {
      // Destruir o peer também é melhor esforço.
    }
  }
}

function syncHttpOnlinePlayers() {
  if (window.location.protocol === "file:" || state.onlineSyncing) {
    return;
  }

  state.onlineSyncing = true;

  fetch("/api/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(createOnlinePayload()),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("online sync failed");
      }
      return response.json();
    })
    .then((payload) => {
      if (state.mode !== "playing") {
        return;
      }

      state.onlineConnected = true;
      state.onlinePlayers = normalizeOnlinePlayers(payload.players || []);
    })
    .catch(() => {
      state.onlineConnected = false;
      state.onlinePlayers = [];
    })
    .finally(() => {
      state.onlineSyncing = false;
    });
}

function createOnlinePayload() {
  const snake = state.snake;

  return {
    id: state.playerId,
    name: state.playerName,
    skin: state.playerSkinOverride || state.selectedSkin,
    accessory: state.playerAccessoryOverride || state.selectedAccessory,
    snake: {
      head: {
        x: Math.round(snake.head.x),
        y: Math.round(snake.head.y),
      },
      angle: Number(snake.angle.toFixed(4)),
      speed: Math.round(snake.speed),
      segmentCount: snake.segmentCount,
      segmentGap: snake.segmentGap,
      trail: snake.trail
        .slice(0, onlineSettings.maxTrailPoints)
        .map((point) => [Math.round(point.x), Math.round(point.y)]),
    },
    coins: state.coins,
    turboActive: isPowerActive("turbo"),
    shieldActive: isPowerActive("shield"),
  };
}

function normalizeOnlinePlayers(players) {
  return players
    .filter((player) => player && player.id !== state.playerId)
    .map((player) => {
      const snake = player.snake || {};
      const head = snake.head || {};
      const trail = Array.isArray(snake.trail) ? snake.trail : [];
      const accessory = player.accessory === "brazilKit" || getAccessory(player.accessory)
        ? player.accessory
        : "roundGlasses";

      return {
        id: String(player.id || ""),
        name: String(player.name || "Cobra").slice(0, 18),
        skin: skins[player.skin] ? player.skin : "classic",
        accessory,
        coins: Number(player.coins) || 0,
        turboActive: Boolean(player.turboActive),
        shieldActive: Boolean(player.shieldActive),
        snake: {
          head: {
            x: Number(head.x) || snakeDefaults.x,
            y: Number(head.y) || snakeDefaults.y,
          },
          angle: Number(snake.angle) || 0,
          speed: Number(snake.speed) || snakeDefaults.speed,
          segmentCount: clamp(Number(snake.segmentCount) || 20, 8, 90),
          segmentGap: clamp(Number(snake.segmentGap) || snakeDefaults.segmentGap, 8, 18),
          trail: trail.map(normalizeTrailPoint),
        },
      };
    });
}

function normalizeTrailPoint(point) {
  if (Array.isArray(point)) {
    return {
      x: Number(point[0]) || snakeDefaults.x,
      y: Number(point[1]) || snakeDefaults.y,
    };
  }

  return {
    x: Number(point.x) || snakeDefaults.x,
    y: Number(point.y) || snakeDefaults.y,
  };
}

function sendOnlineLeave() {
  if (state.onlineHostConnection?.open) {
    sendPeerMessage(state.onlineHostConnection, { type: "leave", id: state.playerId });
  }

  closePeerNetwork();
  state.onlineConnected = false;
  state.onlinePlayers = [];

  if (window.location.protocol === "file:") {
    return;
  }

  const body = JSON.stringify({ id: state.playerId });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/leave", new Blob([body], { type: "application/json" }));
    return;
  }

  fetch("/api/leave", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

function startMusic() {
  if (musicState.playing || !ensureMusicContext()) {
    return;
  }

  musicState.playing = true;
  musicState.step = 0;
  playMusicStep();
  musicState.timer = window.setInterval(playMusicStep, musicSettings.stepMs);
}

function stopMusic() {
  if (!musicState.playing) {
    return;
  }

  window.clearInterval(musicState.timer);
  musicState.timer = 0;
  musicState.playing = false;
}

function showEventMessage(message) {
  window.clearTimeout(state.eventMessageTimer);
  eventMessage.textContent = message;
  eventMessage.classList.add("is-visible");
  state.eventMessageTimer = window.setTimeout(hideEventMessage, 4200);
}

function hideEventMessage() {
  window.clearTimeout(state.eventMessageTimer);
  state.eventMessageTimer = 0;
  eventMessage.classList.remove("is-visible");
}

function ensureMusicContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    return false;
  }

  if (!musicState.context) {
    musicState.context = new AudioContextClass();
    musicState.master = musicState.context.createGain();
    applyMusicVolume();
    musicState.master.connect(musicState.context.destination);
  }

  if (musicState.context.state === "suspended") {
    void musicState.context.resume();
  }

  return true;
}

function playMusicStep() {
  if (!musicState.context || !musicState.master) {
    return;
  }

  const melodyIndex = musicState.step % musicSettings.melody.length;
  const harmonyIndex = Math.floor(musicState.step / 2) % musicSettings.harmony.length;
  const leadFrequency = musicSettings.melody[melodyIndex];

  playTone(leadFrequency, 0.12, "triangle", musicSettings.leadVolume);

  if (musicState.step % 4 === 0) {
    playTone(musicSettings.harmony[harmonyIndex], 0.2, "sine", musicSettings.harmonyVolume);
  }

  if (musicState.step % 8 === 6) {
    playTone(leadFrequency / 2, 0.14, "triangle", musicSettings.leadVolume * 0.72);
  }

  musicState.step += 1;
}

function playBrazilPickupSound() {
  if (!ensureMusicContext()) {
    return;
  }

  playTone(196, 0.11, "sine", 0.08);
  window.setTimeout(() => playTone(880, 0.11, "triangle", 0.09), 120);
  window.setTimeout(() => playTone(1174.66, 0.11, "triangle", 0.1), 250);
  window.setTimeout(() => playTone(1567.98, 0.16, "triangle", 0.11), 380);
}

function playTone(frequency, durationSeconds, type, volume) {
  const audioContext = musicState.context;
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

  oscillator.connect(gain);
  gain.connect(musicState.master);
  oscillator.start(now);
  oscillator.stop(now + durationSeconds + 0.025);
}

function loop(timestamp) {
  if (!state.lastTime) {
    state.lastTime = timestamp;
  }

  const deltaSeconds = Math.min((timestamp - state.lastTime) / 1000, 0.033);
  state.lastTime = timestamp;

  update(deltaSeconds);
  draw();
  requestAnimationFrame(loop);
}

function startPointerControl(event) {
  event.preventDefault();
  state.pointer.active = true;
  if (canvas.setPointerCapture) {
    canvas.setPointerCapture(event.pointerId);
  }
  setPointer(event);
}

function movePointerControl(event) {
  event.preventDefault();
  setPointer(event);
}

function endPointerControl(event) {
  event.preventDefault();
  state.pointer.active = false;
  handlePauseTap(event);
  if (canvas.hasPointerCapture && canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
}

function cancelPointerControl() {
  state.pointer.active = false;
}

function getTouchPoint(event) {
  return event.touches[0] || event.changedTouches[0] || null;
}

function startTouchControl(event) {
  const touch = getTouchPoint(event);

  if (!touch) {
    return;
  }

  event.preventDefault();
  state.pointer.active = true;
  setPointerFromClient(touch.clientX, touch.clientY);
}

function moveTouchControl(event) {
  const touch = getTouchPoint(event);

  if (!touch) {
    return;
  }

  event.preventDefault();
  setPointerFromClient(touch.clientX, touch.clientY);
}

function endTouchControl(event) {
  const touch = getTouchPoint(event);

  event.preventDefault();
  state.pointer.active = false;

  if (touch) {
    handlePauseTap({ clientX: touch.clientX, clientY: touch.clientY });
  }
}

window.addEventListener("resize", resize);
window.addEventListener("pagehide", sendOnlineLeave);

if (window.PointerEvent) {
  canvas.addEventListener("pointerdown", startPointerControl);
  canvas.addEventListener("pointermove", movePointerControl);
  canvas.addEventListener("pointerup", endPointerControl);
  canvas.addEventListener("pointercancel", cancelPointerControl);
} else {
  canvas.addEventListener("touchstart", startTouchControl, { passive: false });
  canvas.addEventListener("touchmove", moveTouchControl, { passive: false });
  canvas.addEventListener("touchend", endTouchControl, { passive: false });
  canvas.addEventListener("touchcancel", cancelPointerControl, { passive: false });
}

canvas.addEventListener("dblclick", (event) => {
  event.preventDefault();
  pauseGame();
});

function handlePauseTap(event) {
  if (state.mode !== "playing") {
    state.lastTapAt = 0;
    return;
  }

  const now = performance.now();
  const dx = event.clientX - state.lastTapX;
  const dy = event.clientY - state.lastTapY;
  const isDoubleTap = now - state.lastTapAt < 330 && Math.hypot(dx, dy) < 42;

  if (isDoubleTap) {
    state.lastTapAt = 0;
    pauseGame();
    return;
  }

  state.lastTapAt = now;
  state.lastTapX = event.clientX;
  state.lastTapY = event.clientY;
}

resetButton.addEventListener("click", startGame);
playButton.addEventListener("click", startGame);
wardrobeButton.addEventListener("click", () => {
  const shouldOpen = wardrobePanel.classList.contains("is-collapsed");

  wardrobePanel.classList.toggle("is-collapsed", !shouldOpen);
  settingsPanel.classList.add("is-collapsed");
  wardrobeButton.classList.toggle("is-active", shouldOpen);
  settingsButton.classList.remove("is-active");
  menuStatus.textContent = shouldOpen ? "Vestuário aberto" : "Teste 02";
});

settingsButton.addEventListener("click", () => {
  const shouldOpen = settingsPanel.classList.contains("is-collapsed");

  settingsPanel.classList.toggle("is-collapsed", !shouldOpen);
  wardrobePanel.classList.add("is-collapsed");
  settingsButton.classList.toggle("is-active", shouldOpen);
  wardrobeButton.classList.remove("is-active");
  menuStatus.textContent = shouldOpen ? "Configurações" : "Teste 02";
});

lightnessSlider.addEventListener("input", (event) => {
  setSkinLightness(event.target.value);
});

volumeSlider.addEventListener("input", (event) => {
  setVolume(event.target.value);
});

resize();
resetSnake();
normalizeWardrobe();
updateLightnessControl();
updateVolumeControl();
renderSkinButtons();
renderAccessoryButtons();
updateSkinButtons();
updateMenuCounters();
syncScreenState();
requestAnimationFrame(loop);
