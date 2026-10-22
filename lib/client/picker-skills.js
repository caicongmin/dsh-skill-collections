export function effectivePickerSkills(catalog) {
    // The native catalog already resolves providers, preset scope, cwd, name
    // priority and user-invocation policy. Never intersect it with our library.
    return (catalog ?? []).map(skill => ({
        name: skill.name,
        description: skill.description,
        scope: skill.modelInvocable ? '可用' : '仅手动',
    }));
}
//# sourceMappingURL=picker-skills.js.map