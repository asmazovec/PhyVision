import {initializeControlButtons} from "./control-buttons.js";
import {PhyVisionLayer, initializePhyVisionLayer} from "./phy-vision-layer.js";

class PhyVision {
    constructor() {
        this.active = false;
        this.phyVisionLayer = new PhyVisionLayer();
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