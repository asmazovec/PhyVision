import { moduleName } from "../scripts/consts.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export const scalingControlApp = "phyvision-scaling-control";

export class ScalingControlApp extends HandlebarsApplicationMixin(ApplicationV2) {

    static DEFAULT_OPTIONS = {
        id: "scalingControlApp",
        title: "Настройки сторон (Scaling)",
        tag: "form",
        window: {
            icon: "fas fa-crop-alt",
            resizable: false,
        },
        position: {
            width: 350,
            height: "auto"
        },
        actions: {
            saveSettings: ScalingControlApp.#saveSettings
        }
    };

    static PARTS = {
        form: {
            template: `./modules/${moduleName}/templates/scaling-control.hbs`
        }
    };

    async _prepareContext(options) {
        const scalingSide = game.settings.get(moduleName, "scalingSide") || 1920;
        const { w, h } = ScalingControlApp.#WH(scalingSide);

        return { side: scalingSide, w: w, h: h };
    }

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        const sideInput = htmlElement.querySelector('[name="side"');
        const wInput = htmlElement.querySelector('[name="w"]');
        const hInput = htmlElement.querySelector('[name="h"]');

        sideInput.addEventListener('input', (e) => {
            const side = e.target.value;
            const { w, h } = ScalingControlApp.#WH(side);

            wInput.value = Math.round(w);
            hInput.value = Math.round(h);
        });
    }

    static async #saveSettings(event, target) {
        let side = parseInt(this.element.querySelector('[name="side"').value);
        let minSide = game.settings.get(moduleName, "scalingSideMin");

        let correctedSide = Math.max(side, minSide);
        await game.settings.set(moduleName, "scalingSide", correctedSide);

        const { w, h } = ScalingControlApp.#WH(correctedSide);

        phyvision.layer.frame.w = w;
        phyvision.layer.frame.h = h;

        this.close();
    }

    static #WH(scalingSide) {
        const ratio = phyvision.observerScreen.width / phyvision.observerScreen.height;
        return ratio > 1 ? { w: scalingSide, h: Math.round(scalingSide / ratio)} : { w: Math.round(scalingSide * ratio), h: scalingSide };
    }
}