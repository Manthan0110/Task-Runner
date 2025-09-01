import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

type DLQ = {
  id: number;
  task_id: number;
  error: string;
  created_at: string;
};

async function fetchDlq(taskId: string, limit: number, offset: number): Promise<DLQ[]> {
  const { data } = await api.get<DLQ[]>(`/tasks/${taskId}/dlq?limit=${limit}&offset=${offset}`);
  return data;
}

async function replay(taskId: string, dlqId: number): Promise<{ ok: boolean }> {
  const { data } = await api.post(`/tasks/${taskId}/dlq/${dlqId}/replay`, {});
  return data as { ok: boolean };
}

export default function TaskDlq() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery<DLQ[], Error>({
    queryKey: ["dlq", id],
    queryFn: () => fetchDlq(id!, 100, 0),
    enabled: !!id,
    placeholderData: (prev) => prev,
  });

  const mReplay = useMutation({
    mutationFn: (dlqId: number) => replay(id!, dlqId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dlq", id] });
      qc.invalidateQueries({ queryKey: ["runs", id] });
    },
  });

  if (!id) return <div>Missing task id.</div>;
  if (isLoading) return <div>Loading DLQ…</div>;
  if (isError) {
    const e: any = error;
    const msg = e?.response?.data?.detail || e?.response?.statusText || e?.message || "Failed to load DLQ";
    return <div style={{ color: "crimson" }}>{msg} <button onClick={() => refetch()}>Retry</button></div>;
  }

  const rows: DLQ[] = data ?? [];

  return (
    <div>
      <h3>DLQ for Task #{id}</h3>
      <p>
        <Link to={`/tasks/${id}/runs`}>← Back to runs</Link>
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left">ID</th>
            <th align="left">When</th>
            <th align="left">Error</th>
            <th align="left">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => (
            <tr key={d.id} style={{ borderTop: "1px solid #eee" }}>
              <td>{d.id}</td>
              <td>{new Date(d.created_at).toLocaleString()}</td>
              <td style={{ maxWidth: 520, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={d.error}>
                {d.error}
              </td>
              <td>
                <button onClick={() => mReplay.mutate(d.id)} disabled={mReplay.isPending}>Replay now</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {rows.length === 0 && <p>No DLQ entries 🎉</p>}
    </div>
  );
}
