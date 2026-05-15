/** Judo BC brand mark — renders in 'light' (black ink) or 'dark' (white ink) mode */
export function JudoBCLogo({
  variant = 'light',
  height = 48,
}: {
  variant?: 'light' | 'dark'
  height?: number
}) {
  const fg = variant === 'dark' ? '#ffffff' : '#0d0d0d'
  const bg = variant === 'dark' ? '#0d0d0d' : '#ffffff'
  const w  = Math.round(height * 3.4)

  const scallops = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * 2 * Math.PI - Math.PI / 2
    return { cx: 25 + 23.2 * Math.cos(a), cy: 25 + 23.2 * Math.sin(a) }
  })

  return (
    <svg width={w} height={height} viewBox="0 0 170 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Scalloped outer ring */}
      {scallops.map((p, i) => (
        <circle key={i} cx={p.cx} cy={p.cy} r="3.0" fill={bg} stroke={fg} strokeWidth="1.3" />
      ))}
      <circle cx="25" cy="25" r="21" stroke={fg} strokeWidth="1.8" fill={bg} />
      <circle cx="25" cy="25" r="13" stroke={fg} strokeWidth="0.9" fill={bg} />
      {/* Hinomaru — red circle */}
      <circle cx="25" cy="25" r="8.5" fill="#C0392B" />
      {/* JUDO BC — single horizontal line */}
      <text x="57" y="36" fontFamily="'Bebas Neue', sans-serif" fontSize="25" letterSpacing="2" fill={fg}>
        JUDO BC
      </text>
    </svg>
  )
}

/** Team BC speed-stripe wordmark */
export function TeamBCLogo({
  variant = 'light',
  height = 52,
}: {
  variant?: 'light' | 'dark'
  height?: number
}) {
  const fg = variant === 'dark' ? '#ffffff' : '#0d0d0d'
  const w  = Math.round(height * 3.5)

  return (
    <svg width={w} height={height} viewBox="0 0 182 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Left speed stripes — diagonal parallelograms leaning right (/) */}
      <polygon points="0,10  26,2  32,11  6,19"  fill="#C0392B" />
      <polygon points="0,22  26,14 32,23  6,31"  fill="#C0392B" />
      <polygon points="0,34  26,26 32,35  6,43"  fill="#C0392B" />
      {/* TEAM */}
      <text
        x="37" y="38"
        fontFamily="'Bebas Neue', sans-serif"
        fontSize="40"
        letterSpacing="2"
        fill={fg}
      >
        TEAM
      </text>
      {/* Right speed stripes — same lean direction */}
      <polygon points="148,2  174,10  168,19  142,11" fill="#C0392B" />
      <polygon points="148,14 174,22  168,31  142,23" fill="#C0392B" />
      <polygon points="148,26 174,34  168,43  142,35" fill="#C0392B" />
      {/* BC */}
      <text
        x="59" y="52"
        fontFamily="'Bebas Neue', sans-serif"
        fontSize="25"
        letterSpacing="5"
        fill="#C0392B"
      >
        BC
      </text>
    </svg>
  )
}
