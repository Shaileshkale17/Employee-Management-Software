import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ArrowRight, Calendar, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { loadOverview } from "../../redux/slices/calendarSlice";
import Card from "../Card";
import Skeleton from "../Skeleton";
import { formatTime } from "../../utils/dateUtils";
import { platformLabel, openMeetingLink } from "../../utils/meetingPlatforms";

const JoinButton = ({ link }) =>
  link ? (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        openMeetingLink(link);
      }}
      className="ml-auto flex flex-shrink-0 items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm shadow-brand-600/25 transition-colors hover:bg-brand-700">
      <Video className="h-3 w-3" />
      Join
    </button>
  ) : null;

const CalendarWidget = () => {
  const dispatch = useDispatch();
  const { overview, overviewLoading } = useSelector((state) => state.calendar);

  useEffect(() => {
    dispatch(loadOverview());
  }, [dispatch]);

  const quickJoin = overview?.quickJoin || [];
  const deadlines = overview?.upcomingDeadlines || [];

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-900 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
          Today
        </h3>
        <Link
          to="/calendar"
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 transition-colors hover:text-brand-700">
          Open calendar
          <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
        </Link>
      </div>

      {overviewLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {overview?.ongoingMeeting && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200/70 bg-emerald-50/60 px-3 py-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-900">Ongoing: {overview.ongoingMeeting.title}</p>
                <p className="text-xs text-ink-400">Started at {formatTime(overview.ongoingMeeting.start)}</p>
              </div>
              <JoinButton link={overview.ongoingMeeting.meetingLink} />
            </div>
          )}

          {overview?.nextEvent && (
            <div className="flex items-center gap-3 rounded-xl border border-ink-200/60 bg-surface-100/70 px-3 py-2.5">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm ring-1 ring-ink-200/60">
                <Calendar className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-800">{overview.nextEvent.title}</p>
                <p className="text-xs text-ink-400">Next up · {formatTime(overview.nextEvent.start)}</p>
              </div>
              <JoinButton link={overview.nextEvent.meetingLink} />
            </div>
          )}

          {quickJoin.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">Join within 2 hours</p>
              <div className="space-y-2">
                {quickJoin.map((m) => (
                  <div key={m.id} className="flex items-center gap-2.5 rounded-xl border border-ink-200/50 bg-white px-3 py-2">
                    <span className="text-[11px] font-bold text-brand-600">{formatTime(m.start)}</span>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink-700">{m.title}</span>
                    <span className="chip bg-ink-100 text-ink-500">{platformLabel(m.meetingPlatform)}</span>
                    <JoinButton link={m.meetingLink} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {overview?.todayMeetings?.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-brand-50/60 px-3 py-2.5 ring-1 ring-brand-500/15">
              <Video className="h-4 w-4 text-brand-600" />
              <p className="text-sm font-medium text-ink-700">
                {overview.todayMeetings.length} meeting{overview.todayMeetings.length > 1 ? "s" : ""} scheduled today
              </p>
            </div>
          )}

          {deadlines.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">Deadlines · next 7 days</p>
              <div className="space-y-1.5">
                {deadlines.slice(0, 3).map((t) => (
                  <div key={t._id} className="flex items-center gap-2 text-xs text-ink-600">
                    <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                    <span className="truncate">{t.title}</span>
                    <span className="ml-auto flex-shrink-0 font-medium text-amber-600">{formatTime(t.dueDate)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!overview?.ongoingMeeting && !overview?.nextEvent && quickJoin.length === 0 && deadlines.length === 0 && (
            <p className="py-6 text-center text-xs text-ink-400 bg-surface-100/60 rounded-xl">
              Nothing scheduled right now. Enjoy the calm.
            </p>
          )}
        </div>
      )}
    </Card>
  );
};

export default CalendarWidget;
