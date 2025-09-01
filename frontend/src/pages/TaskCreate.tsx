import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function TaskCreate() {
  const nav = useNavigate();
  const [url, setUrl] = useState("http://127.0.0.1:8000/ping");
  const [method, setMethod] = useState("GET");
  const [headers, setHeaders] = useState<string>(""); // JSON text
  const [body, setBody] = useState<string>("");
  const [cron, setCron] = useState<string>("*/1 * * * *");
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      // ✅ URL validation
      if (!url || !/^https?:\/\//i.test(url)) {
        throw new Error("Please provide a valid http(s) URL");
      }

      // ✅ Headers must be valid JSON
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

      const payload = {
        url,
        method,
        headers: headersObj,
        body: body || null,
        schedule_cron: cron || null,
        enabled,
      };

      // ✅ API call
      await api.post("/tasks/", payload);

      // On success → go back to list
      nav("/tasks");
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Unexpected error while creating task";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h3>Create Task</h3>
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
          Headers (JSON object, optional)
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

        {error && (
          <div style={{ color: "crimson", fontWeight: 500 }}>{error}</div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button disabled={busy} type="submit">
            {busy ? "Creating…" : "Create Task"}
          </button>
          <button type="button" onClick={() => nav("/tasks")} disabled={busy}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
