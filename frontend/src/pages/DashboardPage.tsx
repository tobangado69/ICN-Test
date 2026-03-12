import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMyTasks, updateTask, deleteTask } from "../api/tasks";
import { useAuth } from "../context/AuthContext";
import type { Task } from "../types/task";

export function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function loadTasks() {
    setLoading(true);
    try {
      const data = await getMyTasks();
      setTasks(data);
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to load tasks" });
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  const STATUS_NEXT: Record<Task["status"], Task["status"]> = {
    pending: "in_progress",
    in_progress: "completed",
    completed: "pending",
  };

  async function handleToggleStatus(task: Task) {
    const next = STATUS_NEXT[task.status];
    try {
      await updateTask(task.id, { status: next });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: next } : t))
      );
      setMessage({ type: "success", text: "Status updated" });
      setTimeout(() => setMessage(null), 2000);
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Failed to update",
      });
    }
  }

  async function handleDelete(task: Task) {
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    try {
      await deleteTask(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      setMessage({ type: "success", text: "Task deleted" });
      setTimeout(() => setMessage(null), 2000);
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Failed to delete",
      });
    }
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">My Tasks</h1>
          <div className="flex gap-2">
            <Link
              to="/tasks/new"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              New Task
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Logout
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`p-3 rounded mb-4 ${
              message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : tasks.length === 0 ? (
          <p className="text-gray-600">No tasks yet. Create one!</p>
        ) : (
          <ul className="space-y-3">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="bg-white rounded-lg shadow p-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{task.title}</p>
                  {task.description && (
                    <p className="text-sm text-gray-600 truncate mt-1">{task.description}</p>
                  )}
                  <span
                    className={`inline-block mt-2 px-2 py-0.5 text-xs rounded ${
                      task.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : task.status === "in_progress"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={task.status === "completed"}
                      onChange={() => handleToggleStatus(task)}
                      className="rounded"
                    />
                    <span className="text-sm">Done</span>
                  </label>
                  <Link
                    to={`/tasks/${task.id}/edit`}
                    className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(task)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
