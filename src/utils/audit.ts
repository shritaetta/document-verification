import { createClient } from '@/utils/supabase/server'

export async function logAudit(
  actorId: string,
  action: string,
  entityType: string,
  entityId?: string,
  ipAddress?: string
) {
  const supabase = await createClient()
  
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
