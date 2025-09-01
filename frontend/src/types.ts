export interface Task {
  id: number;
  user_id?: string | null;
  url: string;
  method: string;
  schedule_cron?: string | null;
  enabled: boolean;
  created_at: string;
}

export interface Run {
  id: number;
  task_id: number;
  status: "success" | "failure";
  latency_ms: number;
  response_code: number | null;
  error?: string | null;
  created_at: string;
  failure_class?: string | null;
  failure_explanation?: string | null;
}
