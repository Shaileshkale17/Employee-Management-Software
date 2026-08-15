import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Bell, Check, Clipboard, Clock, FileText, MapPin, Pencil, Repeat, Tag, Trash2, TriangleAlert, Users, Video, X } from "lucide-react";
import Button from "../Button";
import { TYPE_META, PRIORITY_META, STATUS_META, EVENT_STATUSES } from "./calendarMeta";
import { platformLabel, openMeetingLink } from "../../utils/meetingPlatforms";
import { formatRange } from "../../utils/dateUtils";

const Avatar = ({ name, img }) => (
  <span className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-[11px] font-bold text-white ring-2 ring-white">
    {img ? (
      <img src={img} alt={name} className="h-full w-full object-cover" />
    ) : (
      (name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
    )}
  </span>
);

const Row = ({ icon, label, children }) => (
  <div className="flex items-start gap-3">
    <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-surface-100 text-ink-400 ring-1 ring-ink-200/50">
      {icon}
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">{label}</p>
      <div className="mt-1 text-sm text-ink-700">{children}</div>
    </div>
  </div>
);

const FieldIcon = ({ icon: Icon }) => <Icon className="h-4 w-4" />;

const ICONS = {
  clock: Clock,
  pin: MapPin,
  video: Video,
  file: FileText,
  repeat: Repeat,
  bell: Bell,
  users: Users,
  notes: Pencil,
  tag: Tag,
  alert: TriangleAlert,
};

const ConfirmDelete = ({ onCancel, onDeleteOccurrence, onDeleteSeries, isRecurring }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />
    <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-modal animate-scale-in">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 mb-4">
        <Trash2 className="h-5 w-5" />
      </div>
      <h3 className="text-base font-bold text-ink-950">Delete event?</h3>
      <p className="mt-1 text-sm text-ink-500">
        {isRecurring ? "This event repeats. Choose what you want to delete." : "This action cannot be undone."}
      </p>
      <div className="mt-5 flex flex-col gap-2">
        {isRecurring && (
          <Button variant="danger" label="Delete this occurrence" onClick={onDeleteOccurrence} />
        )}
        <Button variant="danger" label={isRecurring ? "Delete the whole series" : "Yes, delete"} onClick={onDeleteSeries} />
        <Button variant="ghost" label="Cancel" onClick={onCancel} />
      </div>
    </div>
  </div>
);

const EventSummaryPanel = ({ event, onClose, onEdit, onDelete, onStatusChange, onDuplicate, onSnooze, currentUserId, canManage }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [snoozeBusy, setSnoozeBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const organizerId = event?.organizer?._id || event?.organizer;
  const isOrganizer = String(organizerId) === String(currentUserId);
  const isRecurring = useMemo(() => event?.recurrence?.enabled || event?.isRecurring, [event]);
  const isOccurrence = Boolean(event?.occurrenceStart || event?.isOverride);
  const canEdit = canManage || isOrganizer;

  const typeMeta = TYPE_META[event?.type] || TYPE_META.meeting;
  const prioMeta = PRIORITY_META[event?.priority] || PRIORITY_META.Medium;
  const statusMeta = STATUS_META[event?.status] || STATUS_META.Scheduled;
  const participants = event?.participants || [];
  const attachments = event?.attachments || [];
  const reminders = event?.reminders || [];

  const handleStatus = async (value) => {
    if (!value) return;
    setStatusBusy(true);
    try {
      await onStatusChange(value);
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setStatusBusy(false);
    }
  };

  const handleSnooze = async (minutes) => {
    setSnoozeBusy(true);
    try {
      await onSnooze(minutes);
      toast.success(`Snoozed ${minutes} minutes`);
    } catch {
      toast.error("Failed to snooze");
    } finally {
      setSnoozeBusy(false);
    }
  };

  const handleCopyLink = async () => {
    if (!event.meetingLink) return;
    try {
      await navigator.clipboard.writeText(event.meetingLink);
      setCopied(true);
      toast.success("Meeting link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleCancel = async () => {
    setConfirmCancel(false);
    setStatusBusy(true);
    try {
      await onStatusChange("Cancelled");
      toast.success("Event cancelled");
    } catch {
      toast.error("Failed to cancel event");
    } finally {
      setStatusBusy(false);
    }
  };

  if (!event) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink-950/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col bg-white shadow-2xl animate-slide-in-right">
        <div className="h-1.5 w-full" style={{ backgroundColor: event?.category?.color || typeMeta.dot }} />
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 border-b border-ink-200/70">
          <div className="flex items-start gap-3 min-w-0">
            <span className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white shadow-sm" style={{ backgroundColor: event?.category?.color || typeMeta.dot }}>
              {(() => {
                const Icon = ICONS[typeMeta.icon] || ICONS.clock;
                return <Icon className="h-5 w-5" />;
              })()}
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-ink-950 leading-snug">{event.title}</h2>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className={`chip ring-1 ${typeMeta.chip}`}>{typeMeta.label}</span>
                <span className={`chip ring-1 ${prioMeta.chip}`}>{prioMeta.label}</span>
                <span className={`chip ring-1 ${statusMeta.chip}`}>{statusMeta.label}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin space-y-5 px-5 py-5">
          {event.meetingLink && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => openMeetingLink(event.meetingLink)}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition-all hover:bg-brand-700 hover:shadow-md">
                <Video className="h-4 w-4" />
                {event.meetingPlatform === "microsoft-teams" ? "Join Microsoft Teams meeting" : "Join meeting"}
                <span className="ml-1 rounded-md bg-white/15 px-1.5 py-0.5 text-[11px]">{platformLabel(event.meetingPlatform)}</span>
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface-100 px-4 py-2.5 text-sm font-medium text-ink-600 ring-1 ring-ink-200/60 transition-colors hover:bg-surface-200/60">
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Clipboard className="h-4 w-4" />}
                {copied ? "Link copied" : "Copy meeting link"}
              </button>
            </div>
          )}

          <div className="space-y-4">
            <Row icon={<FieldIcon icon={ICONS.clock} />} label="When">
              <p className="font-medium text-ink-900">{formatRange(event.start, event.end, event.allDay)}</p>
              {event.timezone && <p className="text-xs text-ink-400 mt-0.5">{event.timezone}</p>}
            </Row>

            {event.location && (
              <Row icon={<FieldIcon icon={ICONS.pin} />} label="Where">
                <p className="font-medium">{event.location}</p>
              </Row>
            )}

            {event.description && (
              <Row icon={<FieldIcon icon={ICONS.file} />} label="Description">
                <p className="leading-relaxed whitespace-pre-wrap">{event.description}</p>
              </Row>
            )}

            {event.agenda && (
              <Row icon={<FieldIcon icon={ICONS.notes} />} label="Agenda">
                <p className="leading-relaxed whitespace-pre-wrap">{event.agenda}</p>
              </Row>
            )}

            {event.notes && (
              <Row icon={<FieldIcon icon={ICONS.notes} />} label="Notes">
                <p className="leading-relaxed whitespace-pre-wrap">{event.notes}</p>
              </Row>
            )}

            {isRecurring && (
              <Row icon={<FieldIcon icon={ICONS.repeat} />} label="Repeat">
                <p className="font-medium">
                  {event.recurrence?.frequency === "daily" && `Every ${event.recurrence?.interval > 1 ? `${event.recurrence.interval} days` : "day"}`}
                  {event.recurrence?.frequency === "weekly" && `Every ${event.recurrence?.interval > 1 ? `${event.recurrence.interval} weeks` : "week"}`}
                  {event.recurrence?.frequency === "monthly" && `Every ${event.recurrence?.interval > 1 ? `${event.recurrence.interval} months` : "month"} on day ${event.recurrence?.dayOfMonth}`}
                  {event.recurrence?.frequency === "custom" && `Weekly on ${(event.recurrence?.daysOfWeek || []).map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ")}`}
                  {isOccurrence && <span className="ml-1 text-xs text-brand-600">(edited instance)</span>}
                </p>
              </Row>
            )}

            {reminders.length > 0 && (
              <Row icon={<FieldIcon icon={ICONS.bell} />} label="Reminders">
                <div className="flex flex-wrap gap-1.5">
                  {reminders.map((r, i) => (
                    <span key={i} className="chip bg-amber-50 text-amber-700 ring-1 ring-amber-500/15">
                      {r.minutesBefore === 0 ? "At event time" : `${r.minutesBefore} min before`}
                    </span>
                  ))}
                </div>
              </Row>
            )}

            {event.tags?.length > 0 && (
              <Row icon={<FieldIcon icon={ICONS.tag} />} label="Tags">
                <div className="flex flex-wrap gap-1.5">
                  {event.tags.map((t, i) => (
                    <span key={i} className="chip bg-ink-100 text-ink-600 ring-1 ring-ink-500/10">#{t}</span>
                  ))}
                </div>
              </Row>
            )}

            {event.attendees?.length > 0 && (
              <Row icon={<FieldIcon icon={ICONS.users} />} label={`Attendees (${event.attendees.length})`}>
                <div className="flex flex-wrap gap-1.5">
                  {event.attendees.map((a) => (
                    <span
                      key={a.email}
                      className={`chip ${a.status === "cancelled" ? "bg-ink-100 text-ink-400 ring-1 ring-ink-200/60 line-through" : "bg-brand-50 text-brand-700 ring-1 ring-brand-500/15"}`}>
                      {a.email}
                    </span>
                  ))}
                </div>
              </Row>
            )}

            <Row icon={<FieldIcon icon={ICONS.users} />} label="Organizer">
              <div className="flex items-center gap-2">
                <Avatar name={event.organizer?.name} img={event.organizer?.profileImg} />
                <div>
                  <p className="font-medium">{event.organizer?.name || "You"}</p>
                  {event.organizer?.designation && <p className="text-xs text-ink-400">{event.organizer.designation}</p>}
                </div>
              </div>
            </Row>

            {participants.length > 0 && (
              <Row icon={<FieldIcon icon={ICONS.users} />} label={`Participants (${participants.length})`}>
                <div className="flex flex-wrap gap-2">
                  {participants.map((p) => (
                    <span key={p._id || p} className="flex items-center gap-2 rounded-full bg-surface-100 pr-3 ring-1 ring-ink-200/50">
                      <Avatar name={p.name} img={p.profileImg} />
                      <span className="text-xs font-medium text-ink-700">{p.name || p.email}</span>
                    </span>
                  ))}
                </div>
              </Row>
            )}

            {attachments.length > 0 && (
              <Row icon={<FieldIcon icon={ICONS.file} />} label="Attachments">
                <div className="space-y-1.5">
                  {attachments.map((a, i) => (
                    <a
                      key={i}
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg bg-surface-100 px-3 py-2 ring-1 ring-ink-200/50 transition-colors hover:bg-surface-200/60">
                      <FileText className="h-4 w-4 text-brand-600 flex-shrink-0" />
                      <span className="min-w-0 flex-1 truncate text-sm text-ink-700">{a.name}</span>
                      <span className="text-xs text-ink-400">{a.size ? `${(a.size / 1024).toFixed(0)} KB` : ""}</span>
                    </a>
                  ))}
                </div>
              </Row>
            )}
          </div>
        </div>

        <div className="border-t border-ink-200/70 bg-surface-50/60 px-5 py-4 space-y-3">
          {canEdit && (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" label="Edit" onClick={onEdit} />
              <Button variant="ghost" label="Duplicate" onClick={onDuplicate} />
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <select
                value=""
                onChange={(e) => handleStatus(e.target.value)}
                disabled={statusBusy}
                className="input-base appearance-none cursor-pointer pr-8 text-sm"
                aria-label="Change status">
                <option value="">Change status...</option>
                {EVENT_STATUSES.filter((s) => s.value !== event.status).map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <select
              value=""
              onChange={(e) => e.target.value && handleSnooze(Number(e.target.value))}
              disabled={snoozeBusy}
              className="input-base appearance-none cursor-pointer pr-8 text-sm"
              aria-label="Snooze">
              <option value="">Snooze</option>
              {[5, 10, 15, 30, 60, 120].map((m) => (
                <option key={m} value={m}>+{m} min</option>
              ))}
            </select>
          </div>

          {canEdit && event.status !== "Cancelled" && (
            <Button
              variant="danger"
              label="Cancel event"
              onClick={() => setConfirmCancel(true)}
              className="w-full"
            />
          )}

          {canEdit && (
            <Button variant="danger" label="Delete" onClick={() => setConfirmDelete(true)} className="w-full" />
          )}
        </div>
      </div>

      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={() => setConfirmCancel(false)} aria-hidden="true" />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-modal animate-scale-in">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 mb-4">
              <TriangleAlert className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-ink-950">Cancel event?</h3>
            <p className="mt-1 text-sm text-ink-500">
              Attendees will be notified by email and the online meeting will be closed.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Button variant="danger" label="Yes, cancel event" onClick={handleCancel} />
              <Button variant="ghost" label="Keep event" onClick={() => setConfirmCancel(false)} />
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDelete
          isRecurring={isRecurring && !isOccurrence}
          onCancel={() => setConfirmDelete(false)}
          onDeleteOccurrence={() => {
            setConfirmDelete(false);
            onDelete(event.occurrenceStart || event.start);
          }}
          onDeleteSeries={() => {
            setConfirmDelete(false);
            onDelete();
          }}
        />
      )}
    </>
  );
};

export default EventSummaryPanel;
