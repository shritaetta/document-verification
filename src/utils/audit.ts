import { createClient, createAdminClient } from '@/utils/supabase/server'

export async function logAudit(
  actorId: string | null,
  action: string,
  entityType: string,
  entityId?: string,
  ipAddress?: string,
  useAdmin: boolean = false
) {
  const supabase = useAdmin ? await createAdminClient() : await createClient()
  
  const { error } = await supabase.from('audit_logs').insert({
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    ip_address: ipAddress
  })

  if (error) {
    console.error('Failed to log audit action:', error)
  }
}
