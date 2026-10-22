import type { AvailableSkill } from './types.js'

export interface PickerSkill {
  readonly name: string
  readonly description: string
  readonly scope: '可用' | '仅手动'
}

export function effectivePickerSkills(catalog: readonly AvailableSkill[] | null): PickerSkill[] {
  // The native catalog already resolves providers, preset scope, cwd, name
  // priority and user-invocation policy. Never intersect it with our library.
  return (catalog ?? []).map(skill => ({
    name: skill.name,
    description: skill.description,
    scope: skill.modelInvocable ? '可用' : '仅手动',
  }))
}
