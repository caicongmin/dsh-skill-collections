import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
type Props = PropsRuntime<'settings.section'>;
type Tab = 'library' | 'collections' | 'workspace';
export declare function SkillCollectionsPanel({ initialWorkspaceId, initialSessionId, initialTab, context }: Partial<Props> & {
    readonly initialWorkspaceId?: string;
    readonly initialSessionId?: string;
    readonly initialTab?: Tab;
    readonly context?: {
        workspaceId?: string;
    };
}): JSX.Element;
export {};
