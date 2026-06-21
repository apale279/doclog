const PREFIX = 'doclog_profile_v1';

function key(tenantId, uid) {
  return `${PREFIX}:${tenantId}:${uid}`;
}

export function loadOfflineProfile(tenantId, uid) {
  if (!tenantId || !uid || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key(tenantId, uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function saveOfflineProfile(tenantId, uid, profile) {
  if (!tenantId || !uid || !profile || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key(tenantId, uid), JSON.stringify(profile));
  } catch {
    /* quota / private mode */
  }
}

export function clearOfflineProfile(tenantId, uid) {
  if (!tenantId || !uid || typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(key(tenantId, uid));
  } catch {
    /* ignore */
  }
}
