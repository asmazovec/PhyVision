import { moduleName } from "./consts.js";
import { SocketAction } from "./socket-handler.js";

/**
 * Диалог выбора наблюдателя — доступен только GM
 */
export class ObserverPickerDialog extends foundry.applications.api.ApplicationV2 {
    static DEFAULT_OPTIONS = {
        id: "tv-frame-observer-picker",
        window: {
            title: "TV Frame: Выбор наблюдателя",
            icon: "fas fa-tv",
            resizable: false,
        },
        position: {
            width: 320,
            height: "auto",
        },
    };

    static PARTS = {
        form: {
            template: `modules/${moduleName}/templates/observer-picker.hbs`,
        },
    };

    async _prepareContext() {
        const currentObserverId = game.settings.get(moduleName, "selectedObserverId");

        // Получаем список онлайн-пользователей (кроме текущего GM)
        const onlineUsers = game.users
            .filter((u) => u.active && u.id !== game.user.id)
            .map((u) => ({
                id: u.id,
                name: u.name,
                isSelected: u.id === currentObserverId,
                role: u.role,
                isGM: u.isGM,
            }));

        return {
            users: onlineUsers,
            currentObserverId,
            hasObserver: !!currentObserverId,
        };
    }

    static async selectObserver(userId) {
        const handler = phyvision.socketHandler;
        const previousObserverId = game.settings.get(moduleName, "selectedObserverId");

        // Отключаем предыдущего наблюдателя
        if (previousObserverId) {
            handler.emit(SocketAction.SET_OBSERVER, {
                observerUserId: previousObserverId,
                enabled: false,
            });
        }

        // Назначаем нового
        await game.settings.set(moduleName, "selectedObserverId", userId);
        handler.emit(SocketAction.SET_OBSERVER, {
            observerUserId: userId,
            enabled: true,
        });

        const user = game.users.get(userId);
        ui.notifications.info(`Наблюдатель назначен: ${user?.name}`);
    }

    static async clearObserver() {
        const handler = phyvision.socketHandler;
        const previousObserverId = game.settings.get(moduleName, "selectedObserverId");

        if (previousObserverId) {
            handler.emit(SocketAction.SET_OBSERVER, {
                observerUserId: previousObserverId,
                enabled: false,
            });
        }

        await game.settings.set(moduleName, "selectedObserverId", "");
        ui.notifications.info("Наблюдатель отключён");
    }
}