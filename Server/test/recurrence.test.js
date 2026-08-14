import { test } from "node:test";
import assert from "node:assert/strict";
import {
  expandEvent,
  getOccurrencesInRange,
  nextOccurrence,
  isSameDay,
  startOfDay,
  endOfDay,
  addDays,
  addMonths,
  computeDurationMinutes,
  isRecurring,
} from "../utils/recurrence.js";

const base = (overrides = {}) => ({
  _id: "507f1f77bcf86cd799439011",
  title: "Standup",
  description: "",
  start: new Date("2026-01-05T09:00:00.000Z"),
  end: new Date("2026-01-05T09:30:00.000Z"),
  allDay: false,
  type: "meeting",
  category: { name: "General", color: "#3354F4" },
  priority: "Medium",
  status: "Scheduled",
  location: "",
  meetingLink: "",
  meetingPlatform: "",
  tags: [],
  notes: "",
  agenda: "",
  organizer: "507f1f77bcf86cd799439012",
  participants: [],
  visibility: "private",
  recurrence: { enabled: false, frequency: "none", interval: 1, daysOfWeek: [], dayOfMonth: null, endDate: null, count: null },
  excludedDates: [],
  overrides: [],
  ...overrides,
});

test("non-recurring event inside range yields one occurrence", () => {
  const ev = base();
  const out = expandEvent(ev, new Date("2026-01-01"), new Date("2026-01-31"));
  assert.equal(out.length, 1);
  assert.equal(out[0].start.toISOString(), "2026-01-05T09:00:00.000Z");
  assert.equal(out[0].end.toISOString(), "2026-01-05T09:30:00.000Z");
});

test("non-recurring event outside range yields none", () => {
  const ev = base();
  const out = expandEvent(ev, new Date("2026-02-01"), new Date("2026-02-28"));
  assert.equal(out.length, 0);
});

test("multi-day event spanning window boundary is included", () => {
  const ev = base({
    start: new Date("2026-01-30T22:00:00.000Z"),
    end: new Date("2026-02-02T22:00:00.000Z"),
  });
  const out = expandEvent(ev, new Date("2026-02-01"), new Date("2026-02-15"));
  assert.equal(out.length, 1);
});

test("daily recurrence every 2 days expands correctly", () => {
  const ev = base({
    start: new Date("2026-01-05T09:00:00.000Z"),
    end: new Date("2026-01-05T09:30:00.000Z"),
    recurrence: { enabled: true, frequency: "daily", interval: 2, daysOfWeek: [], dayOfMonth: null, endDate: null, count: null },
  });
  const out = expandEvent(ev, new Date("2026-01-01"), new Date("2026-01-15"));
  const days = out.map((o) => o.start.getUTCDate());
  assert.deepEqual(days, [5, 7, 9, 11, 13, 15]);
});

test("daily recurrence with count limit", () => {
  const ev = base({
    recurrence: { enabled: true, frequency: "daily", interval: 1, daysOfWeek: [], dayOfMonth: null, endDate: null, count: 3 },
  });
  const out = expandEvent(ev, new Date("2026-01-01"), new Date("2026-02-01"));
  assert.equal(out.length, 3);
});

test("daily recurrence honors endDate", () => {
  const ev = base({
    recurrence: { enabled: true, frequency: "daily", interval: 1, daysOfWeek: [], dayOfMonth: null, endDate: new Date("2026-01-08T23:59:00.000Z"), count: null },
  });
  const out = expandEvent(ev, new Date("2026-01-01"), new Date("2026-01-31"));
  const days = out.map((o) => o.start.getUTCDate());
  assert.deepEqual(days, [5, 6, 7, 8]);
});

test("weekly recurrence keeps same weekday", () => {
  const ev = base({
    start: new Date("2026-01-05T09:00:00.000Z"),
    recurrence: { enabled: true, frequency: "weekly", interval: 1, daysOfWeek: [], dayOfMonth: null, endDate: null, count: null },
  });
  const out = expandEvent(ev, new Date("2026-01-01"), new Date("2026-02-02"));
  assert.equal(out.length, 5);
  out.forEach((o) => assert.equal(o.start.getUTCDay(), 1));
});

test("weekly recurrence every 2 weeks", () => {
  const ev = base({
    recurrence: { enabled: true, frequency: "weekly", interval: 2, daysOfWeek: [], dayOfMonth: null, endDate: null, count: null },
  });
  const out = expandEvent(ev, new Date("2026-01-01"), new Date("2026-02-15"));
  const days = out.map((o) => o.start.getUTCDate());
  assert.deepEqual(days, [5, 19, 2]);
});

test("monthly recurrence clamps to last day (Jan 31 anchor)", () => {
  const ev = base({
    start: new Date("2026-01-31T10:00:00.000Z"),
    end: new Date("2026-01-31T11:00:00.000Z"),
    recurrence: { enabled: true, frequency: "monthly", interval: 1, daysOfWeek: [], dayOfMonth: null, endDate: null, count: null },
  });
  const out = expandEvent(ev, new Date("2026-01-01"), new Date("2026-12-31"));
  const dates = out.map((o) => o.start.toISOString().slice(0, 10));
  assert.deepEqual(dates, [
    "2026-01-31",
    "2026-02-28",
    "2026-03-31",
    "2026-04-30",
    "2026-05-31",
    "2026-06-30",
    "2026-07-31",
    "2026-08-31",
    "2026-09-30",
    "2026-10-31",
    "2026-11-30",
    "2026-12-31",
  ]);
});

