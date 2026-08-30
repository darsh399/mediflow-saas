import { useSelector } from 'react-redux'

// Company-level feature entitlements.
// The list comes from the authenticated user's company (login / /api/auth/me);
// super_admin gets an empty list and is treated as having everything.

export function useFeatureSet() {
  const user = useSelector((s) => s.auth.user)
  if (user?.role === 'super_admin') return null // null = all features
  return Array.isArray(user?.enabledModules) ? user.enabledModules : null
}

// True when the company has `key` enabled. Unknown key -> true (not gated).
export function hasFeature(featureSet, key) {
  if (!key) return true
  if (featureSet === null || featureSet === undefined) return true
  return featureSet.includes(key)
}

export function useFeature(key) {
  const set = useFeatureSet()
  return hasFeature(set, key)
}
