import { useMemo, useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { api } from "../utils/api";
import {
  Activity,
  ArrowUpRight,
  Clock,
  Coffee,
  LoaderCircle,
  LogIn,
  LogOut,
  Play,
  Timer,
} from "lucide-react";

const fmtMinutes = (min) => {
  const m = Number(min) || 0;
  if (m <= 0) return "0m";
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h > 0 ? `${h}h ${r}m` : `${r}m`;
};

const ClickInAndClickOut = () => {
  const [status, setStatus] = useState("not_clicked_in");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [now, setNow] = useState(new Date());
  const [timestamps, setTimestamps] = useState({
    inTime: null,
    breakStart: null,
    breakEnd: null,
    outTime: null,
    breakMinutes: null,
    totalMinutes: null,
    lateMinutes: null,
    overtimeMinutes: null,
    isLate: false,
  });
  const [session, setSession] = useState({ checkInDate: null, breakStartDate: null });

  const applyRecord = useCallback((record) => {
    if (!record) {
      setStatus("not_clicked_in");
      setTimestamps({ inTime: null, breakStart: null, breakEnd: null, outTime: null, breakMinutes: null, totalMinutes: null, lateMinutes: null, overtimeMinutes: null, isLate: false });
      setSession({ checkInDate: null, breakStartDate: null });
      return;
    }
    const fmt = (value) => (value ? new Date(value).toLocaleTimeString() : null);
    if (record.checkIn && record.checkOut) setStatus("clicked_out");
    else if (record.checkHoldIn && !record.checkHoldOut) setStatus("on_break");
    else if (record.checkIn) setStatus("clicked_in");
    else setStatus("not_clicked_in");
    const openBreak = (record.breaks || []).find((b) => b.start && !b.end);
    const lastBreak = [...(record.breaks || [])].reverse().find((b) => b.start && b.end);
    setTimestamps({
      inTime: fmt(record.checkIn),
      breakStart: fmt(openBreak?.start || lastBreak?.start),
      breakEnd: fmt(openBreak?.end || lastBreak?.end),
      outTime: fmt(record.checkOut),
      breakMinutes: record.breakMinutes ?? null,
      totalMinutes: record.totalMinutes ?? null,
      lateMinutes: record.lateMinutes ?? null,
      overtimeMinutes: record.overtimeMinutes ?? null,
      isLate: Boolean(record.isLate),
    });
    setSession({
      checkInDate: record.checkIn ? new Date(record.checkIn) : null,
      breakStartDate: openBreak?.start ? new Date(openBreak.start) : null,
    });
  }, []);

  useEffect(() => {
    let active = true;
    api
      .get("/attendance/today")
      .then((res) => {
        if (active) applyRecord(res.data.data);
      })
      .catch(() => {
        if (active) toast.error("Failed to load today's attendance");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applyRecord]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const liveWorkMinutes = useMemo(() => {
    if (!session.checkInDate) return null;
    let ms = now - session.checkInDate;
    ms -= (timestamps.breakMinutes ?? 0) * 60000;
    if (session.breakStartDate) ms -= now - session.breakStartDate;
    return Math.max(0, Math.round(ms / 60000));
  }, [now, session, timestamps.breakMinutes]);

  const runAction = async (endpoint, successMsg) => {
    try {
      setActionLoading(true);
      const res = await api.post(endpoint);
      applyRecord(res.data.data);
      toast.success(successMsg || res.data.message || "Success");
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Action failed");
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleClickIn = () => runAction("/attendance/clock-in", "Clocked in successfully");
  const handleBreak = () =>
    runAction("/attendance/break", status === "on_break" ? "Resumed work" : "Break started");
  const handleClickOut = () => runAction("/attendance/clock-out", "Clocked out successfully");

  const statusConfig = {
    not_clicked_in: {
      tone: "from-emerald-500 to-emerald-400",
      ring: "ring-emerald-500/25",
      badge: "bg-emerald-50 text-emerald-700 ring-emerald-500/20",
      panelText: "text-emerald-600",
      label: "Not clocked in",
      headline: "Ready when you are",
      buttons: [
        { label: "Click In", onClick: handleClickIn, className: "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25" },
      ],
    },
    clicked_in: {
      tone: "from-brand-500 to-brand-400",
      ring: "ring-brand-500/25",
      badge: "bg-brand-50 text-brand-700 ring-brand-500/20",
      panelText: "text-brand-600",
      label: "Clocked in",
      headline: "Making good progress",
      buttons: [
        { label: "Take Break", onClick: handleBreak, className: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/25" },
        { label: "Click Out", onClick: handleClickOut, className: "bg-red-500 hover:bg-red-600 shadow-red-500/25" },
      ],
    },
    on_break: {
      tone: "from-amber-500 to-amber-400",
      ring: "ring-amber-500/25",
      badge: "bg-amber-50 text-amber-700 ring-amber-500/20",
      panelText: "text-amber-600",
      label: "On break",
      headline: "Enjoy your break",
      buttons: [{ label: "Resume Work", onClick: handleBreak, className: "bg-brand-600 hover:bg-brand-700 shadow-brand-600/25" }],
    },
    clicked_out: {
      tone: "from-ink-500 to-ink-400",
      ring: "ring-ink-500/20",
      badge: "bg-ink-100 text-ink-500 ring-ink-500/15",
      panelText: "text-ink-500",
      label: "Clocked out",
      headline: "Day complete",
      message: "You have successfully clocked out for today.",
    },
  };

  const config = statusConfig[status];

  const buttonIcons = {
    "Click In": <LogIn className="h-4 w-4" />,
    "Take Break": <Coffee className="h-4 w-4" />,
    "Resume Work": <Play className="h-4 w-4" />,
    "Click Out": <LogOut className="h-4 w-4" />,
  };

  const workTimeValue =
    timestamps.totalMinutes != null
      ? fmtMinutes(timestamps.totalMinutes)
      : liveWorkMinutes != null
        ? fmtMinutes(liveWorkMinutes)
        : "--";

  const stats = [
    {
      label: "Clock In",
      value: timestamps.inTime || "--",
      icon: <LogIn className="h-3.5 w-3.5" />,
      tile: "bg-emerald-50 text-emerald-600 ring-emerald-500/10",
    },
    {
      label: "Clock Out",
      value: timestamps.outTime || "--",
      icon: <LogOut className="h-3.5 w-3.5" />,
      tile: "bg-ink-100 text-ink-500 ring-ink-500/10",
    },
    {
      label: "Break",
      value: timestamps.breakMinutes != null ? fmtMinutes(timestamps.breakMinutes) : "--",
      icon: <Coffee className="h-3.5 w-3.5" />,
      tile: "bg-amber-50 text-amber-600 ring-amber-500/10",
    },
    {
      label: "Work Time",
      value: workTimeValue,
      icon: <Activity className="h-3.5 w-3.5" />,
      tile: "bg-brand-50 text-brand-600 ring-brand-500/10",
    },
    {
      label: "Late By",
      value: timestamps.lateMinutes != null ? fmtMinutes(timestamps.lateMinutes) : "--",
      icon: <Timer className="h-3.5 w-3.5" />,
      tile: timestamps.isLate ? "bg-red-50 text-red-600 ring-red-500/10" : "bg-ink-100 text-ink-500 ring-ink-500/10",
    },
    {
      label: "Overtime",
      value: timestamps.overtimeMinutes != null ? fmtMinutes(timestamps.overtimeMinutes) : "--",
      icon: <ArrowUpRight className="h-3.5 w-3.5" />,
      tile: timestamps.overtimeMinutes > 0 ? "bg-emerald-50 text-emerald-600 ring-emerald-500/10" : "bg-ink-100 text-ink-500 ring-ink-500/10",
    },
  ];

  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/10 ${config.panelText}`}>
            <Clock className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-ink-900">Attendance</h3>
            <p className="text-[11px] text-ink-400">Click in &amp; out to track your day</p>
          </div>
        </div>
        {!loading && config?.label && (
          <span className={`chip ring-1 ${config.badge}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-soft" />
            {config.label}
          </span>
        )}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-ink-200/60 bg-surface-50/70 p-4 dark:bg-ink-900/60">
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${config.tone}`} aria-hidden="true" />
        <div className="flex items-end justify-between gap-3 pt-2">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-widest text-ink-400">
              Current time
            </p>
            <p className="mt-1 text-3xl font-bold leading-none tracking-tight tabular-nums text-ink-950">
              {timeStr}
            </p>
            <p className="mt-1.5 truncate text-xs text-ink-500">{dateStr}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className={`chip ring-1 ${config.badge}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-soft" />
              {config?.label}
            </span>
            <span className="text-[11px] font-medium text-ink-400">{config?.headline}</span>
          </div>
        </div>
      </div>

      <div className="mb-5 mt-4">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-3 text-xs text-ink-400">
            <LoaderCircle className="animate-spin h-4 w-4 text-brand-600" />
            Loading...
          </div>
        ) : (
          <>
            {config?.buttons?.map((btn, i) => (
              <button
                key={i}
                onClick={btn.onClick}
                disabled={actionLoading}
                className={`group relative mb-2.5 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl text-sm font-semibold text-white py-3 shadow-sm transition-all duration-200 ease-smooth active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed last:mb-0 ${btn.className}`}>
                {actionLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <LoaderCircle className="animate-spin h-4 w-4" />
                    Processing...
                  </span>
                ) : (
                  <>
                    {buttonIcons[btn.label]}
                    {btn.label}
                  </>
                )}
              </button>
            ))}
            {config?.message && (
              <div className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-medium py-3 rounded-xl border border-emerald-100">
                <Clock className="h-4 w-4" />
                {config.message}
              </div>
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-ink-100">
        {stats.map((stat) => (
          <div key={stat.label} className="panel-inner flex items-center gap-2.5 p-2.5">
            <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ring-1 ${stat.tile}`}>
              {stat.icon}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-medium uppercase tracking-wider text-ink-400">
                {stat.label}
              </p>
              <p className="truncate text-[13px] font-semibold text-ink-800 tabular-nums">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClickInAndClickOut;
