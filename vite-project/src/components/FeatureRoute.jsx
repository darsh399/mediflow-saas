import { Outlet } from 'react-router-dom'
import { useFeature } from '../hooks/useFeature'
import FeatureUnavailable from '../pages/FeatureUnavailable'

// Renders children only when the company has `feature` enabled; otherwise shows
// the "feature unavailable" screen. Sits inside the existing auth/role guards.
// Use as a layout route (with <Outlet/>) or wrap a single element.
const FeatureRoute = ({ feature, children }) => {
  const enabled = useFeature(feature)
  if (!enabled) return <FeatureUnavailable feature={feature} />
  return children ?? <Outlet />
}

export default FeatureRoute
