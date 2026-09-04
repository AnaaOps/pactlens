/**
 * PactLens Legal-Editorial Design System
 * Aesthetic: Warm stone background with subtle contract texture,
 * semi-transparent charcoal/graphite film, warm off-white typography,
 * and deep muted crimson accents (~5%) for substantive changes and risk.
 */
export const tokens = {
  // Charcoal/Graphite film and warm stone surfaces
  bg: '#141619',
  film: 'rgba(20, 22, 26, 0.88)',
  surface: '#1E2126',
  surfaceWarm: '#24272E',
  surfaceSubtle: '#282B33',
  surfaceMuted: '#1A1C20',
  
  // Refined borders in muted graphite/stone
  border: 'rgba(255, 255, 255, 0.08)',
  borderDark: 'rgba(255, 255, 255, 0.16)',
  borderSubtle: 'rgba(255, 255, 255, 0.04)',
  
  // Warm off-white, readable stone gray typography
  ink: '#F5F3EF',
  charcoal: '#D5D1CB',
  darkBrown: '#B8323B', // Primary CTA crimson
  muted: '#9C978F',
  faint: '#625E57',
  
  // Deep muted crimson signature accent (~5% of system)
  crimson: '#B8323B',
  crimsonHover: '#CB3842',
  crimsonLight: 'rgba(184, 50, 59, 0.16)',
  crimsonBorder: 'rgba(184, 50, 59, 0.35)',

  // Backward-compatible burgundy aliases mapped to crimson
  burgundy: '#B8323B',
  burgundyHover: '#CB3842',
  burgundyLight: 'rgba(184, 50, 59, 0.16)',
  burgundyBorder: 'rgba(184, 50, 59, 0.35)',
  
  // Functional risk indicators
  riskHigh: '#C84852',
  riskHighBg: 'rgba(200, 72, 82, 0.16)',
  riskHighBorder: 'rgba(200, 72, 82, 0.40)',
  
  riskMed: '#E09228',
  riskMedBg: 'rgba(224, 146, 40, 0.14)',
  riskMedBorder: 'rgba(224, 146, 40, 0.35)',
  
  riskLow: '#22C55E',
  riskLowBg: 'rgba(34, 197, 94, 0.12)',
  riskLowBorder: 'rgba(34, 197, 94, 0.30)',
} as const

export function riskColor(severity: string): string {
  if (severity === 'High') return tokens.riskHigh
  if (severity === 'Medium') return tokens.riskMed
  return tokens.riskLow
}

export function overallRisk(counts: { High: number; Medium: number; Low: number }): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (counts.High > 0) return 'HIGH'
  if (counts.Medium > 0) return 'MEDIUM'
  return 'LOW'
}
