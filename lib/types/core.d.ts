export declare const SKILL_NAME: RegExp;
export declare const COLLECTION_ID: RegExp;
export declare const WORKSPACE_CONFIG_FILE = "skill-collections.yml";
export declare const WORKSPACE_MANIFEST_FILE = "skill-collections.manifest.json";
export declare const GLOBAL_MANIFEST_FILE = "global-links.manifest.json";
export interface Paths {
    readonly dshHome: string;
    readonly root: string;
    readonly library: string;
    readonly collections: string;
    readonly globalSkills: string;
}
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
export interface SyncResult {
    readonly workspace: string;
    readonly created: readonly string[];
    readonly removed: readonly string[];
    readonly unchanged: readonly string[];
    readonly conflicts: readonly {
        readonly name: string;
        readonly message: string;
    }[];
    readonly missing: readonly string[];
}
export interface UploadedSkillFile {
    readonly path: string;
    readonly content: string;
}
export declare function resolvePaths(dshHome?: string): Paths;
export declare function scanSkills(root: string): Promise<SkillInfo[]>;
export declare function readCollections(paths: Paths): Promise<CollectionInfo[]>;
export declare function saveCollection(paths: Paths, input: {
    readonly id: string;
    readonly name: string;
    readonly description?: string;
    readonly skills: readonly string[];
}): Promise<CollectionInfo>;
export declare function removeCollection(paths: Paths, id: string): Promise<void>;
export declare function readWorkspaceConfig(workspace: string): Promise<WorkspaceConfig>;
export declare function writeWorkspaceConfig(workspace: string, config: WorkspaceConfig): Promise<void>;
export declare function updateWorkspaceCollection(workspace: string, id: string, enabled: boolean): Promise<WorkspaceConfig>;
export declare function updateWorkspaceSkill(workspace: string, name: string, mode: 'enable' | 'disable' | 'clear'): Promise<WorkspaceConfig>;
export declare function listGlobalSkills(paths: Paths): Promise<SkillInfo[]>;
export declare function setGlobalSkill(paths: Paths, name: string, enabled: boolean): Promise<{
    readonly name: string;
    readonly enabled: boolean;
}>;
export declare function syncWorkspace(paths: Paths, workspaceInput: string): Promise<SyncResult>;
export declare function effectiveSkills(paths: Paths, workspaceInput: string): Promise<EffectiveSkill[]>;
export declare function importSkillFromPath(paths: Paths, sourceInput: string, requestedName?: string): Promise<SkillInfo>;
export declare function importUploadedSkill(paths: Paths, files: readonly UploadedSkillFile[]): Promise<SkillInfo>;
export declare function adoptGlobalSkill(paths: Paths, name: string): Promise<SkillInfo>;
export declare function deleteLibrarySkill(paths: Paths, name: string): Promise<void>;
