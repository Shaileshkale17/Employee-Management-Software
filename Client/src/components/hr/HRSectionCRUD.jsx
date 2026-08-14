import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import SideNavbar from "../SideNavber";
import HRSideNavber from "../HRSideNavber";
import Card from "../Card";
import Button from "../Button";
import Heading from "../Heading";
import StatCard from "../StatCard";
import EmptyState from "../EmptyState";
import { SkeletonList } from "../Skeleton";
import SelectBox from "../SelectBox";
import { api } from "../../utils/api";
import { Search, FileText, X } from "lucide-react";

const fieldType = {
  text: "text",
  number: "number",
  date: "date",
  select: "select",
  textarea: "textarea",
  employee: "employee",
  reviewer: "reviewer",
};

const formatMoney = (value) =>
  value === undefined || value === null || value === ""
    ? "—"
    : Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 });

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const initials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

const emptyForm = (fields) =>
  fields.reduce((acc, f) => {
    acc[f.name] = f.type === "number" ? "" : "";
    return acc;
  }, {});

const toForm = (record, fields) =>
  fields.reduce((acc, f) => {
    acc[f.name] = record?.[f.name] ?? "";
    return acc;
  }, {});

const ModalField = ({ field, value, onChange, employees }) => {
  const set = (v) => onChange(field.name, v);
  const required = field.required ? { required: true } : {};
  switch (field.type) {
    case fieldType.select:
      return (
        <SelectBox
          id={`field-${field.name}`}
          name={field.name}
          label={field.label}
          getInput={value}
          setInput={set}
          option={(field.options || []).map((o) =>
            typeof o === "string" ? { value: o, label: o } : o
          )}
          placeholder={field.placeholder || `Select ${field.label}`}
        />
      );
    case fieldType.employee:
    case fieldType.reviewer:
      return (
        <SelectBox
          id={`field-${field.name}`}
          name={field.name}
          label={field.label}
          getInput={value}
          setInput={set}
          option={employees}
          placeholder={field.placeholder || `Select ${field.label}`}
        />
      );
    case fieldType.number:
      return (
        <div className="flex flex-col items-start gap-1.5 w-full">
          <label htmlFor={`field-${field.name}`} className="text-[13px] font-semibold text-ink-800">
            {field.label} {required.required ? <span className="text-red-500">*</span> : null}
          </label>
          <input
            id={`field-${field.name}`}
            type="number"
            name={field.name}
            min={field.min}
            max={field.max}
            step={field.step || "any"}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => set(e.target.value)}
            className="input-base"
            {...required}
          />
        </div>
      );
    case fieldType.textarea:
      return (
        <div className="flex flex-col items-start gap-1.5 w-full">
          <label htmlFor={`field-${field.name}`} className="text-[13px] font-semibold text-ink-800">
            {field.label} {required.required ? <span className="text-red-500">*</span> : null}
          </label>
          <textarea
            id={`field-${field.name}`}
            name={field.name}
            rows={field.rows || 2}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => set(e.target.value)}
            className="input-base resize-none"
            {...required}
          />
        </div>
      );
    default:
      return (
        <div className="flex flex-col items-start gap-1.5 w-full">
          <label htmlFor={`field-${field.name}`} className="text-[13px] font-semibold text-ink-800">
            {field.label} {required.required ? <span className="text-red-500">*</span> : null}
          </label>
          <input
            id={`field-${field.name}`}
            type={field.type === "date" ? "date" : "text"}
            name={field.name}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => set(e.target.value)}
            className="input-base"
            {...required}
          />
        </div>
      );
  }
};

const DetailLine = ({ line, record }) => {
  const { label, key: k, type = "text" } = line;
  let display = "";
  if (type === "money") display = formatMoney(record?.[k]);
  else if (type === "date") display = formatDate(record?.[k]);
  else if (type === "percent") {
    const v = Number(record?.[k]);
    display = Number.isNaN(v) ? "—" : `${Math.round(v)}%`;
  }   else if (type === "employee") {
    const emp = record?.[k];
    display = typeof emp === "object" && emp ? emp.name || emp.email || "—" : emp || "—";
  } else if (type === "rating") {
    const v = Number(record?.[k]);
    display = Number.isNaN(v) ? "—" : `${v} / 5`;
  } else {
    display = record?.[k] || "—";
  }
  return (
    <p className="text-xs text-ink-500">
      <span className="font-medium text-ink-600">{label}:</span> {display}
    </p>
  );
};

