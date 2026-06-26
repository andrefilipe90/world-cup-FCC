state.brazilAppleCount = 0;

const originalResetSnakeForBrazilLimit = resetSnake;
resetSnake = function resetSnakeWithBrazilLimit() {
  state.brazilAppleCount = 0;
  return originalResetSnakeForBrazilLimit();
};

const originalApplyItemEffectForBrazilLimit = applyItemEffect;
applyItemEffect = function applyItemEffectWithBrazilLimit(type) {
  if (type === "brazil") {
    if (state.brazilAppleCount >= 1) {
      endGame("Você não pode pegar mais de uma maçã brasileira 💀");
      return;
    }

    state.brazilAppleCount += 1;
  }

  return originalApplyItemEffectForBrazilLimit(type);
};
