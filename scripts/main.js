import { moduleName } from "./consts.js";
import { initializeControlButtons } from "./control-buttons.js";
import { PhyVisionLayer, initializePhyVisionLayer } from "./phy-vision-layer.js";

class PhyVision {
    constructor() {
        this.layer = foundry.canvas.Canvas.layers[moduleName];
        this.active = this.layer.active;
    }

    toggleGMLayer() {
        this.active = !this.active;
        this.active ? this.phyVisionLayer.activate() : this.phyVisionLayer.deactivate();
    }
}

Hooks.once("init", () => {
    initializePhyVisionLayer();
    initializeControlButtons();
});

Hooks.once("setup", () => {
    globalThis.phyVision = new PhyVision();
})