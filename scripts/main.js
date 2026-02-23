import { initializeControlButtons } from "./control-buttons.js";
import { initializePhyVisionLayer } from "./phy-vision-layer.js";

Hooks.once("init", () => {
    initializePhyVisionLayer();
    initializeControlButtons();
});