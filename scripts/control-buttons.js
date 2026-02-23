export function initializeControlButtons() {
    Hooks.on('getSceneControlButtons', controls => {
        controls.phyvision = {
            name: "phyvision",
            title: "phyvision",
            icon: "fas fa-eye",
            activeTool: "controlView",
            tools: {
                controlView: {
                    name: "controlView",
                    title: "controlView",
                    icon: "fas fa-compress-arrows-alt",
                    visible: true,
                    button: true,
                    order: 0,
                    onChange: () => phyVision.toggleGMLayer(),
                },
            },
        }
    });
}