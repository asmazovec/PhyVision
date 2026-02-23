export function initializeControlButtons() {
    Hooks.on('getSceneControlButtons', controls => {
        controls.phyvision = {
            activeTool: "visionControl",
            name: "phyvision",
            title: "phyvision",
            icon: "fas fa-eye",
            visible: game.user.isGM,
            onChange: () => phyVision.toggleGMLayer(),
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