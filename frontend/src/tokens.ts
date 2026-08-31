/** Design tokens — keep UI colors centralized */
export const tokens = {
  bg: '#0A0B0F',
  surface: '#14161C',
  surface2: '#1A1D25',
  border: '#262A35',
  gold: '#E9B949',
  riskHigh: '#E5484D',
  riskMed: '#E0952F',
  riskLow: '#35B57C',
  lavender: '#A6A9E8',
  ink: '#E8EAF0',
  muted: '#8B90A0',
} as const

export function riskColor(severity: string): string {
  if (severity === 'High') return tokens.riskHigh
  if (severity === 'Medium') return tokens.riskMed
  return tokens.riskLow
}
