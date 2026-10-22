interface Props {
    readonly sessionIds: readonly string[];
    readonly preferredSessionId?: string;
    readonly query: string;
    readonly refreshKey: unknown;
}
/** Read-only view of the same session-addressed catalog as the native / menu. */
export declare function AvailableSkills({ sessionIds, preferredSessionId, query, refreshKey }: Props): JSX.Element;
export {};
