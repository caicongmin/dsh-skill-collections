export interface SkillInfo {
    readonly name: string;
    readonly description: string;
    readonly path: string;
    readonly layout: 'directory' | 'file';
    readonly isSymlink: boolean;
    readonly linkTarget?: string;
    readonly globalManaged?: boolean;
}
export interface CollectionInfo {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly skills: readonly string[];
    readonly missingSkills: readonly string[];
}
export interface WorkspaceInfo {
    readonly id: string;
    readonly title: string;
    readonly path: string;
    readonly sessionIds?: readonly string[];
}
/** Exact user-invocable winners returned by the native, session-addressed / catalog. */
export interface AvailableSkill {
    readonly name: string;
    readonly description: string;
    readonly path?: string;
    readonly whenToUse?: string;
    readonly modelInvocable: boolean;
}
export interface WorkspaceConfig {
    readonly version: 1;
    readonly collections: readonly string[];
    readonly skills: {
        readonly enabled: readonly string[];
        readonly disabled: readonly string[];
    };
}
export interface EffectiveSkill {
    readonly name: string;
    readonly description?: string;
    readonly sources: readonly string[];
    readonly sourcePath?: string;
    readonly targetPath?: string;
    readonly status: 'linked' | 'global' | 'pending' | 'conflict' | 'missing';
    readonly detail?: string;
}
export interface Snapshot {
    readonly paths: {
        readonly library: string;
        readonly globalSkills: string;
        readonly collections: string;
    };
    readonly library: readonly SkillInfo[];
    readonly globalSkills: readonly SkillInfo[];
    readonly collections: readonly CollectionInfo[];
    readonly workspaces: readonly WorkspaceInfo[];
    readonly workspace?: WorkspaceInfo & {
        readonly config: WorkspaceConfig;
        readonly effective: readonly EffectiveSkill[];
    };
}
