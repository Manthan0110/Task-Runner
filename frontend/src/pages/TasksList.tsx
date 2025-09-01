import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import type { Task } from "../types";
import { Link } from "react-router-dom";
import { useState } from "react";

async function fetchTasks(limit: number, offset: number): Promise<Task[]> {
  const { data } = await api.get<Task[]>(`/tasks/?limit=${limit}&offset=${offset}`);
  return data;
}
async function toggleEnabled(id: number, enabled: boolean): Promise<Task> {
  const { data } = await api.patch<Task>(`/tasks/${id}`, { enabled });
  return data;
}
async function deleteTask(id: number): Promise<{ ok: boolean }> {
  const { data } = await api.delete(`/tasks/${id}`);
  return data as { ok: boolean };
}

export default function TasksList() {
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const qc = useQueryClient();

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<Task[], Error>({
    queryKey: ["tasks", limit, offset],
    queryFn: () => fetchTasks(limit, offset),
    placeholderData: (prev) => prev,
  });

  const mToggle = useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) => toggleEnabled(id, enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
  const mDelete = useMutation({
    mutationFn: (id: number) => deleteTask(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  if (isLoading) return <div>Loading tasks…</div>;
  if (isError) {
    const e: any = error;
    const msg = e?.response?.data?.detail || e?.response?.statusText || e?.message || "Failed to load tasks";
    return (
      <div style={{ color: "crimson" }}>
        {msg} <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  const tasks: Task[] = data ?? [];

  return (
    <div>
      <h3>Tasks</h3>
      <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "8px 0 16px" }}>
        <Link to="/tasks/new">+ Create a Task</Link>
        <span style={{ marginLeft: "auto" }}>
          Limit:&nbsp;
          <select
            value={limit}
            onChange={(e) => {
              setLimit(parseInt(e.target.value, 10));
              setOffset(0);
            }}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
          </select>
        </span>
        <button onClick={() => setOffset(Math.max(0, offset - limit))} disabled={offset === 0 || isFetching}>
          Prev
        </button>
        <button onClick={() => setOffset(offset + limit)} disabled={isFetching || tasks.length < limit}>
          Next
        </button>
        <button onClick={() => refetch()} disabled={isFetching}>
          Refresh
        </button>
      </div>

      {tasks.length === 0 ? (
        <p style={{ color: "gray" }}>
          No tasks found. Click <strong>+ Create a Task</strong> to get started.
        </p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">ID</th>
              <th align="left">URL</th>
              <th align="left">Method</th>
              <th align="left">Cron</th>
              <th align="left">Enabled</th>
              <th align="left">Created</th>
              <th align="left">Runs</th>
              <th align="left">DLQ</th>
              <th align="left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t: Task) => (
              <tr key={t.id} style={{ borderTop: "1px solid #eee" }}>
                <td>{t.id}</td>
                <td
                  style={{ maxWidth: 420, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  title={t.url}
                >
                  {t.url}
                </td>
                <td>{t.method}</td>
                <td>{t.schedule_cron ?? "-"}</td>
                <td>{t.enabled ? "Yes" : "No"}</td>
                <td>{new Date(t.created_at).toLocaleString()}</td>
                <td>
                  <Link to={`/tasks/${t.id}/runs`}>View runs</Link>
                </td>
                <td>
                  <Link to={`/tasks/${t.id}/dlq`}>DLQ</Link>
                </td>
                <td>
                  <Link to={`/tasks/${t.id}/edit`}>Edit</Link>
                  &nbsp;|&nbsp;
                  <button
                    onClick={() => mToggle.mutate({ id: t.id, enabled: !t.enabled })}
                    disabled={mToggle.isPending}
                    title="Enable/Disable"
                  >
                    {t.enabled ? "Disable" : "Enable"}
                  </button>
                  &nbsp;|&nbsp;
                  <button
                    onClick={() => {
                      if (confirm(`Delete task #${t.id}? This removes its runs and DLQ.`)) {
                        mDelete.mutate(t.id);
                      }
                    }}
                    disabled={mDelete.isPending}
                    title="Delete task"
                    style={{ color: "crimson" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
