import { TVFrameSocketHandler } from "./socket-handler.js";

import { initializeControlButtons } from "./control-buttons.js";
import { initializePhyVisionLayer } from "./phyvision-layer.js";
import { initializeConfigurations } from "./configurations.js";

class PhyVision {
    constructor() {
        this.socketHandler = new TVFrameSocketHandler();
        this.socketHandler.register();
    }
}

Hooks.once("init", () => {
    initializeConfigurations();
    initializePhyVisionLayer();
    initializeControlButtons();
});

Hooks.once("ready", () => {
    globalThis.phyvision = new PhyVision();
});

Hooks.on("canvasPan", (canvas, panData) => {
  // Если мы наблюдатель и вид заблокирован — отменяем ручной pan
  const isObserver = game.settings.get(MODULE_ID, "isObserver");
  const isLocked = game.settings.get(MODULE_ID, "viewLocked");

  if (isObserver && isLocked) {
    return false; // предотвращаем pan
  }
});

Hooks.on("canvasReady", () => {
  const isObserver = game.settings.get(MODULE_ID, "isObserver");
  if (isObserver) {
    // Скрываем UI элементы на TV-экране
    document.getElementById("ui-left")?.style.setProperty("display", "none");
    document.getElementById("ui-right")?.style.setProperty("display", "none");
    document.getElementById("navigation")?.style.setProperty("display", "none");
    document.getElementById("players")?.style.setProperty("display", "none");
  }
});