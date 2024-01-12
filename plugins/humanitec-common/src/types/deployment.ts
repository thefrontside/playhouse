import { object, string, enum as zEnum } from 'zod';

export const Deployment = object({
  comment: string(),
  created_at: string(),
  created_by: string(),
  delta_id: string().optional(),
  env_id: string(),
  export_file: string(),
  export_status: string(),
  from_id: string(),
  id: string(),
  set_id: string(),
  status: zEnum(['pending', 'in progress', 'succeeded', 'failed']),
  status_changed_at: string()
});
