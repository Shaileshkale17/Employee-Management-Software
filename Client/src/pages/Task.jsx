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
  { key: "todo", label: "Todo", chip: "bg-gray-100 text-gray-600" },
  { key: "inProgress", label: "In Progress", chip: "bg-blue-100 text-blue-600" },
  { key: "inReview", label: "In Review", chip: "bg-amber-100 text-amber-600" },
  { key: "done", label: "Done", chip: "bg-green-100 text-green-600" },
  { key: "total", label: "Total", chip: "bg-brand-600 text-white" },
];

const priorityChip = (priority) => {
  const map = {
    Low: "bg-gray-100 text-gray-600",
    Medium: "bg-blue-100 text-blue-600",
    High: "bg-orange-100 text-orange-600",
    Urgent: "bg-red-100 text-red-600",
  };
  return map[priority] || "bg-gray-100 text-gray-600";
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
    <div className="flex">
      {isHR ? <HRSideNavber /> : <SideNavbar />}
      <div className="flex-1 min-h-[calc(100vh-4rem)] bg-surface-100 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <Heading heading="Tasks" />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {STATS_CARDS.map((stat) => (
              <Card key={stat.key} className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats[stat.key] ?? 0}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${stat.chip}`}>
                  {stats[stat.key] ?? 0}
                </div>
              </Card>
            ))}
          </div>

          {isHR && (
            <Card>
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-gray-900">Create Task</h2>
                <p className="text-xs text-gray-400 mt-0.5">Assign a new task to an employee</p>
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
                <Button type="submit" label="Create Task" loading={creating} />
              </form>
            </Card>
          )}

          <Card className="p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Task List</h2>
                <p className="text-xs text-gray-400 mt-0.5">{tasks.length} tasks</p>
              </div>
            </div>
            {loading ? (
              <div className="divide-y divide-gray-50">
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
                title="No tasks found"
                description={isHR ? "Create a task to get started." : "Tasks assigned to you will appear here."}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      <th className="px-5 py-3 font-semibold">Task</th>
                      <th className="px-5 py-3 font-semibold">Priority</th>
                      <th className="px-5 py-3 font-semibold">Assignee</th>
                      <th className="px-5 py-3 font-semibold">Due</th>
                      <th className="px-5 py-3 font-semibold">Created</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      {isHR && <th className="px-5 py-3 font-semibold text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {tasks.map((task) => (
                      <tr key={task._id} className="hover:bg-gray-50/50">
                        <td className="px-5 py-3">
                          <div className="font-medium text-gray-900">{task.title}</div>
                          {task.description && (
                            <div className="text-xs text-gray-400 truncate max-w-[240px]">{task.description}</div>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityChip(task.priority)}`}>
                            {task.priority || "Medium"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-600">{assigneeName(task)}</td>
                        <td className="px-5 py-3 text-gray-600">{formatDate(task.dueDate)}</td>
                        <td className="px-5 py-3 text-gray-400 text-xs">{formatDate(task.createdAt)}</td>
                        <td className="px-5 py-3">
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
                          <td className="px-5 py-3 text-right">
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
      </div>
    </div>
  );
};

export default Task;
