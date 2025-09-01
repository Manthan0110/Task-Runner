import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "../api";
import type { Run } from "../types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

async function fetchRuns(taskId: string, limit: number, offset: number): Promise<Run[]> {
  const { data } = await api.get<Run[]>(`/tasks/${taskId}/runs?limit=${limit}&offset=${offset}`);
  return data;
}

export default function TaskRuns() {
  const { id } = useParams<{ id: string }>();
  const [limit, setLimit] = useState(100);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "failure">("all");

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["runs", id, limit, offset],
    queryFn: () => fetchRuns(id!, limit, offset),
    enabled: !!id,
    placeholderData: (prev) => prev,
  });

  const runs = (data ?? []).filter((r: Run) => statusFilter === "all" ? true : r.status === statusFilter);

  const histogram = useMemo(() => {
    // bucket latencies into 200ms bins
    const buckets = new Map<number, number>();
    for (const r of runs) {
      const bucket = Math.floor((r.latency_ms || 0) / 200) * 200; // 0,200,400...
      buckets.set(bucket, (buckets.get(bucket) || 0) + 1);
    }
    return Array.from(buckets.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([bucket, count]) => ({ bucket: `${bucket}-${bucket + 199}ms`, count }));
  }, [runs]);

  if (!id) return <div>Missing task id.</div>;
  if (isLoading) return <div>Loading runs…</div>;
  if (isError) {
    const msg =
      (error as any)?.response?.data?.detail ||
      (error as any)?.message ||
      "Failed to load runs";
    return <div style={{ color: "crimson" }}>{msg} <button onClick={() => refetch()}>Retry</button></div>;
  }

  return (
    <div>
      <h3>Runs for Task #{id}</h3>
      <p><Link to="/tasks">← Back to tasks</Link></p>

      {/* controls */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <label>
          Status:&nbsp;
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
            <option value="all">All</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>
        </label>
        <label>
          Limit:&nbsp;
          <select value={limit} onChange={e => { setLimit(parseInt(e.target.value, 10)); setOffset(0); }}>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
          </select>
        </label>
        <button onClick={() => setOffset(Math.max(0, offset - limit))} disabled={offset === 0 || isFetching}>Prev</button>
        <button onClick={() => setOffset(offset + limit)} disabled={isFetching}>Next</button>
        <button onClick={() => refetch()} disabled={isFetching}>Refresh</button>
      </div>

      {/* chart */}
      <div style={{ height: 260, background: "#fafafa", border: "1px solid #eee", borderRadius: 8, padding: 8, marginBottom: 16 }}>
        <strong>Latency histogram</strong>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={histogram}>
            <XAxis dataKey="bucket" hide={histogram.length > 20} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* table */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left">When</th>
            <th align="left">Status</th>
            <th align="left">Code</th>
            <th align="left">Latency (ms)</th>
            <th align="left">Class</th>
            <th align="left">Explanation</th>
            <th align="left">Error Snippet</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r: Run) => (
            <tr key={r.id} style={{ borderTop: "1px solid #eee" }}>
              <td>{new Date(r.created_at).toLocaleString()}</td>
              <td style={{ color: r.status === "success" ? "green" : "crimson" }}>{r.status}</td>
              <td>{r.response_code ?? "-"}</td>
              <td>{r.latency_ms}</td>
              <td>{r.failure_class ?? "-"}</td>
              <td style={{ maxWidth: 340 }}>{r.failure_explanation ?? "-"}</td>
              <td style={{ maxWidth: 340, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.error ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {runs.length === 0 && <p>No runs for this page/filter.</p>}
    </div>
  );
}
