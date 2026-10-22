/** One cancellable request at a time; dismissal/unmount never authorizes an action. */
export class ConfirmationController {
    changed;
    active = false;
    resolve;
    constructor(changed) {
        this.changed = changed;
    }
    activate() { this.active = true; }
    request(options) {
        if (!this.active || this.resolve !== undefined)
            return Promise.resolve(false);
        return new Promise(resolve => {
            this.resolve = resolve;
            this.changed(options);
        });
    }
    answer(accepted) {
        const resolve = this.resolve;
        if (resolve === undefined)
            return;
        this.resolve = undefined;
        this.changed(null);
        resolve(accepted);
    }
    dispose() {
        this.active = false;
        const resolve = this.resolve;
        this.resolve = undefined;
        resolve?.(false);
    }
}
//# sourceMappingURL=confirmation.js.map