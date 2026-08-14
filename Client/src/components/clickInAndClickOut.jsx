import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { api } from "../utils/api";
import { Clock, LoaderCircle, CircleCheck } from "lucide-react";

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

  const applyRecord = useCallback((record) => {
    if (!record) {
      setStatus("not_clicked_in");
      setTimestamps({ inTime: null, breakStart: null, breakEnd: null, outTime: null, breakMinutes: null, totalMinutes: null, lateMinutes: null, overtimeMinutes: null, isLate: false });
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
      badge: "bg-emerald-50 text-emerald-700 ring-emerald-500/20",
      label: "Not clocked in",
      buttons: [{ label: "Click In", onClick: handleClickIn, className: "bg-emerald-500 hover:bg-emerald-600" }],
    },
    clicked_in: {
      tone: "from-brand-500 to-brand-400",
      badge: "bg-brand-50 text-brand-700 ring-brand-500/20",
      label: "Clocked in",
      buttons: [
        { label: "Take Break", onClick: handleBreak, className: "bg-amber-500 hover:bg-amber-600" },
        { label: "Click Out", onClick: handleClickOut, className: "bg-red-500 hover:bg-red-600" },
      ],
    },
    on_break: {
      tone: "from-amber-500 to-amber-400",
      badge: "bg-amber-50 text-amber-700 ring-amber-500/20",
      label: "On break",
      buttons: [{ label: "Resume Work", onClick: handleBreak, className: "bg-brand-600 hover:bg-brand-700" }],
    },
    clicked_out: {
      tone: "from-ink-500 to-ink-400",
      badge: "bg-ink-100 text-ink-500 ring-ink-500/15",
      label: "Clocked out",
      message: "You have successfully clocked out for today.",
    },
  };

  const config = statusConfig[status];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-900 flex items-center gap-2">
          <Clock className="h-4 w-4 text-emerald-500" />
          Click In / Out
        </h3>
        {!loading && config?.label && (
          <span className={`chip ring-1 ${config.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full bg-current animate-pulse-soft`} />
            {config.label}
          </span>
        )}
      </div>

      <div className="mb-4">
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
                className={`group relative overflow-hidden w-full text-white text-sm font-semibold py-2.5 rounded-xl transition-all duration-200 ease-smooth active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${btn.className}`}>
                {actionLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <LoaderCircle className="animate-spin h-4 w-4" />
                    Processing...
                  </span>
                ) : (
                  btn.label
                )}
              </button>
            ))}
            {config?.message && (
              <div className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-medium py-2.5 rounded-xl border border-emerald-100">
                <CircleCheck className="h-4 w-4" />
                {config.message}
              </div>
            )}
          </>
        )}
      </div>

      <div className="text-xs text-ink-500 space-y-2 pt-3.5 border-t border-ink-100">
        {[
          { key: "inTime", label: "In" },
          { key: "breakStart", label: "Last Break Start" },
          { key: "breakEnd", label: "Last Break End" },
          { key: "outTime", label: "Out" },
        ].map((row) => (
          <div key={row.key} className="flex items-center justify-between">
            <span className="text-ink-400">{row.label}</span>
            <span className="font-medium text-ink-700 tabular-nums">
              {timestamps[row.key] || "--"}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between">
          <span className="text-ink-400">Break Time</span>
          <span className="font-medium text-ink-700 tabular-nums">
            {timestamps.breakMinutes != null ? fmtMinutes(timestamps.breakMinutes) : "--"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-ink-400">Work Time</span>
          <span className="font-medium text-ink-700 tabular-nums">
            {timestamps.totalMinutes != null ? fmtMinutes(timestamps.totalMinutes) : "--"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-ink-400">Late By</span>
          <span className={`font-medium tabular-nums ${timestamps.isLate ? "text-red-600" : "text-ink-700"}`}>
            {timestamps.lateMinutes != null ? fmtMinutes(timestamps.lateMinutes) : "--"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-ink-400">Overtime</span>
          <span className={`font-medium tabular-nums ${timestamps.overtimeMinutes > 0 ? "text-emerald-600" : "text-ink-700"}`}>
            {timestamps.overtimeMinutes != null ? fmtMinutes(timestamps.overtimeMinutes) : "--"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ClickInAndClickOut;
