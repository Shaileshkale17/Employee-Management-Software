import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { api } from "../utils/api";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import Button from "../components/Button";
import Card from "../components/Card";
import Heading from "../components/Heading";
import InputBox from "../components/InputBox";
import SelectBox from "../components/SelectBox";
import TextArea from "../components/TextArea";
import EmptyState from "../components/EmptyState";
import { SquareCheck } from "lucide-react";

const HR_ROLES = ["Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"];

const STATUS_OPTIONS = [
  { value: "Todo", label: "Todo" },
  { value: "In Progress", label: "In Progress" },
  { value: "In Review", label: "In Review" },
  { value: "Done", label: "Done" },
];

const PRIORITY_OPTIONS = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Urgent", label: "Urgent" },
];

const STATS_CARDS = [
  { key: "todo", label: "Todo", chip: "bg-ink-100 text-ink-600" },
  { key: "inProgress", label: "In Progress", chip: "bg-purple-50 text-purple-600" },
  { key: "inReview", label: "In Review", chip: "bg-amber-50 text-amber-600" },
  { key: "done", label: "Done", chip: "bg-emerald-50 text-emerald-600" },
  { key: "total", label: "Total", chip: "bg-brand-600 text-white shadow-glow-sm" },
];

const priorityChip = (priority) => {
  const map = {
    Low: "bg-ink-50 text-ink-600 ring-1 ring-ink-500/20",
    Medium: "bg-purple-50 text-purple-600 ring-1 ring-purple-500/20",
    High: "bg-orange-50 text-orange-600 ring-1 ring-orange-500/20",
    Urgent: "bg-red-50 text-red-600 ring-1 ring-red-500/20",
  };
  return map[priority] || "bg-ink-50 text-ink-600 ring-1 ring-ink-500/20";
};

const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : "-");

