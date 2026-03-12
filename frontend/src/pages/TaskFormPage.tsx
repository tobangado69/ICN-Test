import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createTask, updateTask, getMyTasks } from "../api/tasks";
import type { TaskStatus } from "../types/task";

const STATUSES: TaskStatus[] = ["pending", "in_progress", "completed"];

export function TaskFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("pending");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingTask, setLoadingTask] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    async function load() {
      try {
        const tasks = await getMyTasks();
        const task = tasks.find((t) => t.id === Number(id));
        if (task) {
          setTitle(task.title);
          setDescription(task.description ?? "");
          setStatus(task.status);
        } else {
          setError("Task not found");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load task");
      } finally {
        setLoadingTask(false);
      }
    }
    load();
  }, [id, isEdit]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isEdit) {
        await updateTask(Number(id), {
          title: title.trim() || undefined,
          description: description.trim() || undefined,
          status,
        });
      } else {
        await createTask({
          title: title.trim(),
          description: description.trim() || undefined,
          status,
        });
      }
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  if (loadingTask) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-semibold mb-4">
          {isEdit ? "Edit Task" : "New Task"}
        </h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
          {error && (
            <div className="p-2 bg-red-100 text-red-700 rounded text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
