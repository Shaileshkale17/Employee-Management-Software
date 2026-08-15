// Normalisation layer for employee data coming from the API.
// The list endpoint (emp-get) returns a `DepartmentDetails` array while the
// single-employee endpoint (emp-get-one) returns a populated `department`
// object — both shapes are handled here.

const getDepartmentName = (emp = {}) => {
  if (Array.isArray(emp.DepartmentDetails)) {
    const first = emp.DepartmentDetails[0];
    if (first?.name) return first.name;
  }
  const d = emp.department;
  if (typeof d === "string") return d;
  if (d?.name) return d.name;
  return "";
};

const getDepartmentDescription = (emp = {}) => {
  if (Array.isArray(emp.DepartmentDetails)) {
    const first = emp.DepartmentDetails[0];
    if (first?.description) return first.description;
  }
  const d = emp.department;
  if (d && typeof d === "object" && d.description) return d.description;
  return "";
};

const getDepartmentId = (emp = {}) => {
  const d = emp.department;
  if (d && typeof d === "object" && d._id) return d._id;
  if (Array.isArray(emp.DepartmentDetails)) return emp.DepartmentDetails[0]?._id || null;
  return null;
};

export const mapEmployeeSummary = (emp = {}) => ({
  id: emp._id,
  name: emp.name || "",
  email: emp.email || "",
  employeeId: emp.employeeId || "",
  designation: emp.designation || "",
  role: emp.role || "",
  department: getDepartmentName(emp),
  departmentId: getDepartmentId(emp),
  profileImg: emp.profileImg || "",
  phone: emp.phone || "",
  workLocation: emp.workLocation || "",
  address: emp.address || "",
  status: emp.status || "",
  online: Boolean(emp.online),
  presence: emp.presence || "offline",
  lastActive: emp.lastActive || null,
});

export const mapEmployeeProfile = (emp = {}) => ({
  ...mapEmployeeSummary(emp),
  departmentDescription: getDepartmentDescription(emp),
  joiningDate: emp.joiningDate || null,
  dateOfBirth: emp.dateOfBirth || null,
  skills: Array.isArray(emp.skills) ? emp.skills.filter(Boolean) : [],
  lastLoginAt: emp.lastLoginAt || null,
  createdAt: emp.createdAt || null,
});

export const getInitials = (name) => {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
};

export const presenceMeta = (presence) => {
  const map = {
    online: {
      label: "Online",
      dot: "bg-emerald-400",
      chip: "bg-emerald-50 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/25",
    },
    away: {
      label: "Away",
      dot: "bg-amber-400",
      chip: "bg-amber-50 text-amber-700 ring-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/25",
    },
    busy: {
      label: "Busy",
      dot: "bg-red-400",
      chip: "bg-red-50 text-red-700 ring-red-500/20 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/25",
    },
    idle: {
      label: "Idle",
      dot: "bg-amber-300",
      chip: "bg-amber-50 text-amber-700 ring-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/25",
    },
    offline: {
      label: "Offline",
      dot: "bg-ink-300",
      chip: "bg-ink-100 text-ink-500 ring-ink-500/10 dark:bg-white/5 dark:text-ink-400 dark:ring-ink-700/40",
    },
  };
  return map[presence] || map.offline;
};

export const statusMeta = (status) => {
  const s = String(status || "").toLowerCase();
  if (["active", "probation"].some((k) => s.includes(k)))
    return "bg-emerald-50 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/25";
  if (["on_leave", "on leave", "away", "vacation", "leave"].some((k) => s.includes(k)))
    return "bg-amber-50 text-amber-700 ring-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/25";
  if (["inactive", "terminated", "resigned", "disabled", "suspended", "retired"].some((k) => s.includes(k)))
    return "bg-ink-100 text-ink-500 ring-ink-500/10 dark:bg-white/5 dark:text-ink-400 dark:ring-ink-700/40";
  return "bg-brand-50 text-brand-700 ring-brand-500/20 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/25";
};

export const timeAgo = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const formatDisplayDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const capitalize = (value) =>
  value
    ? String(value)
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : "";
