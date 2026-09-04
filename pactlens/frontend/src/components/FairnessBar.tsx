import type { FairnessBenchmark } from '../api'
import { FairnessBaseline } from './FairnessBaseline'

/** Back-compat wrapper — prefer FairnessBaseline */
export type { FairnessBenchmark }

export function FairnessBar({ benchmark }: { benchmark: FairnessBenchmark }) {
  return <FairnessBaseline items={[benchmark]} />
}
