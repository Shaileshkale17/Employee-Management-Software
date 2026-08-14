import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import Button from "../components/Button";
import InputBox from "../components/InputBox";
import SelectBox from "../components/SelectBox";
import Heading from "../components/Heading";
import MonthView from "../components/calendar/MonthView";
import WeekView from "../components/calendar/WeekView";
import DayView from "../components/calendar/DayView";
import AgendaView from "../components/calendar/AgendaView";
import EventModal from "../components/calendar/EventModal";
import EventSummaryPanel from "../components/calendar/EventSummaryPanel";
import UpcomingPanel from "../components/calendar/UpcomingPanel";
import Skeleton from "../components/Skeleton";
import { EVENT_TYPES, PRIORITIES, EVENT_STATUSES } from "../components/calendar/calendarMeta";
import { loadEvents, deleteEvent, changeEventStatus, duplicateEvent, snoozeEvent } from "../redux/slices/calendarSlice";
import { api, getToken, SOCKET_URL } from "../utils/api";
import {
  addDays,
  addMonths,
  endOfDay,
  startOfDay,
  formatDate,
  isSameDay,
} from "../utils/dateUtils";

const HR_ROLES = ["Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"];

const VIEWS = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
  { value: "agenda", label: "Agenda" },
];

const rangeFor = (view, date) => {
  if (view === "month") {
    const first = startOfDay(date);
    first.setDate(1);
    return { from: addDays(startOfDay(first), -first.getDay()), to: endOfDay(addDays(startOfDay(first), 41)) };
  }
  if (view === "week") {
    const start = startOfDay(date);
    start.setDate(start.getDate() - start.getDay());
    return { from: start, to: endOfDay(addDays(start, 6)) };
  }
  if (view === "day") {
    return { from: startOfDay(date), to: endOfDay(date) };
  }
  return { from: addDays(startOfDay(date), -30), to: endOfDay(addDays(date, 90)) };
};

