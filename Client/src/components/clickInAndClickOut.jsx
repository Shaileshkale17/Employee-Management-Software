import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { api } from "../utils/api";

const ClickInAndClickOut = () => {
  const [status, setStatus] = useState("not_clicked_in");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [timestamps, setTimestamps] = useState({
    inTime: null,
    breakStart: null,
    breakEnd: null,
    outTime: null,
  });

  const applyRecord = useCallback((record) => {
    if (!record) {
      setStatus("not_clicked_in");
      setTimestamps({ inTime: null, breakStart: null, breakEnd: null, outTime: null });
      return;
    }
    const fmt = (value) => (value ? new Date(value).toLocaleTimeString() : null);
    if (record.checkIn && record.checkOut) setStatus("clicked_out");
    else if (record.checkHoldIn && !record.checkHoldOut) setStatus("on_break");
    else if (record.checkIn) setStatus("clicked_in");
    else setStatus("not_clicked_in");
    setTimestamps({
      inTime: fmt(record.checkIn),
      breakStart: fmt(record.checkHoldIn),
      breakEnd: fmt(record.checkHoldOut),
      outTime: fmt(record.checkOut),
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
      buttons: [{ label: "Click In", onClick: handleClickIn, className: "bg-green-500 hover:bg-green-600" }],
    },
    clicked_in: {
      buttons: [
        { label: "Take Break", onClick: handleBreak, className: "bg-amber-500 hover:bg-amber-600" },
        { label: "Click Out", onClick: handleClickOut, className: "bg-red-500 hover:bg-red-600" },
      ],
    },
    on_break: {
      buttons: [{ label: "Resume Work", onClick: handleBreak, className: "bg-blue-500 hover:bg-blue-600" }],
    },
    clicked_out: {
      message: "You have successfully clocked out for today.",
    },
  };

  const config = statusConfig[status];

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Click In / Out
      </h3>
      <div className="space-y-2 mb-4">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-2 text-xs text-gray-400">
            <svg className="animate-spin h-4 w-4 text-brand-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading...
          </div>
        ) : (
          <>
            {config?.buttons?.map((btn, i) => (
              <button
                key={i}
                onClick={btn.onClick}
                disabled={actionLoading}
                className={`w-full text-white text-sm font-medium py-2 rounded-lg transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${btn.className}`}>
                {actionLoading ? "Processing..." : btn.label}
              </button>
            ))}
            {config?.message && (
              <div className="bg-green-50 text-green-700 text-xs text-center py-2 rounded-lg border border-green-100">
                {config.message}
              </div>
            )}
          </>
        )}
      </div>
      <div className="text-xs text-gray-500 space-y-1 pt-3 border-t border-gray-100">
        <p><span className="font-medium text-gray-700">In:</span> {timestamps.inTime || "--"}</p>
        <p><span className="font-medium text-gray-700">Break Start:</span> {timestamps.breakStart || "--"}</p>
        <p><span className="font-medium text-gray-700">Break End:</span> {timestamps.breakEnd || "--"}</p>
        <p><span className="font-medium text-gray-700">Out:</span> {timestamps.outTime || "--"}</p>
      </div>
    </div>
  );
};

export default ClickInAndClickOut;