test("monthly recurrence with dayOfMonth 15", () => {
  const ev = base({
    start: new Date("2026-01-15T10:00:00.000Z"),
    recurrence: { enabled: true, frequency: "monthly", interval: 1, daysOfWeek: [], dayOfMonth: 15, endDate: null, count: null },
  });
  const out = expandEvent(ev, new Date("2026-01-01"), new Date("2026-03-31"));
  assert.equal(out.length, 3);
  out.forEach((o) => assert.equal(o.start.getUTCDate(), 15));
});

test("custom recurrence on Monday/Wednesday/Friday", () => {
  const ev = base({
    start: new Date("2026-01-05T09:00:00.000Z"),
    recurrence: { enabled: true, frequency: "custom", interval: 1, daysOfWeek: [1, 3, 5], dayOfMonth: null, endDate: null, count: null },
  });
  const out = expandEvent(ev, new Date("2026-01-01"), new Date("2026-01-16"));
  const days = out.map((o) => o.start.getUTCDay());
  assert.deepEqual(days, [1, 3, 5, 1, 3, 5]);
});

test("excluded dates remove occurrences", () => {
  const ev = base({
    recurrence: { enabled: true, frequency: "daily", interval: 1, daysOfWeek: [], dayOfMonth: null, endDate: null, count: null },
    excludedDates: [new Date("2026-01-07T00:00:00.000Z")],
  });
  const out = expandEvent(ev, new Date("2026-01-05"), new Date("2026-01-10"));
  const days = out.map((o) => o.start.getUTCDate());
  assert.deepEqual(days, [5, 6, 8, 9, 10]);
});

test("overrides apply title and status to single occurrence", () => {
  const ev = base({
    recurrence: { enabled: true, frequency: "daily", interval: 1, daysOfWeek: [], dayOfMonth: null, endDate: null, count: null },
    overrides: [{ originalStart: new Date("2026-01-06T00:00:00.000Z"), title: "Moved Standup", status: "Cancelled" }],
  });
  const out = expandEvent(ev, new Date("2026-01-05"), new Date("2026-01-08"));
  const moved = out.find((o) => o.start.getUTCDate() === 6);
  assert.ok(moved);
  assert.equal(moved.title, "Moved Standup");
  assert.equal(moved.status, "Cancelled");
  assert.equal(moved.isOverride, true);
});

test("getOccurrencesInRange sorts by start and merges events", () => {
  const a = base({
    _id: "a".padStart(24, "0"),
    start: new Date("2026-01-10T09:00:00.000Z"),
    end: new Date("2026-01-10T10:00:00.000Z"),
    recurrence: { enabled: true, frequency: "daily", interval: 1, daysOfWeek: [], dayOfMonth: null, endDate: null, count: null },
  });
  const b = base({
    _id: "b".padStart(24, "0"),
    title: "Review",
    start: new Date("2026-01-05T09:00:00.000Z"),
    end: new Date("2026-01-05T10:00:00.000Z"),
  });
  const out = getOccurrencesInRange([a, b], new Date("2026-01-01"), new Date("2026-01-15"));
  const starts = out.map((o) => o.start.getTime());
  assert.equal(starts.length, starts.slice().sort((x, y) => x - y).length);
  assert.equal(out[0].title, "Review");
});

test("nextOccurrence returns the first occurrence at/after now", () => {
  const ev = base({
    recurrence: { enabled: true, frequency: "daily", interval: 1, daysOfWeek: [], dayOfMonth: null, endDate: null, count: null },
  });
  const next = nextOccurrence(ev, new Date("2026-01-10T12:00:00.000Z"));
  assert.equal(next.start.getUTCDate(), 11);
});

test("isRecurring detects recurrence", () => {
  assert.equal(isRecurring(base()), false);
  assert.equal(
    isRecurring(base({ recurrence: { enabled: true, frequency: "weekly", interval: 1 } })),
    true
  );
});

test("date helpers", () => {
  assert.equal(isSameDay("2026-01-05T00:00:00.000Z", "2026-01-05T23:00:00.000Z"), true);
  assert.equal(isSameDay("2026-01-05", "2026-01-06"), false);
  assert.equal(startOfDay(new Date("2026-01-05T15:30:00.000Z")).toISOString(), "2026-01-05T00:00:00.000Z");
  assert.equal(endOfDay(new Date("2026-01-05T15:30:00.000Z")).toISOString(), "2026-01-05T23:59:59.999Z");
  assert.equal(addDays(new Date("2026-01-31T12:00:00.000Z"), 1).getUTCDate(), 1);
  assert.equal(addMonths(new Date("2026-01-31T12:00:00.000Z"), 1).toISOString().slice(0, 10), "2026-02-28");
  assert.equal(computeDurationMinutes("2026-01-05T09:00:00.000Z", "2026-01-05T09:45:00.000Z"), 45);
});