const Calendar = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { events, loading } = useSelector((state) => state.calendar);

  const role = user?.user?.role;
  const userId = user?.user?.id;
  const canManage = HR_ROLES.includes(role);

  const [searchParams, setSearchParams] = useSearchParams();
  const eventParam = searchParams.get("event");

  const [view, setView] = useState("month");
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showPanel, setShowPanel] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [occurrenceStart, setOccurrenceStart] = useState(null);
  const [defaultStart, setDefaultStart] = useState(null);
  const [summaryEvent, setSummaryEvent] = useState(null);
  const [employees, setEmployees] = useState([]);

  const socketRef = useRef(null);
  const filterKey = useMemo(
    () => `${typeFilter}|${priorityFilter}|${statusFilter}`,
    [typeFilter, priorityFilter, statusFilter]
  );

  const { from, to } = useMemo(() => rangeFor(view, currentDate), [view, currentDate]);

  const applyFilters = useCallback(() => {
    dispatch(loadEvents({ from, to, search: search || undefined, type: typeFilter || undefined, priority: priorityFilter || undefined, status: statusFilter || undefined }));
  }, [dispatch, from, to, search, typeFilter, priorityFilter, statusFilter]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  useEffect(() => {
    if (!userId) return;
    api
      .get("/emp/directory")
      .then((res) => setEmployees(Array.isArray(res.data.data) ? res.data.data : []))
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.on("connect", () => {
      socket.emit("authenticate", { token: getToken() });
      socket.emit("register", String(userId));
    });
    socket.on("calendar:event:created", () => {
      applyFilters();
      toast.info("New calendar event added");
    });
    socket.on("calendar:event:updated", (payload) => {
      applyFilters();
      if (summaryEvent && payload?._id && String(payload._id) === String(summaryEvent._id)) {
        setSummaryEvent(payload);
      }
    });
    socket.on("calendar:event:deleted", (payload) => {
      applyFilters();
      if (summaryEvent && payload?._id && String(payload._id) === String(summaryEvent._id)) {
        setSummaryEvent(null);
      }
    });
    return () => {
      socket.off("calendar:event:created");
      socket.off("calendar:event:updated");
      socket.off("calendar:event:deleted");
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, filterKey, from, to]);

  const openCreate = (at) => {
    setEditingEvent(null);
    setOccurrenceStart(null);
    setDefaultStart(at || null);
    setModalOpen(true);
  };

  const openEdit = (event) => {
    setEditingEvent(event);
    setOccurrenceStart(event?.occurrenceStart || event?.isOverride ? event?.start : null);
    setDefaultStart(null);
    setSummaryEvent(null);
    setModalOpen(true);
  };

  const openSummary = (event) => {
    setSummaryEvent(event);
    if (eventParam) {
      setSearchParams({});
    }
  };

  useEffect(() => {
    if (eventParam) {
      const found = events.find((e) => String(e._id) === String(eventParam));
      if (found) setSummaryEvent(found);
    }
  }, [eventParam, events]);

  const handleDelete = async (occurrence) => {
    if (!summaryEvent) return;
    try {
      await dispatch(deleteEvent(summaryEvent._id, occurrence));
      toast.success(occurrence ? "Occurrence deleted" : "Event deleted");
      setSummaryEvent(null);
    } catch {
      toast.error("Failed to delete event");
    }
  };

  const handleStatusChange = async (status) => {
    if (!summaryEvent) return;
    const updated = await dispatch(changeEventStatus(summaryEvent._id, status));
    setSummaryEvent(updated);
  };

  const handleDuplicate = async () => {
    if (!summaryEvent) return;
    try {
      await dispatch(duplicateEvent(summaryEvent._id));
      toast.success("Event duplicated");
    } catch {
      toast.error("Failed to duplicate event");
    }
  };

  const handleSnooze = async (minutes) => {
    if (!summaryEvent) return;
    try {
      await dispatch(snoozeEvent(summaryEvent._id, minutes));
      toast.success("Snoozed");
    } catch {
      toast.error("Failed to snooze event");
    }
  };

  const nav = (dir) => {
    if (view === "month") setCurrentDate((d) => addMonths(d, dir));
    else if (view === "week") setCurrentDate((d) => addDays(d, 7 * dir));
    else if (view === "day") setCurrentDate((d) => addDays(d, dir));
    else setCurrentDate((d) => addMonths(d, dir));
  };

  const titleForRange = () => {
    if (view === "month") return formatDate(currentDate, { month: "long", year: "numeric" });
    if (view === "week") {
      const start = startOfDay(currentDate);
      start.setDate(start.getDate() - start.getDay());
      const end = addDays(start, 6);
      if (start.getMonth() === end.getMonth()) return `${formatDate(start, { month: "long" })} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
      return `${formatDate(start, { month: "short" })} ${start.getDate()} – ${formatDate(end, { month: "short", day: "numeric", year: "numeric" })}`;
    }
    if (view === "day") return formatDate(currentDate, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    return "Upcoming 120 days";
  };

  const SideNav = (r) => (HR_ROLES.includes(r) ? <HRSideNavber /> : <SideNavbar />);

  const filtered = useMemo(() => {
    if (view === "day") return (events || []).filter((e) => isSameDay(e.start, currentDate));
    return events || [];
  }, [events, view, currentDate]);

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("");
    setPriorityFilter("");
    setStatusFilter("");
  };

  return (
    <div className="flex min-h-screen bg-surface-100">
      {SideNav(role)}
      <main className="flex-1 min-h-screen p-4 lg:p-8 bg-mesh-light">
        <div className="mx-auto max-w-[1400px] space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 animate-fade-in-down">
            <Heading
              heading="Calendar"
              subtitle="Plan meetings, interviews, tasks and important dates across your team."
              icon={<CalendarIcon className="h-4 w-4" />}
            />
            <Button label="New event" onClick={() => openCreate(null)} />
          </div>

          <div className="flex flex-wrap items-center gap-3 animate-fade-in-up">
            <div className="flex items-center gap-1 rounded-xl bg-white p-1 ring-1 ring-ink-200/60 shadow-sm">
              <button
                type="button"
                onClick={() => nav(-1)}
                aria-label="Previous"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900">
                <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={() => nav(1)}
                aria-label="Next"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900">
                <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setCurrentDate(new Date())}
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-ink-700 ring-1 ring-ink-200/60 shadow-sm transition-colors hover:ring-brand-300 hover:text-brand-700">
              Today
            </button>

            <h2 className="min-w-[170px] text-base font-bold text-ink-950">{titleForRange()}</h2>

            <div className="ml-auto flex items-center gap-2 rounded-xl bg-white p-1 ring-1 ring-ink-200/60 shadow-sm">
              {VIEWS.map((v) => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => setView(v.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    view === v.value ? "bg-brand-600 text-white shadow-sm shadow-brand-600/25" : "text-ink-500 hover:text-ink-800"
                  }`}>
                  {v.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowPanel((s) => !s)}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl bg-white text-ink-600 ring-1 ring-ink-200/60 shadow-sm"
              aria-label="Toggle upcoming panel">
              <CalendarIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="w-full sm:w-64">
                  <InputBox
                    name="search"
                    ariaLabel="Search events"
                    placeholder="Search events..."
                    getInput={search}
                    setInput={setSearch}
                    icon={<Search className="h-4 w-4" />}
                    className="!gap-0"
                  />
                </div>
                <div className="w-full sm:w-40">
                  <SelectBox name="type" ariaLabel="Filter by type" placeholder="All types" getInput={typeFilter} setInput={setTypeFilter} option={EVENT_TYPES} />
                </div>
                <div className="w-full sm:w-40">
                  <SelectBox name="priority" ariaLabel="Filter by priority" placeholder="All priorities" getInput={priorityFilter} setInput={setPriorityFilter} option={PRIORITIES} />
                </div>
                <div className="w-full sm:w-40">
                  <SelectBox name="status" ariaLabel="Filter by status" placeholder="All statuses" getInput={statusFilter} setInput={setStatusFilter} option={EVENT_STATUSES} />
                </div>
                {(search || typeFilter || priorityFilter || statusFilter) && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-ink-500 transition-colors hover:text-red-500">
                    <X className="h-3.5 w-3.5" />
                    Clear
                  </button>
                )}
              </div>

              {loading && events.length === 0 ? (
                <div className="card-surface p-4">
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 35 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="animate-fade-in">
                  {view === "month" && (
                    <MonthView month={currentDate} events={filtered} onSelectDay={(d) => { setCurrentDate(d); setView("day"); }} onEventClick={openSummary} />
                  )}
                  {view === "week" && (
                    <WeekView week={currentDate} events={filtered} onSelectDay={(d) => { setCurrentDate(d); setView("day"); }} onEventClick={openSummary} onNewEventAt={openCreate} />
                  )}
                  {view === "day" && (
                    <DayView day={currentDate} events={filtered} onEventClick={openSummary} onNewEventAt={openCreate} />
                  )}
                  {view === "agenda" && <AgendaView events={filtered} onEventClick={openSummary} />}
                </div>
              )}
            </div>

            <aside className={`${showPanel ? "block" : "hidden"} xl:block`}>
              <UpcomingPanel onEventClick={(item) => {
                if (item?.id) {
                  const match = events.find((e) => String(e._id) === String(item.id));
                  if (match) openSummary(match);
                }
              }} />
            </aside>
          </div>
        </div>
      </main>

      <EventModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        event={editingEvent}
        defaultStart={defaultStart}
        occurrenceStart={occurrenceStart}
        employees={employees}
        currentUserId={userId}
        onSaved={() => {
          applyFilters();
        }}
      />

      {summaryEvent && (
        <EventSummaryPanel
          event={summaryEvent}
          currentUserId={userId}
          canManage={canManage}
          onClose={() => setSummaryEvent(null)}
          onEdit={() => openEdit(summaryEvent)}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          onDuplicate={handleDuplicate}
          onSnooze={handleSnooze}
        />
      )}
    </div>
  );
};

export default Calendar;
