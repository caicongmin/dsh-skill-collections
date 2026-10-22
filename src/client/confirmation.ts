export interface ConfirmationOptions {
  readonly title: string
  readonly message: string
  readonly confirmLabel: string
  readonly danger?: boolean
}

/** One cancellable request at a time; dismissal/unmount never authorizes an action. */
export class ConfirmationController {
  private active = false
  private resolve?: (accepted: boolean) => void

  constructor(private readonly changed: (options: ConfirmationOptions | null) => void) {}

  activate(): void { this.active = true }

  request(options: ConfirmationOptions): Promise<boolean> {
    if (!this.active || this.resolve !== undefined) return Promise.resolve(false)
    return new Promise(resolve => {
      this.resolve = resolve
      this.changed(options)
    })
  }

  answer(accepted: boolean): void {
    const resolve = this.resolve
    if (resolve === undefined) return
    this.resolve = undefined
    this.changed(null)
    resolve(accepted)
  }

  dispose(): void {
    this.active = false
    const resolve = this.resolve
    this.resolve = undefined
    resolve?.(false)
  }
}
