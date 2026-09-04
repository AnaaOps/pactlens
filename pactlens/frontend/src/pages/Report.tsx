import { Navigate, useParams } from 'react-router-dom'

/** Legacy route — reports now live at /results/:scanId */
export default function Report() {
  const { scanId } = useParams()
  return <Navigate to={`/results/${scanId}`} replace />
}
