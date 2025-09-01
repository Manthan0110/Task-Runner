import { Routes, Route, Link, Navigate } from "react-router-dom";
import TasksList from "./pages/TasksList";
import TaskEdit from "./pages/TaskEdit";
import TaskRuns from "./pages/TaskRuns";
import TaskCreate from "./pages/TaskCreate";
import Analytics from "./pages/Analytics";
import Login from "./pages/Login";

function App() {
  return (
    <>
      <nav style={{ display: "flex", gap: "20px" }}>
        <Link to="/tasks">Tasks</Link>
        <Link to="/analytics">Analytics</Link>
        <Link to="/login">Login</Link>
      </nav>

      <Routes>
        {/* Redirect / → /tasks */}
        <Route path="/" element={<Navigate to="/tasks" replace />} />

        {/* Tasks list */}
        <Route path="/tasks" element={<TasksList />} />

        {/* New task */}
        <Route path="/tasks/new" element={<TaskCreate />} />

        {/* Task edit page */}
        <Route path="/tasks/:id/edit" element={<TaskEdit />} />

        {/* Task runs page */}
        <Route path="/tasks/:id/runs" element={<TaskRuns />} />

        {/* Analytics page */}
        <Route path="/analytics" element={<Analytics />} />

        {/* Login page */}
        <Route path="/login" element={<Login />} />
      </Routes>
    </>
  );
}

export default App;
