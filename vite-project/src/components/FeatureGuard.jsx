import { useLocation } from 'react-router-dom'
import { useFeatureSet, hasFeature } from '../hooks/useFeature'
import FeatureUnavailable from '../pages/FeatureUnavailable'

// Path -> feature key. First matching prefix wins (order matters: more specific
// prefixes first). Anything not listed is not feature-gated.
const ROUTE_FEATURES = [
  ['/doctors', 'doctors'],
  ['/medicals', 'medicals'],
  ['/territories', 'territories'],
  ['/tours', 'tour_plans'],
  ['/mr/add-visit', 'visits'],
  ['/mr/dcr', 'visits'],
  ['/dcr', 'visits'],
  ['/samples', 'visits'],
  ['/employee/visits', 'visits'],
  ['/admin/visits', 'visits'],
  ['/admin/top-performers', 'visits'],
  ['/sales', 'sales_targets'],
  ['/orders', 'orders'],
  ['/products', 'products'],
  ['/reports', 'reports'],
  ['/organization', 'organization_chart'],
  ['/attendance', 'attendance'],
  ['/leaves', 'leaves'],
  ['/expenses', 'expenses'],
  ['/offers', 'offer_letters'],
  ['/salary', 'payroll'],
  ['/calendar', 'calendar'],
  ['/tasks', 'tasks'],
  ['/notifications', 'notifications'],
  ['/employee/profiles', 'documents'],
  ['/employee/profile', 'documents'],
]

// Wraps the routed page; if the current path maps to a disabled feature it
// renders the "unavailable" screen instead of the page.
const FeatureGuard = ({ children }) => {
  const { pathname } = useLocation()
  const featureSet = useFeatureSet()
  const match = ROUTE_FEATURES.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  if (match && !hasFeature(featureSet, match[1])) {
    return <FeatureUnavailable feature={match[1]} />
  }
  return children
}

export default FeatureGuard
