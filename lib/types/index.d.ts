import type { IncomingMessage } from 'node:http';
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
declare function ownerRejection(connection: {
    requestRejection(request: IncomingMessage): 401 | 403 | undefined;
    admit(request: IncomingMessage): {
        rejection: 401 | 403;
    } | {
        peer: {
            principal: {
                kind: string;
            };
        };
    };
}, req: IncomingMessage): 401 | 403 | undefined;
export declare const _internals: {
    handleEndpoint: typeof handleEndpoint;
    snapshot: typeof snapshot;
    ownerRejection: typeof ownerRejection;
};
export {};
