import { moduleName } from "./consts.js";
import { fullSyncToObserver } from "./socket-handler.js";

export function initializeControlButtons() {
    Hooks.on('getSceneControlButtons', controls => {
        controls.phyvision = {
            activeTool: "visionControl",
            name: "phyvision",
            title: "phyvision",
            icon: "fas fa-eye",
            visible: game.user.isGM,
            onChange: () => canvas[moduleName].activate(),
            tools: {
                visionControl: {
                    name: "visionControl",
                    title: "Manual vision control",
                    icon: "fas fa-eye",
                    order: 0,
                },
            },
        }
    });
}