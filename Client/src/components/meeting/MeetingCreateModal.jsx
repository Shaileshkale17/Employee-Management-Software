import { cloneElement, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Button from "../Button";
import InputBox from "../InputBox";
import SelectBox from "../SelectBox";
import TextArea from "../TextArea";
import CheckBox from "../CheckBox";
import { toISOLocal, addMinutes, timezoneName } from "../../utils/dateUtils";
import { X, Check } from "lucide-react";

const Field = ({ label, children, hint }) => {
  const canLink = typeof children === "object" && children?.props?.name;
  const child = canLink ? cloneElement(children, { id: children.props.id || `field-${(label || "control").toLowerCase().replace(/[^a-z0-9]+/g, "-")}` }) : children;
  return (
    <div className="flex flex-col items-start gap-1.5 w-full">
      <label htmlFor={canLink ? child.props.id : undefined} className="text-[13px] font-semibold text-ink-800">
        {label}
      </label>
      {child}
      {hint && <p className="text-xs text-ink-400 mt-0.5">{hint}</p>}
    </div>
  );
};

const initialForm = (defaultType) => {
  const now = new Date();
  const start = addMinutes(now, 15);
  return {
    type: defaultType || "scheduled",
    title: "",
    description: "",
    agenda: "",
    start: toISOLocal(start),
    duration: 30,
    timezone: timezoneName(),
    interviewers: [],
    candidate: "",
    guestJoinEnabled: true,
    waitingRoomEnabled: true,
    hostApprovalRequired: true,
    passwordProtected: false,
    settings: {
      waitingRoom: true,
      hostApproval: true,
      requirePassword: false,
      meetingPassword: "",
      recordMeeting: true,
      allowChat: true,
      allowScreenShare: true,
      allowParticipantsMic: true,
      allowParticipantsCamera: true,
      autoSummary: true,
    },
  };
};

const MeetingCreateModal = ({
  open,
  onClose,
  defaultType = "scheduled",
  employees = [],
  candidates = [],
  onCreated,
}) => {
  const [form, setForm] = useState(() => initialForm(defaultType));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(initialForm(defaultType));
      setErrors({});
    }
  }, [open, defaultType]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const setSetting = (key, value) =>
    setForm((prev) => ({ ...prev, settings: { ...prev.settings, [key]: value } }));

  const employeeOptions = useMemo(
    () => (employees || []).map((e) => ({ value: String(e._id), label: e.name })),
    [employees]
  );

  const candidateOptions = useMemo(
    () =>
      (candidates || []).map((c) => ({
        value: String(c._id),
        label: `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.email,
      })),
    [candidates]
  );

  const isInstant = form.type === "instant";
  const isPersonalRoom = form.type === "personal-room";

  const toggleInterviewer = (id) => {
    set(
      "interviewers",
      form.interviewers.includes(id)
        ? form.interviewers.filter((i) => i !== id)
        : [...form.interviewers, id]
    );
  };

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = "Title is required";
    if (!isInstant && !isPersonalRoom && !form.start) next.start = "Start time is required";
    if (!form.duration || Number(form.duration) < 5) next.duration = "Duration must be at least 5 minutes";
    if (form.settings.requirePassword && !form.settings.meetingPassword.trim())
      next.password = "Password is required when enabled";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildPayload = () => {
    const base = {
      title: form.title.trim(),
      description: form.description.trim(),
      agenda: form.agenda.trim(),
      timezone: form.timezone,
      type: isPersonalRoom ? "personal-room" : form.type,
      duration: Number(form.duration),
      interviewers: form.interviewers,
      candidate: form.candidate || undefined,
      guestJoinEnabled: form.guestJoinEnabled,
      waitingRoomEnabled: form.waitingRoomEnabled,
      hostApprovalRequired: form.hostApprovalRequired,
      passwordProtected: form.passwordProtected,
      settings: {
        waitingRoom: form.settings.waitingRoom,
        hostApproval: form.settings.hostApproval,
        requirePassword: form.settings.requirePassword,
        meetingPassword: form.settings.meetingPassword.trim(),
        recordMeeting: form.settings.recordMeeting,
        allowChat: form.settings.allowChat,
        allowScreenShare: form.settings.allowScreenShare,
        allowParticipantsMic: form.settings.allowParticipantsMic,
        allowParticipantsCamera: form.settings.allowParticipantsCamera,
        autoSummary: form.settings.autoSummary,
      },
    };
    if (!isInstant) base.start = form.start;
    return base;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const meeting = await onCreated(buildPayload());
      if (meeting?.joinUrl) {
        toast.success(isInstant ? "Instant meeting started" : "Meeting created");
      }
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create meeting");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-ink-200/60 animate-fade-in-up scrollbar-thin">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-200/70 bg-white/90 px-6 py-4 backdrop-blur dark:bg-ink-200/90 dark:border-ink-700/40">
          <div>
            <h2 className="text-lg font-semibold text-ink-950">New Meeting</h2>
            <p className="text-xs text-ink-400 mt-0.5">Set up an instant, scheduled, or personal room</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-400 transition-colors hover:bg-ink-100/70 hover:text-ink-700"
            aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { value: "instant", label: "Instant", icon: "⚡" },
              { value: "scheduled", label: "Schedule", icon: "📅" },
              { value: "personal-room", label: "Personal Room", icon: "🔗" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set("type", opt.value)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  form.type === opt.value
                    ? "border-brand-500 bg-brand-50 text-brand-700 shadow-sm"
                    : "border-ink-200 text-ink-500 hover:border-ink-300 hover:text-ink-800"
                }`}>
                <span className="mr-1.5">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>

          <InputBox
            label="Title"
            id="meetingTitle"
            name="title"
            placeholder="e.g. Weekly team sync"
            setInput={(v) => set("title", v)}
            getInput={form.title}
            error={errors.title}
          />

          {!isInstant && !isPersonalRoom && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputBox
                label="Start"
                id="meetingStart"
                name="start"
                type="datetime-local"
                setInput={(v) => set("start", v)}
                getInput={form.start}
                error={errors.start}
              />
              <Field label="Duration (minutes)">
                <InputBox
                  id="meetingDuration"
                  name="duration"
                  type="number"
                  min="5"
                  setInput={(v) => set("duration", v)}
                  getInput={String(form.duration)}
                  error={errors.duration}
                />
              </Field>
            </div>
          )}

          <TextArea
            label="Description"
            id="meetingDescription"
            name="description"
            placeholder="What is this meeting about?"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={2}
          />
          <TextArea
            label="Agenda"
            id="meetingAgenda"
            name="agenda"
            placeholder="Agenda items (one per line)"
            value={form.agenda}
            onChange={(e) => set("agenda", e.target.value)}
            rows={2}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Time zone">
              <SelectBox
                id="meetingTimezone"
                name="timezone"
                getInput={form.timezone}
                setInput={(v) => set("timezone", v)}
                option={[{ value: form.timezone, label: form.timezone }]}
                placeholder={form.timezone}
              />
            </Field>

            {!isPersonalRoom && (
              <Field label="Candidate (optional)" hint="Link this meeting to a candidate">
                <SelectBox
                  id="meetingCandidate"
                  name="candidate"
                  getInput={form.candidate}
                  setInput={(v) => set("candidate", v)}
                  option={candidateOptions}
                  placeholder="Select a candidate"
                />
              </Field>
            )}
          </div>

          <Field label={`Interviewers (${form.interviewers.length} selected)`} hint="Employees invited to this meeting">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-h-40 overflow-y-auto border border-ink-200/70 rounded-xl p-2 scrollbar-thin">
              {(employeeOptions.length ? employeeOptions : [{ value: "", label: "No employees found" }]).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => opt.value && toggleInterviewer(opt.value)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    opt.value && form.interviewers.includes(opt.value)
                      ? "bg-brand-50 text-brand-700"
                      : "text-ink-600 hover:bg-ink-50"
                  }`}>
                  <span className="truncate">{opt.label}</span>
                  {opt.value && (
                    <span
                      className={`ml-2 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-white ${
                        form.interviewers.includes(opt.value) ? "bg-brand-500" : "bg-ink-200"
                      }`}>
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </Field>

          <div className="space-y-2 rounded-xl border border-ink-200/70 bg-surface-100/60 p-4">
            <p className="text-[13px] font-semibold text-ink-800">Settings</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
              <CheckBox
                label="Enable guest join"
                checked={form.guestJoinEnabled}
                onChange={(e) => set("guestJoinEnabled", e.target.checked)}
              />
              <CheckBox
                label="Waiting room"
                checked={form.waitingRoomEnabled}
                onChange={(e) => set("waitingRoomEnabled", e.target.checked)}
              />
              <CheckBox
                label="Host approval required"
                checked={form.hostApprovalRequired}
                onChange={(e) => set("hostApprovalRequired", e.target.checked)}
              />
              <CheckBox
                label="Auto-record meeting"
                checked={form.settings.recordMeeting}
                onChange={(e) => setSetting("recordMeeting", e.target.checked)}
              />
              <CheckBox
                label="Allow chat"
                checked={form.settings.allowChat}
                onChange={(e) => setSetting("allowChat", e.target.checked)}
              />
              <CheckBox
                label="Allow screen sharing"
                checked={form.settings.allowScreenShare}
                onChange={(e) => setSetting("allowScreenShare", e.target.checked)}
              />
              <CheckBox
                label="Require password"
                checked={form.passwordProtected}
                onChange={(e) => set("passwordProtected", e.target.checked)}
              />
            </div>
            {form.passwordProtected && (
              <InputBox
                label="Meeting password"
                id="meetingPassword"
                name="meetingPassword"
                type="password"
                placeholder="Enter password"
                setInput={(v) => setSetting("meetingPassword", v)}
                getInput={form.settings.meetingPassword}
                error={errors.password}
              />
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-ink-200/70 pt-4">
            <Button variant="ghost" label="Cancel" onClick={onClose} disabled={saving} />
            <Button
              type="submit"
              label={isInstant ? "Start Now" : isPersonalRoom ? "Create Personal Room" : "Schedule Meeting"}
              loading={saving}
              disabled={saving}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default MeetingCreateModal;
