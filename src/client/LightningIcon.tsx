interface Props {
  readonly size?: number
  readonly className?: string
}

/** Compact filled lightning glyph shared by the two composer Skill entries. */
export function LightningIcon({ size = 18, className }: Props): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M10.7 1.35 3.15 10.1h4.32l-.82 6.55 7.86-9.2h-4.47z" fill="currentColor" />
    </svg>
  )
}
