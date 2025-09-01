import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const API_URL = "http://127.0.0.1:8000"; // backend

type Summary = {
  total_tasks: number;
  total_runs: number;
  successes: number;
  failures: number;
  success_rate: number;
  average_latency_ms: number;
};

export default function Analytics() {
  const { data, isLoading, error } = useQuery<Summary>({
    queryKey: ["analytics-summary"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/analytics/summary`);
      return res.data;
    },
  });

  if (isLoading) return <p className="p-4">Loading analytics...</p>;
  if (error) return <p className="p-4 text-red-500">Failed to load analytics</p>;
  if (!data) return null;

  const pieData = [
    { name: "Success", value: data.successes },
    { name: "Failure", value: data.failures },
  ];
  const COLORS = ["#4CAF50", "#F44336"];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Analytics Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl shadow bg-white">Total Tasks: {data.total_tasks}</div>
        <div className="p-4 rounded-xl shadow bg-white">Total Runs: {data.total_runs}</div>
        <div className="p-4 rounded-xl shadow bg-white">Success Rate: {data.success_rate}%</div>
        <div className="p-4 rounded-xl shadow bg-white">Average Latency: {data.average_latency_ms} ms</div>
      </div>

      {/* Success vs Failure Pie */}
      <div className="h-80">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              outerRadius={120}
              fill="#8884d8"
              label
            >
              {pieData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
