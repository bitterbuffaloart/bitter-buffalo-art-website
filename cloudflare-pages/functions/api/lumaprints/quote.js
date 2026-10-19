import { quotePrint, requireAdmin } from '../../_lib/lumaprints.js';

export async function onRequestPost({ request, env = {} }) {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  return quotePrint(request, env);
}
