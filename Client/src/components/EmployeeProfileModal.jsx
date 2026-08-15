import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  Activity,
  Briefcase,
  Building2,
  Check,
  Contact,
  Copy,
  Mail,
  MessageCircle,
  MoreVertical,
  RefreshCw,
  User,
  Users,
  X,
} from "lucide-react";
import EmptyState from "./EmptyState";
import { api } from "../utils/api";
import {
  capitalize,
  formatDisplayDate,
  getInitials,
  mapEmployeeProfile,
  presenceMeta,
  statusMeta,
  timeAgo,
} from "../utils/employeeMappers";

const Section = ({ title, icon, rows, skills }) => {
  const visibleRows = rows.filter((row) => row.value);
  if (visibleRows.length === 0 && (!skills || skills.length === 0)) return null;
  return (
    <section className="rounded-2xl border border-ink-200/70 bg-white p-4 shadow-card sm:p-5 dark:border-ink-700/40 dark:bg-surface-200">
      <h4 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
        <span className="text-brand-600">{icon}</span>
        {title}
      </h4>
      {visibleRows.length > 0 && (
        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3.5 sm:grid-cols-2">
          {visibleRows.map((row) => (
            <div key={row.label} className="min-w-0">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-400">{row.label}</dt>
              <dd className="mt-0.5 truncate text-sm font-medium text-ink-900">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {skills && skills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-500/20 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/25">
              {skill}
            </span>
          ))}
        </div>
      )}
    </section>
  );
};

const buildSections = (p) => {
  if (!p) return [];
  const presence = presenceMeta(p.presence);
  return [
    {
      title: "Basic Information",
      icon: <User className="h-4 w-4" />,
      rows: [
        { label: "Full name", value: p.name },
        { label: "Employee ID", value: p.employeeId },
        { label: "Job title", value: p.designation },
        { label: "Employment status", value: p.status ? capitalize(p.status) : "" },
        { label: "Date of birth", value: formatDisplayDate(p.dateOfBirth) },
        { label: "Joining date", value: formatDisplayDate(p.joiningDate) },
      ],
    },
    {
      title: "Contact Information",
      icon: <Contact className="h-4 w-4" />,
      rows: [
        { label: "Work email", value: p.email },
        { label: "Phone", value: p.phone },
        { label: "Office / Branch", value: p.workLocation },
        { label: "Address", value: p.address },
      ],
    },
    {
      title: "Organization",
      icon: <Building2 className="h-4 w-4" />,
      rows: [
        { label: "Role", value: p.role },
        { label: "Department", value: p.department },
        { label: "Department details", value: p.departmentDescription },
      ],
    },
    {
      title: "Work Information",
      icon: <Briefcase className="h-4 w-4" />,
      rows: [],
      skills: p.skills,
    },
    {
      title: "Activity & Availability",
      icon: <Activity className="h-4 w-4" />,
      rows: [
        { label: "Presence", value: presence.label },
        { label: "Last active", value: p.lastActive ? timeAgo(p.lastActive) : "" },
        { label: "Last login", value: p.lastLoginAt ? formatDisplayDate(p.lastLoginAt) : "" },
        { label: "Profile created", value: p.createdAt ? formatDisplayDate(p.createdAt) : "" },
      ],
    },
  ];
};

const EmployeeProfileModal = ({ open, employeeId, initialSummary, onClose, onChat, onViewDepartment }) => {
  const { user } = useSelector((state) => state.auth);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState("");
  const dialogRef = useRef(null);

  const fetchProfile = useCallback(async (id) => {
    setLoading(true);
    setError("");
    setProfile(null);
    setMenuOpen(false);
    setCopied("");
    try {
      const res = await api.get(`/emp/emp-get-one/${id}`);
      setProfile(mapEmployeeProfile(res.data.data));
    } catch (err) {
      setError(
        err?.response?.status === 404
          ? "This employee could not be found."
          : "Unable to load this employee's profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !employeeId) return;
    fetchProfile(employeeId);
  }, [open, employeeId, fetchProfile]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const view = profile || initialSummary || null;
  const presence = presenceMeta(view?.presence);
  const isSelf = view?.id && user?.user?.id && String(view.id) === String(user.user.id);

  const copy = async (text, key) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(""), 1500);
    } catch {
      toast.error("Unable to copy");
    }
  };

  const handleChat = () => {
    if (!view || isSelf) return;
    setMenuOpen(false);
    onChat?.(view);
  };

  const handleViewDepartment = () => {
    if (!view?.department) return;
    setMenuOpen(false);
    onViewDepartment?.(view);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm animate-fade-in dark:bg-ink-950/70"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={view ? `${view.name}'s profile` : "Employee profile"}
        tabIndex={-1}
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-modal animate-scale-in outline-none dark:border-ink-700/40 dark:bg-surface-300">
        {/* Header */}
        <div className="relative border-b border-ink-100 p-5 sm:p-6 dark:border-ink-700/40">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              {view?.profileImg ? (
                <img
                  src={view.profileImg}
                  alt={view.name}
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-ink-200 dark:ring-ink-700/60"
                />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-lg font-bold text-white ring-2 ring-ink-200 dark:ring-ink-700/60">
                  {getInitials(view?.name)}
                </span>
              )}
              {view && (
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-white ${presence.dot} dark:ring-surface-300`}
                  title={presence.label}
                  aria-label={presence.label}
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-bold text-ink-950">
                {view?.name || "Employee profile"}
              </h2>
              <p className="truncate text-sm font-medium text-brand-600">
                {view?.designation || view?.role || ""}
              </p>
              {view?.department && <p className="mt-0.5 truncate text-xs text-ink-500 dark:text-ink-400">{view.department}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {view?.employeeId && (
                  <span className="chip bg-surface-100 text-ink-600 ring-1 ring-ink-200/70 dark:bg-white/5 dark:text-ink-400 dark:ring-ink-700/40">
                    ID: {view.employeeId}
                  </span>
                )}
                {view?.status && (
                  <span className={`chip ring-1 ${statusMeta(view.status)}`}>{capitalize(view.status)}</span>
                )}
                {view && <span className={`chip ring-1 ${presence.chip}`}>{presence.label}</span>}
              </div>
            </div>
            <div className="flex flex-shrink-0 items-start gap-1">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="More actions"
                  aria-expanded={menuOpen}
                  className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-white/10 dark:hover:text-ink-950">
                  <MoreVertical className="h-5 w-5" />
                </button>
                {menuOpen && view && (
                  <div className="absolute right-0 top-11 z-30 w-56 overflow-hidden rounded-xl border border-ink-200/70 bg-white py-1.5 shadow-popover animate-fade-in-up dark:border-ink-700/40 dark:bg-surface-200">
                    {view.email && (
                      <a
                        href={`mailto:${view.email}`}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-ink-700 transition-colors hover:bg-ink-50 dark:hover:bg-white/5">
                        <Mail className="h-4 w-4 text-ink-400" />
                        Send email
                      </a>
                    )}
                    {view.email && (
                      <button
                        type="button"
                        onClick={() => copy(view.email, "email")}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-700 transition-colors hover:bg-ink-50 dark:hover:bg-white/5">
                        {copied === "email" ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-ink-400" />
                        )}
                        {copied === "email" ? "Email copied" : "Copy email"}
                      </button>
                    )}
                    {view.employeeId && (
                      <button
                        type="button"
                        onClick={() => copy(view.employeeId, "id")}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-700 transition-colors hover:bg-ink-50 dark:hover:bg-white/5">
                        {copied === "id" ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-ink-400" />
                        )}
                        {copied === "id" ? "Employee ID copied" : "Copy employee ID"}
                      </button>
                    )}
                    {view.department && (
                      <button
                        type="button"
                        onClick={handleViewDepartment}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-700 transition-colors hover:bg-ink-50 dark:hover:bg-white/5">
                        <Users className="h-4 w-4 text-ink-400" />
                        View department
                      </button>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close profile"
                className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-white/10 dark:hover:text-ink-950">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-ink-200/70 bg-white p-4 shadow-card dark:border-ink-700/40 dark:bg-surface-200">
                  <div className="skeleton h-3 w-32" />
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {[...Array(4)].map((_, j) => (
                      <div key={j}>
                        <div className="skeleton h-2.5 w-16" />
                        <div className="skeleton mt-1.5 h-3.5 w-3/4" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-ink-200/70 bg-white shadow-card dark:border-ink-700/40 dark:bg-surface-200">
              <EmptyState
                icon={<User className="h-8 w-8" />}
                title="Couldn't load profile"
                description={error}
                action={
                  <button
                    type="button"
                    className="btn-secondary btn-md"
                    onClick={() => employeeId && fetchProfile(employeeId)}>
                    <RefreshCw className="h-4 w-4" />
                    Try again
                  </button>
                }
              />
            </div>
          ) : !view ? (
            <div className="rounded-2xl border border-ink-200/70 bg-white shadow-card dark:border-ink-700/40 dark:bg-surface-200">
              <EmptyState icon={<User className="h-8 w-8" />} title="No profile available" description="No employee information could be found for this selection." />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {buildSections(view).map((section) => (
                <Section key={section.title} {...section} />
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-ink-100 p-4 sm:p-5 dark:border-ink-700/40">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn-primary btn-md" disabled={!view || isSelf} onClick={handleChat}>
              <MessageCircle className="h-4 w-4" />
              {isSelf ? "This is you" : "Message"}
            </button>
            {view?.email && (
              <a href={`mailto:${view.email}`} className="btn-secondary btn-md">
                <Mail className="h-4 w-4" />
                Email
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfileModal;