const Task = () => {
  const { user } = useSelector((state) => state.auth);
  const role = user?.user?.role;
  const isHR = HR_ROLES.includes(role);

  const [stats, setStats] = useState({ todo: 0, inProgress: 0, inReview: 0, done: 0, total: 0 });
  const [tasks, setTasks] = useState([]);
  const [directory, setDirectory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [form, setForm] = useState({ title: "", description: "", assignee: "", priority: "Medium", dueDate: "" });

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/task/stats");
      setStats(res.data.data || {});
    } catch {
      toast.error("Failed to load task stats");
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await api.get(isHR ? "/task/" : "/task/my");
      setTasks(res.data.data?.data || []);
    } catch {
      toast.error("Failed to load tasks");
    }
  }, [isHR]);

  const fetchDirectory = useCallback(async () => {
    try {
      const res = await api.get("/emp/directory");
      setDirectory(Array.isArray(res.data.data) ? res.data.data : []);
    } catch {
      toast.error("Failed to load employee directory");
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([fetchStats(), fetchTasks()]);
  }, [fetchStats, fetchTasks]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchTasks(), ...(isHR ? [fetchDirectory()] : [])]);
    setLoading(false);
  }, [fetchStats, fetchTasks, fetchDirectory, isHR]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const directoryOptions = directory
    .filter((emp) => emp?._id && emp?.name)
    .map((emp) => ({ value: emp._id, label: emp.name }));

  const assigneeName = (task) => {
    if (task.assignee?.name) return task.assignee.name;
    if (!isHR && user?.user?.name) return user.user.name;
    return "Unassigned";
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setCreating(true);
    try {
      await api.post("/task/", {
        title: form.title.trim(),
        description: form.description,
        assignee: form.assignee || undefined,
        priority: form.priority,
        dueDate: form.dueDate || undefined,
      });
      toast.success("Task created successfully");
      setForm({ title: "", description: "", assignee: "", priority: "Medium", dueDate: "" });
      await refresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (task, status) => {
    if (status === task.status) return;
    setUpdatingId(task._id);
    try {
      await api.put(`/task/${task._id}`, { status });
      toast.success("Task status updated");
      await refresh();
    } catch {
      toast.error("Failed to update task status");
    } finally {
      setUpdatingId("");
    }
  };

  const handleDelete = async (task) => {
    setDeletingId(task._id);
    try {
      await api.delete(`/task/${task._id}`);
      toast.success("Task deleted");
      await refresh();
    } catch {
      toast.error("Failed to delete task");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="flex min-h-screen bg-surface-100">
      {isHR ? <HRSideNavber /> : <SideNavbar />}
      <main className="flex-1 min-h-screen p-4 lg:p-8 bg-mesh-light">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="animate-fade-in-down">
            <Heading heading="Tasks" subtitle="Create, track and manage tasks across your team." />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-fade-in-up">
            {STATS_CARDS.map((stat) => (
              <Card key={stat.key} hover className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-ink-950 tabular-nums">{stats[stat.key] ?? 0}</div>
                  <div className="text-xs text-ink-400 mt-0.5">{stat.label}</div>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${stat.chip}`}>
                  {stats[stat.key] ?? 0}
                </div>
              </Card>
            ))}
          </div>

          {isHR && (
            <Card className="animate-fade-in-up">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-ink-950">Create Task</h2>
                <p className="text-xs text-ink-400 mt-0.5">Assign a new task to an employee</p>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputBox
                    id="title"
                    name="title"
                    label="Title"
                    placeholder="Task title"
                    getInput={form.title}
                    setInput={(v) => setForm((p) => ({ ...p, title: v }))}
                  />
                  <SelectBox
                    id="assignee"
                    name="assignee"
                    label="Assignee"
                    getInput={form.assignee}
                    setInput={(v) => setForm((p) => ({ ...p, assignee: v }))}
                    option={directoryOptions}
                  />
                  <SelectBox
                    id="priority"
                    name="priority"
                    label="Priority"
                    getInput={form.priority}
                    setInput={(v) => setForm((p) => ({ ...p, priority: v }))}
                    option={PRIORITY_OPTIONS}
                  />
                  <InputBox
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    label="Due Date"
                    getInput={form.dueDate}
                    setInput={(v) => setForm((p) => ({ ...p, dueDate: v }))}
                  />
                </div>
                <TextArea
                  id="description"
                  name="description"
                  label="Description"
                  placeholder="Task description"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button type="submit" label="Create Task" loading={creating} />
                </div>
              </form>
            </Card>
          )}

          <Card className="p-0 overflow-hidden animate-fade-in-up">
            <div className="px-5 sm:px-6 py-4 border-b border-ink-200/60 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-ink-950">Task List</h2>
                <p className="text-xs text-ink-400 mt-0.5">{tasks.length} tasks</p>
              </div>
            </div>
            {loading ? (
              <div className="divide-y divide-ink-100">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-6 p-5">
                    <div className="skeleton h-4 w-40" />
                    <div className="skeleton h-6 w-20 rounded-full" />
                    <div className="skeleton h-4 w-24" />
                    <div className="skeleton h-4 w-20" />
                    <div className="skeleton h-4 w-20" />
                    <div className="skeleton h-9 w-44 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <EmptyState
                icon={<SquareCheck className="h-7 w-7" />}
                title="No tasks found"
                description={isHR ? "Create a task to get started." : "Tasks assigned to you will appear here."}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink-200/60 bg-surface-100/70">
                      <th className="table-th">Task</th>
                      <th className="table-th">Priority</th>
                      <th className="table-th">Assignee</th>
                      <th className="table-th">Due</th>
                      <th className="table-th">Created</th>
                      <th className="table-th">Status</th>
                      {isHR && <th className="table-th text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task._id} className="border-b border-ink-100 last:border-0 hover:bg-surface-50/60 transition-colors">
                        <td className="table-td">
                          <div className="font-medium text-ink-900">{task.title}</div>
                          {task.description && (
                            <div className="text-xs text-ink-400 truncate max-w-[240px]">{task.description}</div>
                          )}
                        </td>
                        <td className="table-td">
                          <span className={`chip ${priorityChip(task.priority)}`}>
                            {task.priority || "Medium"}
                          </span>
                        </td>
                        <td className="table-td text-ink-600">{assigneeName(task)}</td>
                        <td className="table-td text-ink-600">{formatDate(task.dueDate)}</td>
                        <td className="table-td text-ink-400 text-xs">{formatDate(task.createdAt)}</td>
                        <td className="table-td">
                          <div className={updatingId === task._id ? "w-44 opacity-50 pointer-events-none" : "w-44"}>
                            <SelectBox
                              name="status"
                              getInput={task.status}
                              setInput={(v) => handleStatusChange(task, v)}
                              option={STATUS_OPTIONS}
                            />
                          </div>
                        </td>
                        {isHR && (
                          <td className="table-td text-right">
                            <Button
                              variant="danger"
                              size="sm"
                              label="Delete"
                              loading={deletingId === task._id}
                              onClick={() => handleDelete(task)}
                            />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Task;