const HRSectionCRUD = ({
  title,
  subtitle,
  apiPath,
  listEndpoint,
  createEndpoint,
  updateEndpoint,
  deleteEndpoint,
  filterParam,
  filterValue,
  fixedValues = {},
  fields = [],
  stats = [],
  detailLines = [],
  statusKey = "status",
  statusColors = {},
  addLabel = "Add Record",
  emptyTitle = "No records found",
  emptyDescription = "Records will appear here once you add them.",
}) => {
  const { user } = useSelector((state) => state.auth);
  const role = user?.user?.role;
  const SideNav = (r) =>
    ["Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"].includes(r)
      ? <HRSideNavber />
      : <SideNavbar />;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(() => emptyForm(fields));
  const [saving, setSaving] = useState(false);

  const employeeOptions = useMemo(
    () => employees.map((e) => ({ value: String(e._id), label: `${e.name} (${e.role || "Employee"})` })),
    [employees]
  );

  const fetchRecords = useCallback(
    async (searchTerm = "") => {
      try {
        const params = {};
        if (filterParam && filterValue) params[filterParam] = filterValue;
        if (searchTerm.trim()) params.search = searchTerm.trim();
        const res = await api.get(`/${apiPath}/${listEndpoint}`, { params });
        setRecords(Array.isArray(res.data.data) ? res.data.data : []);
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to load records");
      } finally {
        setLoading(false);
      }
    },
    [apiPath, listEndpoint, filterParam, filterValue],
  );

  useEffect(() => {
    const timer = setTimeout(() => fetchRecords(search), 300);
    return () => clearTimeout(timer);
  }, [search, fetchRecords]);

  useEffect(() => {
    api
      .get("/emp/directory")
      .then((res) => setEmployees(Array.isArray(res.data.data) ? res.data.data : []))
      .catch(() => {});
  }, []);

  const buildPayload = () => {
    const payload = { ...fixedValues };
    fields.forEach((f) => {
      let v = form[f.name];
      if (v === "") v = undefined;
      if (f.type === "number" && v !== undefined) v = Number(v);
      payload[f.name] = v;
    });
    return payload;
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(fields));
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    setForm(toForm(record, fields));
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/${apiPath}/${updateEndpoint}/${editing._id}`, buildPayload());
        toast.success("Record updated");
      } else {
        await api.post(`/${apiPath}/${createEndpoint}`, buildPayload());
        toast.success("Record added");
      }
      setModalOpen(false);
      fetchRecords(search);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save record");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    if (!window.confirm("Delete this record?")) return;
    try {
      await api.delete(`/${apiPath}/${deleteEndpoint}/${record._id}`);
      toast.success("Record deleted");
      fetchRecords(search);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete record");
    }
  };

  const chips = (status) => (
    <span className={`chip ${statusColors[status] || statusColors.Default || "bg-ink-100 text-ink-600"}`}>
      {status || "—"}
    </span>
  );

  return (
    <div className="flex min-h-screen bg-surface-100">
      {SideNav(role)}
      <main className="flex-1 min-h-screen p-4 lg:p-8 bg-mesh-light">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-in-down">
            <Heading heading={title} subtitle={subtitle} />
            <Button label={addLabel} onClick={openCreate} className="self-start sm:self-auto" />
          </div>

          {stats.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fade-in-up">
              {stats.map((s) => (
                <StatCard key={s.label} label={s.label} value={s.get(records)} color={s.color} icon={s.icon} />
              ))}
            </div>
          )}

          <div className="relative w-full max-w-sm animate-fade-in-up">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              placeholder="Search by employee, title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-10"
            />
          </div>

          {loading ? (
            <SkeletonList rows={4} />
          ) : records.length === 0 ? (
            <Card padding={false}>
              <EmptyState
                icon={<FileText className="h-7 w-7" />}
                title={emptyTitle}
                description={emptyDescription}
                action={<Button label={addLabel} variant="secondary" size="sm" onClick={openCreate} />}
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {records.map((record) => {
                const emp = record.employee || {};
                const status = record?.[statusKey];
                return (
                  <Card key={record._id} hover className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 text-sm font-semibold ring-1 ring-brand-500/10">
                          {initials(emp.name)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-ink-900 truncate">{emp.name || "Unassigned"}</h3>
                          <p className="text-xs text-ink-500 mt-0.5 truncate">{emp.email || emp.role || ""}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {chips(status)}
                        <Button size="sm" label="Edit" variant="ghost" onClick={() => openEdit(record)} />
                        <Button size="sm" label="Delete" variant="danger" onClick={() => handleDelete(record)} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-1">
                      {detailLines.map((line) => (
                        <DetailLine key={line.key} line={line} record={record} />
                      ))}
                    </div>
                    {record.notes && <p className="text-xs text-ink-400 italic">{record.notes}</p>}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} aria-hidden="true" />
          <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-ink-200/60 animate-fade-in-up scrollbar-thin">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-200/70 bg-white/90 px-6 py-4 backdrop-blur dark:bg-ink-200/90 dark:border-ink-700/40">
              <div>
                <h2 className="text-lg font-semibold text-ink-950">
                  {editing ? "Edit record" : addLabel}
                </h2>
                <p className="text-xs text-ink-400 mt-0.5">{title}</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-400 transition-colors hover:bg-ink-100/70 hover:text-ink-700"
                aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-6 py-6">
              {fields.map((field) => (
                <div key={field.name} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                  <ModalField
                    field={field}
                    value={form[field.name]}
                    onChange={(name, value) => setForm((p) => ({ ...p, [name]: value }))}
                    employees={employeeOptions}
                  />
                </div>
              ))}
              <div className="flex items-center justify-end gap-3 border-t border-ink-200/70 pt-4 sm:col-span-2">
                <Button variant="ghost" label="Cancel" onClick={() => setModalOpen(false)} disabled={saving} />
                <Button type="submit" label={editing ? "Save changes" : "Add record"} loading={saving} disabled={saving} />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRSectionCRUD;
