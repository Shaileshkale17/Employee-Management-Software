import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  CircleCheck,
  LoaderCircle,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  TriangleAlert,
} from "lucide-react";
import { api } from "../utils/api";
import ClickInAndClickOut from "../components/clickInAndClickOut";

const TERMINAL = "terminal";
const SCANNER = "scanner";

const SmartCheckIn = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const mode = token ? SCANNER : TERMINAL;
  const { user } = useSelector((state) => state.auth);
  const employeeName = user?.user?.name;

  const [qr, setQr] = useState(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(null);

  const [terminalLabel, setTerminalLabel] = useState("");
  const [validating, setValidating] = useState(true);
  const [invalid, setInvalid] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      setQrLoading(true);
      const res = await api.get("/attendance/qr/session");
      setQr(res.data.data);
      setSecondsLeft(res.data.data?.expiresIn ?? 90);
    } catch {
      toast.error("Failed to generate the QR session");
      setQr(null);
    } finally {
      setQrLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mode === TERMINAL) fetchSession();
  }, [mode, fetchSession]);

  useEffect(() => {
    if (mode !== TERMINAL || secondsLeft == null) return undefined;
    if (secondsLeft <= 0) {
      fetchSession();
      return undefined;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [mode, secondsLeft, fetchSession]);

  useEffect(() => {
    if (mode !== SCANNER) return undefined;
    let active = true;
    (async () => {
      try {
        const res = await api.post("/attendance/qr/validate", { token });
        if (active && res.data?.data?.valid) {
          setTerminalLabel(res.data.data.label);
        } else {
          setInvalid(true);
        }
      } catch {
        if (active) setInvalid(true);
      } finally {
        if (active) setValidating(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [mode, token]);

  const qrUrl = useMemo(() => {
    if (!qr?.token) return "";
    return `${window.location.origin}/attendance/smart-checkin?token=${encodeURIComponent(qr.token)}`;
  }, [qr]);

  const progressPct = qr?.expiresIn ? Math.max(0, Math.round((secondsLeft / qr.expiresIn) * 100)) : 0;

  const renderTerminal = () => (
    <div className="card-surface w-full max-w-sm p-6 text-center animate-scale-in sm:p-8">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-500/10 dark:bg-brand-500/10">
        <QrCode className="h-5 w-5" />
      </span>
      <h1 className="mt-4 text-lg font-bold text-ink-900">Smart Check-In</h1>
      <p className="mt-1 text-xs text-ink-400">
        Employees scan this code with their phone camera to clock in or out.
      </p>

      {qrLoading && !qr ? (
        <div className="flex items-center justify-center gap-2 py-10 text-xs text-ink-400">
          <LoaderCircle className="animate-spin h-4 w-4 text-brand-600" />
          Preparing terminal QR...
        </div>
      ) : qr ? (
        <>
          <div className="mx-auto mt-5 w-fit rounded-2xl bg-white p-3 shadow-card ring-1 ring-ink-200/60">
            <QRCodeSVG value={qrUrl} size={200} level="H" marginSize={1} fgColor="#0f172a" />
          </div>

          <span className="chip mx-auto mt-4 bg-emerald-50 text-emerald-700 ring-emerald-500/20">
            <CircleCheck className="h-3 w-3" />
            {qr.label}
          </span>

          <div className="mt-4 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-1000 ease-linear"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-[11px] font-medium tabular-nums text-ink-400">
              {secondsLeft}s
            </span>
          </div>

          <button
            type="button"
            onClick={fetchSession}
            disabled={qrLoading}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 ease-smooth hover:bg-brand-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {qrLoading ? (
              <LoaderCircle className="animate-spin h-4 w-4" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh Code
          </button>
        </>
      ) : (
        <div className="mt-6 rounded-xl bg-red-50 p-4 text-xs text-red-600 ring-1 ring-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          Could not load the QR session. Please try again.
        </div>
      )}

      <Link
        to="/attendance"
        className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-ink-400 transition-colors hover:text-brand-600"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Attendance
      </Link>
    </div>
  );

  const renderScannerLoading = () => (
    <div className="card-surface flex w-full max-w-sm items-center justify-center gap-2 p-10 text-xs text-ink-400 animate-fade-in">
      <LoaderCircle className="animate-spin h-4 w-4 text-brand-600" />
      Verifying terminal QR...
    </div>
  );

  const renderScannerInvalid = () => (
    <div className="card-surface w-full max-w-sm p-6 text-center animate-scale-in sm:p-8">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-500/10 dark:bg-red-500/10">
        <TriangleAlert className="h-5 w-5" />
      </span>
      <h1 className="mt-4 text-lg font-bold text-ink-900">Code expired</h1>
      <p className="mt-1 text-xs text-ink-400">
        This QR code is invalid or has expired. Please scan a fresh code from the
        Smart Check-In terminal.
      </p>
      <Link
        to="/attendance/smart-checkin"
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 ease-smooth hover:bg-brand-700 active:scale-[0.98]"
      >
        <Smartphone className="h-4 w-4" />
        Scan Again
      </Link>
      <Link
        to="/attendance"
        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 text-xs font-medium text-ink-400 transition-colors hover:text-brand-600"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Attendance
      </Link>
    </div>
  );

  const renderScanner = () => (
    <div className="w-full max-w-md space-y-4 animate-fade-in-up">
      <div className="card-surface flex items-center gap-3 p-4">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/10">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-ink-900">Smart Check-In</h1>
          <p className="truncate text-[11px] text-ink-400">
            {employeeName ? `${employeeName} · ` : ""}verified terminal {terminalLabel}
          </p>
        </div>
        <span className="chip ml-auto shrink-0 bg-emerald-50 text-emerald-700 ring-emerald-500/20">
          <CircleCheck className="h-3 w-3" />
          Verified
        </span>
      </div>

      <ClickInAndClickOut />
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-100 p-4">
      {mode === TERMINAL && renderTerminal()}
      {mode === SCANNER && validating && renderScannerLoading()}
      {mode === SCANNER && !validating && invalid && renderScannerInvalid()}
      {mode === SCANNER && !validating && !invalid && renderScanner()}
    </div>
  );
};

export default SmartCheckIn;
