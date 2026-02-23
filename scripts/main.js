import { moduleName } from "./consts.js";
import { initializeControlButtons } from "./control-buttons.js";
import { initializePhyVisionLayer } from "./phy-vision-layer.js";

class PhyVision {
    constructor() {
        const layerName = foundry.canvas.Canvas.layers[moduleName].layerClass.name;
        this.layer = canvas.layers.find(x => x.name === layerName);
        this.active = this.layer.active;
    }

    toggleGMLayer() {
        this.active = !this.active;
        this.active ? this.layer.activate() : this.layer.deactivate();
    }
}

Hooks.once("init", () => {
    initializePhyVisionLayer();
    initializeControlButtons();
});

Hooks.once("setup", () => {
    globalThis.phyVision = new PhyVision();
})