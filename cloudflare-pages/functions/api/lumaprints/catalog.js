import { loadCatalog, requireAdmin } from '../../_lib/lumaprints.js';

export async function onRequestGet({ request, env = {} }) {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  return loadCatalog(env);
}
