export interface ConfirmationOptions {
    readonly title: string;
    readonly message: string;
    readonly confirmLabel: string;
    readonly danger?: boolean;
}
/** One cancellable request at a time; dismissal/unmount never authorizes an action. */
export declare class ConfirmationController {
    private readonly changed;
    private active;
    private resolve?;
    constructor(changed: (options: ConfirmationOptions | null) => void);
    activate(): void;
    request(options: ConfirmationOptions): Promise<boolean>;
    answer(accepted: boolean): void;
    dispose(): void;
}
