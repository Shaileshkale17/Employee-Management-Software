import Button from "../Button";
import Card from "../Card";
import { MeetingStatusBadge } from "./meetingMeta";
import { meetingMeta } from "../../utils/meetingMeta";
import { formatRange, formatDuration, relativeDayLabel } from "../../utils/dateUtils";
import { Video, Clock, Users } from "lucide-react";

const statusTone = (status) =>
  status === "live"
    ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
    : status === "cancelled"
      ? "bg-gradient-to-br from-red-400 to-red-500"
      : "bg-gradient-to-br from-brand-500 to-brand-600";

const MeetingCard = ({
  meeting,
  onJoin,
  onOpen,
  onStart,
  onCancel,
  onDelete,
  onCopyLink,
  onInvite,
  onEnd,
  canManage = false,
}) => {
  const { start, end, organizer, interviewerCount, candidateName } = meetingMeta(meeting);
  const dayLabel = relativeDayLabel(start);
  const isLive = meeting.status === "live";
  const minutesUntilEnd = end ? (end.getTime() - Date.now()) / 60000 : Infinity;
  const endsSoon = isLive && minutesUntilEnd <= 15;

  return (
    <Card hover>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <span
              className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-white shadow-md ${
                statusTone(meeting.status)
              }`}>
              <Video className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={onOpen}
                  className="text-left text-base font-semibold text-ink-950 transition-colors hover:text-brand-600">
                  {meeting.title}
                </button>
                <MeetingStatusBadge status={meeting.status} />
                {meeting.type === "personal-room" && (
                  <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-medium text-ink-500">
                    Personal room
                  </span>
                )}
                {isLive && (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                    {meeting.liveParticipantCount || 0} live
                  </span>
                )}
              </div>
              <p className="mt-0.5 font-mono text-xs text-ink-400">
                {meeting.meetingId}
                {meeting.candidate && ` · Interview with ${candidateName}`}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-ink-400" />
                  {formatRange(start, end)} <span className="text-ink-400">({dayLabel})</span>
                </span>
                {meeting.duration && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-ink-400" />
                    {formatDuration(start, end) || `${meeting.duration}m`}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-ink-400" />
                  {organizer}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-ink-400" />
                  {interviewerCount} interviewer{interviewerCount === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 flex-shrink-0 sm:flex-col lg:flex-row sm:items-end lg:items-center">
          {(isLive || meeting.status === "upcoming") && (
            <Button
              size="sm"
              label={isLive ? "Join Live" : "Start Meeting"}
              onClick={() => (isLive ? onJoin(meeting) : onStart(meeting))}
            />
          )}
          {endsSoon && canManage && (
            <Button
              size="sm"
              variant="danger"
              label={`End Meeting (${Math.max(1, Math.ceil(minutesUntilEnd))}m left)`}
              onClick={() => {
                if (window.confirm(`End "${meeting.title}" now for everyone?`)) onEnd(meeting);
              }}
            />
          )}
          {meeting.status === "completed" && (
            <Button size="sm" variant="secondary" label="View" onClick={onOpen} />
          )}
          <Button size="sm" variant="ghost" label="Copy Link" onClick={() => onCopyLink(meeting)} />
          {onInvite && meeting.guestJoinEnabled !== false && (
            <Button size="sm" variant="ghost" label="Invite Guest" onClick={() => onInvite(meeting)} />
          )}
          {canManage && meeting.status !== "cancelled" && (
            <Button size="sm" variant="danger" label="Cancel" onClick={() => onCancel(meeting)} />
          )}
          {canManage && (
            <Button
              size="sm"
              variant="danger"
              label="Delete"
              onClick={() => {
                if (window.confirm(`Delete meeting "${meeting.title}"?`)) onDelete(meeting);
              }}
            />
          )}
        </div>
      </div>
    </Card>
  );
};

export default MeetingCard;
