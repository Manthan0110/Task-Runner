import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import type { Task } from "../types";

export default function TaskEdit() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [headers, setHeaders] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const [cron, setCron] = useState<string>("");
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // 🔹 Load task details
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<Task>(`/tasks/${id}`);
        setTask(data);
        setUrl(data.url);
        setMethod(data.method);
        setCron(data.schedule_cron ?? "");
        setEnabled(data.enabled);
        // We don’t fetch decrypted headers for security → left blank
      } catch (e: any) {
        setError(e?.response?.data?.detail || e.message || "Task not found");
      }
    })();
  }, [id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      // ✅ URL validation
      if (!url || !/^https?:\/\//i.test(url)) {
        throw new Error("Please provide a valid http(s) URL");
      }

      // ✅ Headers must be valid JSON if provided
      let headersObj: Record<string, string> | undefined = undefined;
      if (headers.trim()) {
        try {
          const parsed = JSON.parse(headers);
          if (parsed && typeof parsed === "object") headersObj = parsed;
          else throw new Error("Headers must be a JSON object");
        } catch {
          throw new Error('Headers must be valid JSON, e.g. {"X-Api-Key":"abc"}');
        }
      }

      const payload: any = {
        url,
        method,
        body: body || null,
        schedule_cron: cron || null,
        enabled,
      };
      if (headersObj) payload.headers = headersObj;

      await api.patch(`/tasks/${id}`, payload);
      nav("/tasks");
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err.message ||
          "Failed to update task"
      );
    } finally {
      setBusy(false);
    }
  }

  // ✅ Not found or still loading
  if (error && !task) {
    return <div style={{ color: "crimson" }}>{error}</div>;
  }
  if (!task) return <div>Loading…</div>;

  return (
    <div>
      <h3>Edit Task #{id}</h3>
      <form onSubmit={submit} style={{ display: "grid", gap: 12, maxWidth: 700 }}>
        <label>
          URL
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            style={{ width: "100%" }}
            placeholder="https://example.com/webhook"
          />
        </label>

        <label>
          Method
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>DELETE</option>
            <option>PATCH</option>
          </select>
        </label>

        <label>
          Headers (JSON object, optional; overwrites existing encrypted headers)
          <textarea
            rows={3}
            value={headers}
            onChange={(e) => setHeaders(e.target.value)}
            placeholder='{"X-Api-Key":"secret"}'
          />
        </label>

        <label>
          Body (optional)
          <textarea
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder='{"key":"value"}'
          />
        </label>

        <label>
          Cron (optional)
          <input
            value={cron}
            onChange={(e) => setCron(e.target.value)}
            placeholder="*/5 * * * *"
          />
        </label>

        <label>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          &nbsp;Enabled
        </label>

        {error && <div style={{ color: "crimson", fontWeight: 500 }}>{error}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button disabled={busy} type="submit">
            {busy ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={() => nav("/tasks")} disabled={busy}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
