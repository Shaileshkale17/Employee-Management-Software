import { cloneElement, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { Upload, X } from "lucide-react";
import Button from "../Button";
import InputBox from "../InputBox";
import SelectBox from "../SelectBox";
import TextArea from "../TextArea";
import CheckBox from "../CheckBox";
import { createEvent, updateEvent, addAttachments } from "../../redux/slices/calendarSlice";
import {
  EVENT_TYPES,
  PRIORITIES,
  EVENT_STATUSES,
  CATEGORY_PRESETS,
  RECURRENCE_FREQUENCIES,
  WEEKDAY_OPTIONS,
  REMINDER_OPTIONS,
  VISIBILITY_OPTIONS,
} from "./calendarMeta";
import { toISOLocal, fromISOLocal, toAPIDate, timezoneName } from "../../utils/dateUtils";

const Field = ({ label, children, hint }) => {
  const id = `field-${(label || "control").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const canLink = typeof children === "object" && children?.props?.name;
  const child = canLink ? cloneElement(children, { id: children.props.id || id }) : children;
  return (
    <div className="flex flex-col items-start gap-1.5 w-full">
      <label htmlFor={canLink ? id : undefined} className="text-[13px] font-semibold text-ink-800">
        {label}
      </label>
      {child}
      {hint && <p className="text-xs text-ink-400 mt-0.5">{hint}</p>}
    </div>
  );
};

const initialForm = (event, defaultStart, defaultEnd) => {
  const now = new Date();
  const start = event?.start ? new Date(event.start) : defaultStart || new Date(now);
  const end = event?.end ? new Date(event.end) : defaultEnd || new Date(start.getTime() + 60 * 60000);
  const recurrence = event?.recurrence || {
    enabled: false,
    frequency: "none",
    interval: 1,
    daysOfWeek: [],
    dayOfMonth: null,
    endDate: null,
    count: null,
  };
  return {
    title: event?.title || "",
    description: event?.description || "",
    allDay: Boolean(event?.allDay),
    start: toISOLocal(start),
    end: toISOLocal(end),
    timezone: event?.timezone || timezoneName(),
    type: event?.type || "meeting",
    priority: event?.priority || "Medium",
    status: event?.status || "Scheduled",
    categoryName: event?.category?.name || "General",
    categoryColor: event?.category?.color || "#7C3AED",
    location: event?.location || "",
    meetingLink: event?.meetingLink || event?.link || "",
    tags: (event?.tags || []).join(", "),
    notes: event?.notes || "",
    agenda: event?.agenda || "",
    visibility: event?.visibility || "private",
    participants: (event?.participants || []).map((p) => (typeof p === "string" ? p : p?._id || "")).filter(Boolean),
    recurrenceEnabled: Boolean(recurrence.enabled),
    recurrenceFrequency: recurrence.frequency || "none",
    recurrenceInterval: recurrence.interval || 1,
    recurrenceDays: recurrence.daysOfWeek || [],
    recurrenceDayOfMonth: recurrence.dayOfMonth || 1,
    recurrenceEndDate: recurrence.endDate ? toISOLocal(recurrence.endDate).slice(0, 10) : "",
    recurrenceCount: recurrence.count || "",
    reminderOptions: (event?.reminders || []).map((r) => String(r.minutesBefore)),
  };
};

const EventModal = ({ open, onClose, event, defaultStart, defaultEnd, occurrenceStart, employees = [], onSaved }) => {
  const dispatch = useDispatch();
  const isEdit = Boolean(event);

  const [form, setForm] = useState(() => initialForm(event, defaultStart, defaultEnd));
  const [saving, setSaving] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(initialForm(event, defaultStart, defaultEnd));
      setErrors({});
      setFiles([]);
    }
  }, [open, event, defaultStart, defaultEnd]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const employeeOptions = useMemo(
    () =>
      (employees || []).map((e) => ({
        value: String(e._id),
        label: e.name,
      })),
    [employees]
  );

  const selectedParticipants = useMemo(() => {
    const map = {};
    (employees || []).forEach((e) => {
      map[String(e._id)] = e;
    });
    return form.participants.map((id) => map[id] || { _id: id, name: id });
  }, [employees, form.participants]);

  const toggleParticipant = (id) => {
    set("participants", form.participants.includes(id) ? form.participants.filter((p) => p !== id) : [...form.participants, id]);
  };

  const toggleWeekday = (day) => {
    set("recurrenceDays", form.recurrenceDays.includes(day) ? form.recurrenceDays.filter((d) => d !== day) : [...form.recurrenceDays, day]);
  };

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = "Title is required";
    if (!form.start) next.start = "Start time is required";
    const startMs = form.start ? fromISOLocal(form.start)?.getTime() : null;
    const endMs = form.end ? fromISOLocal(form.end)?.getTime() : null;
    if (!startMs) next.start = next.start || "Start time is required";
    if (!endMs) next.end = "End time is required";
    if (startMs && endMs && endMs < startMs) next.end = "End time cannot be before start time";
    if (form.meetingLink) {
      try {
        const u = new URL(form.meetingLink);
        if (!/^https?:$/.test(u.protocol)) throw new Error("http(s) only");
      } catch {
        next.meetingLink = "Must be a valid http(s) URL";
      }
    }
    if (form.recurrenceEnabled && form.recurrenceFrequency !== "none") {
      if (form.recurrenceFrequency === "custom" && form.recurrenceDays.length === 0) {
        next.recurrenceDays = "Pick at least one day";
      }
      if (form.recurrenceEndDate) {
        const end = fromISOLocal(`${form.recurrenceEndDate}T23:59:59`);
        if (end && startMs && end.getTime() < startMs) next.recurrenceEndDate = "End date must be after event start";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildPayload = () => {
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      allDay: form.allDay,
      start: toAPIDate(fromISOLocal(form.start)),
      end: toAPIDate(fromISOLocal(form.end)),
      timezone: form.timezone,
      type: form.type,
      priority: form.priority,
      status: form.status,
      category: { name: form.categoryName, color: form.categoryColor },
      location: form.location.trim(),
      meetingLink: form.meetingLink.trim(),
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      notes: form.notes.trim(),
      agenda: form.agenda.trim(),
      visibility: form.visibility,
      participants: form.participants,
    };
    if (form.recurrenceEnabled && form.recurrenceFrequency !== "none") {
      payload.recurrence = {
        enabled: true,
        frequency: form.recurrenceFrequency,
        interval: Number(form.recurrenceInterval) || 1,
        daysOfWeek: form.recurrenceFrequency === "custom" || form.recurrenceFrequency === "weekly" ? form.recurrenceDays : [],
        dayOfMonth: form.recurrenceFrequency === "monthly" ? Number(form.recurrenceDayOfMonth) || 1 : null,
        endDate: form.recurrenceEndDate ? toAPIDate(fromISOLocal(`${form.recurrenceEndDate}T23:59:59`)) : null,
        count: form.recurrenceCount ? Number(form.recurrenceCount) : null,
      };
    } else {
      payload.recurrence = { enabled: false, frequency: "none", interval: 1, daysOfWeek: [], dayOfMonth: null, endDate: null, count: null };
    }
    const reminders = form.reminderOptions
      .map((r) => Number(r))
      .filter((n) => Number.isFinite(n) && n >= 0)
      .sort((a, b) => b - a);
    payload.reminders = reminders.map((minutesBefore) => ({ minutesBefore }));
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit) {
        await dispatch(updateEvent(event._id, buildPayload(), occurrenceStart));
      } else {
        await dispatch(createEvent(buildPayload()));
      }
      if (files.length > 0 && isEdit) {
        setAttaching(true);
        try {
          await dispatch(addAttachments(event._id, files));
        } catch {
          toast.error("Event saved but attachments failed to upload");
        }
        setAttaching(false);
      }
      toast.success(isEdit ? "Event updated" : "Event created");
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-modal animate-scale-in scrollbar-thin">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-ink-200/70 bg-white/95 px-6 py-4 backdrop-blur-sm dark:bg-ink-200/95 dark:border-ink-700/40">
          <div>
            <h2 className="text-base font-bold text-ink-950">{isEdit ? "Edit event" : "Create event"}</h2>
            <p className="text-xs text-ink-500 mt-0.5">
              {isEdit && occurrenceStart ? "Editing a single occurrence — other dates stay unchanged." : isEdit ? "Changes apply to the whole series." : "Schedule meetings, reminders, tasks and more."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <Field label="Title">
            <InputBox
              name="title"
              placeholder="e.g. Sprint planning"
              getInput={form.title}
              setInput={(v) => set("title", v)}
              error={errors.title}
              className="!gap-0"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Type">
              <SelectBox name="type" getInput={form.type} setInput={(v) => set("type", v)} option={EVENT_TYPES} />
            </Field>
            <Field label="Category">
              <div className="flex gap-2 w-full">
                <div className="flex flex-wrap items-center gap-1.5">
                  {CATEGORY_PRESETS.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => set("categoryColor", c.color)}
                      style={{ backgroundColor: c.color }}
                      className={`h-7 w-7 rounded-lg transition-transform hover:scale-110 ${form.categoryColor === c.color ? "ring-2 ring-ink-900 ring-offset-2" : ""}`}
                      title={c.name}
                      aria-label={c.name}
                    />
                  ))}
                </div>
                <InputBox
                  name="categoryName"
                  placeholder="Category name"
                  getInput={form.categoryName}
                  setInput={(v) => set("categoryName", v)}
                  className="!gap-0 flex-1"
                />
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Priority">
              <SelectBox name="priority" getInput={form.priority} setInput={(v) => set("priority", v)} option={PRIORITIES} />
            </Field>
            <Field label="Status">
              <SelectBox name="status" getInput={form.status} setInput={(v) => set("status", v)} option={EVENT_STATUSES} />
            </Field>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-surface-100 px-4 py-3 ring-1 ring-ink-200/60">
            <CheckBox checked={form.allDay} onChange={(c) => set("allDay", c)} label="All-day event" />
            <span className="text-xs text-ink-400">Location &amp; timezone</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Start">
              <InputBox
                name="start"
                type={form.allDay ? "date" : "datetime-local"}
                getInput={form.allDay ? form.start.slice(0, 10) : form.start}
                setInput={(v) => set("start", form.allDay ? `${v}T09:00` : v)}
                error={errors.start}
                className="!gap-0"
              />
            </Field>
            <Field label="End">
              <InputBox
                name="end"
                type={form.allDay ? "date" : "datetime-local"}
                getInput={form.allDay ? form.end.slice(0, 10) : form.end}
                setInput={(v) => set("end", form.allDay ? `${v}T17:00` : v)}
                error={errors.end}
                className="!gap-0"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Location">
              <InputBox name="location" placeholder="Room, floor or address" getInput={form.location} setInput={(v) => set("location", v)} className="!gap-0" />
            </Field>
            <Field label="Meeting link" hint="google meet, teams, zoom etc. detected automatically">
              <InputBox
                name="meetingLink"
                placeholder="https://meet.google.com/..."
                getInput={form.meetingLink}
                setInput={(v) => set("meetingLink", v)}
                error={errors.meetingLink}
                className="!gap-0"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Visibility">
              <SelectBox name="visibility" getInput={form.visibility} setInput={(v) => set("visibility", v)} option={VISIBILITY_OPTIONS} />
            </Field>
            <Field label="Tags" hint="comma separated">
              <InputBox name="tags" placeholder="quarterly, client, india" getInput={form.tags} setInput={(v) => set("tags", v)} className="!gap-0" />
            </Field>
          </div>

          <Field label="Description">
            <TextArea
              name="description"
              rows={3}
              placeholder="Add more context about this event"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>

          <Field label="Agenda">
            <TextArea
              name="agenda"
              rows={2}
              placeholder="Key points to cover"
              value={form.agenda}
              onChange={(e) => set("agenda", e.target.value)}
            />
          </Field>

          <div>
            <h3 className="text-[13px] font-semibold text-ink-800 mb-2">Participants</h3>
            <div className="max-h-40 overflow-y-auto rounded-xl border border-ink-200 p-3 space-y-1.5 scrollbar-thin">
              {selectedParticipants.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pb-2 border-b border-ink-200/60 mb-2">
                  {selectedParticipants.map((p) => (
                    <span key={p._id} className="chip bg-brand-50 text-brand-700 ring-1 ring-brand-500/15">
                      {p.name || p.email || p._id}
                      <button
                        type="button"
                        onClick={() => toggleParticipant(String(p._id))}
                        className="hover:text-red-500"
                        aria-label={`Remove ${p.name}`}>
                        <X className="h-3 w-3" strokeWidth={2.5} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {employeeOptions.length === 0 && (
                <p className="text-xs text-ink-400 py-2 text-center">No employees available</p>
              )}
              {employeeOptions.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer px-1.5 py-1 rounded-lg hover:bg-surface-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.participants.includes(opt.value)}
                    onChange={() => toggleParticipant(opt.value)}
                    className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500/40 accent-brand-600"
                  />
                  <span className="text-sm text-ink-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-ink-200/70 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-[13px] font-semibold text-ink-800">Repeat</h3>
                <span className="chip bg-ink-100 text-ink-500">Recurrence</span>
              </div>
              <CheckBox
                checked={form.recurrenceEnabled}
                onChange={(c) => set("recurrenceEnabled", c)}
                label="Enable"
              />
            </div>
            {form.recurrenceEnabled && (
              <div className="space-y-4 animate-fade-in-down">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Frequency">
                    <SelectBox
                      name="recurrenceFrequency"
                      getInput={form.recurrenceFrequency}
                      setInput={(v) => set("recurrenceFrequency", v)}
                      option={RECURRENCE_FREQUENCIES}
                    />
                  </Field>
                  {(form.recurrenceFrequency === "daily" || form.recurrenceFrequency === "weekly" || form.recurrenceFrequency === "monthly") && (
                    <Field label="Every">
                      <SelectBox
                        name="recurrenceInterval"
                        getInput={String(form.recurrenceInterval)}
                        setInput={(v) => set("recurrenceInterval", Number(v))}
                        option={[1, 2, 3, 4].map((n) => ({ value: String(n), label: `${n} ${form.recurrenceFrequency === "daily" ? "day" : form.recurrenceFrequency === "weekly" ? "week" : "month"}${n > 1 ? "s" : ""}` }))}
                      />
                    </Field>
                  )}
                  {form.recurrenceFrequency === "monthly" && (
                    <Field label="Day of month">
                      <SelectBox
                        name="recurrenceDayOfMonth"
                        getInput={String(form.recurrenceDayOfMonth)}
                        setInput={(v) => set("recurrenceDayOfMonth", Number(v))}
                        option={Array.from({ length: 28 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
                      />
                    </Field>
                  )}
                </div>
                {form.recurrenceFrequency === "custom" && (
                  <Field label="Repeat on" hint="repeats weekly on the selected days">
                    <div className="flex flex-wrap gap-2 w-full">
                      {WEEKDAY_OPTIONS.map((d) => (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => toggleWeekday(d.value)}
                          className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all ${form.recurrenceDays.includes(d.value) ? "bg-brand-600 text-white shadow-sm shadow-brand-600/25" : "bg-surface-100 text-ink-500 ring-1 ring-ink-200/60 hover:ring-brand-300"}`}>
                          {d.label}
                        </button>
                      ))}
                    </div>
                    {errors.recurrenceDays && <p className="text-red-500 text-xs mt-1">{errors.recurrenceDays}</p>}
                  </Field>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="End date" hint="leave empty to repeat forever">
                    <InputBox
                      name="recurrenceEndDate"
                      type="date"
                      getInput={form.recurrenceEndDate}
                      setInput={(v) => set("recurrenceEndDate", v)}
                      error={errors.recurrenceEndDate}
                      className="!gap-0"
                    />
                  </Field>
                  <Field label="Max occurrences" hint="optional, caps the total">
                    <InputBox
                      name="recurrenceCount"
                      type="number"
                      min="1"
                      placeholder="e.g. 10"
                      getInput={form.recurrenceCount}
                      setInput={(v) => set("recurrenceCount", v)}
                      className="!gap-0"
                    />
                  </Field>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-ink-200/70 p-4 space-y-3">
            <h3 className="text-[13px] font-semibold text-ink-800">Reminders</h3>
            <div className="space-y-2">
              {form.reminderOptions.map((val) => {
                const opt = REMINDER_OPTIONS.find((r) => String(r.value) === val);
                return (
                  <div key={val} className="flex items-center gap-2">
                    <span className="flex-1 text-sm text-ink-600">{opt?.label || `${val} minutes`}</span>
                    <button
                      type="button"
                      onClick={() => set("reminderOptions", form.reminderOptions.filter((r) => r !== val))}
                      className="text-xs text-red-500 hover:text-red-600 font-medium">
                      Remove
                    </button>
                  </div>
                );
              })}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <SelectBox
                    name="newReminder"
                    placeholder="Add a reminder..."
                    getInput=""
                    setInput={(v) => {
                      if (v && !form.reminderOptions.includes(v)) {
                        set("reminderOptions", [...form.reminderOptions, v]);
                      }
                    }}
                    option={REMINDER_OPTIONS}
                  />
                </div>
              </div>
            </div>
          </div>

          {isEdit && (
            <div className="rounded-xl border border-dashed border-ink-300 p-4">
              <h3 className="text-[13px] font-semibold text-ink-800 mb-2">Attachments</h3>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl bg-surface-100 px-4 py-6 text-center ring-1 ring-ink-200/60 transition-colors hover:bg-surface-200/60">
                <Upload className="h-6 w-6 text-brand-600 mb-1.5" />
                <span className="text-sm font-medium text-ink-700">Upload files</span>
                <span className="text-xs text-ink-400 mt-0.5">up to 5 files, 5MB each</span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 5))}
                />
              </label>
              {files.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {files.map((f, i) => (
                    <span key={i} className="chip bg-ink-100 text-ink-600">{f.name}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="sticky bottom-0 -mx-6 -mb-5 flex items-center justify-end gap-3 border-t border-ink-200/70 bg-white/95 px-6 py-4 backdrop-blur-sm dark:bg-ink-200/95 dark:border-ink-700/40">
            <Button type="button" variant="ghost" label="Cancel" onClick={onClose} />
            <Button type="submit" loading={saving || attaching} label={isEdit ? "Save changes" : "Create event"} />
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
