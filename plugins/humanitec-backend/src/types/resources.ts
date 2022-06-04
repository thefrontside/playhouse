import { array, string, record, unknown, object } from 'zod';

const ActiveResource = object({
  app_id: string(),
  def_id: string(),
  env_id: string(),
  env_type: string(),
  org_id: string(),
  res_id: string(),
  resource: record(unknown()).optional().nullable(),
  status: string(),
  type: string(),
  updated_at: string(),
})

export const ResourcesResponsePayload = array(ActiveResource);