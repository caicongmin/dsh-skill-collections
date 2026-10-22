export interface DraftRange {
    readonly start: number;
    readonly end: number;
}
export interface InsertDraftResult {
    readonly text: string;
    readonly caret: number;
}
/** Insert the native `/skill-name` gesture at a textarea range. */
export declare function buildInsertedDraft(draft: string, name: string, range?: DraftRange): InsertDraftResult;
