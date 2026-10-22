import type { AvailableSkill } from './types.js';
export interface PickerSkill {
    readonly name: string;
    readonly description: string;
    readonly scope: '可用' | '仅手动';
}
export declare function effectivePickerSkills(catalog: readonly AvailableSkill[] | null): PickerSkill[];
