import type { Context as ClientContext } from '@deepseek-ai/cordis';
import type { AvailableSkill } from './types.js';
declare module '@deepseek-ai/dsh-api-session-controller/client' {
    interface SessionReferenceSourceMap {
        skillCollectionsCatalog: unknown;
    }
}
export declare const inject: string[];
export declare function subscribeCatalogChanges(listener: (sessionId?: string) => void, sessionId?: string): () => void;
export declare function listAvailableSkills(sessionId: string, signal: AbortSignal): Promise<readonly AvailableSkill[]>;
export declare function openPath(path: string): Promise<void>;
export declare function rpc<T>(endpoint: string, args?: Record<string, unknown>): Promise<T>;
export declare function apply(ctx: ClientContext): void;
