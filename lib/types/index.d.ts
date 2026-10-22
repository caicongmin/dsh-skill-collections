import type { Context } from '@deepseek-ai/cordis';
import { type Paths } from './core.js';
export declare const name = "dsh-skill-collections";
export declare const inject: string[];
export interface Config {
    readonly dshHome?: string;
}
declare function snapshot(ctx: Context, paths: Paths, workspaceId?: unknown): Promise<unknown>;
declare function handleEndpoint(ctx: Context, paths: Paths, endpoint: string, body: Record<string, unknown>): Promise<unknown>;
export declare function apply(ctx: Context, config?: Config): void;
export declare const _internals: {
    handleEndpoint: typeof handleEndpoint;
    snapshot: typeof snapshot;
};
export {};
