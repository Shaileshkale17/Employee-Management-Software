import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateEventPayload,
  normalizeReminders,
  normalizeRecurrence,
  normalizeTags,
  detectMeetingPlatform,
  isValidHttpUrl,
} from "../utils/calendarValidation.js";

test("valid payload passes validation", () => {
  const { ok, errors, data } = validateEventPayload({
    title: "  Sprint Planning  ",
    description: "Plan the sprint",
    start: "2026-02-01T10:00:00.000Z",
    end: "2026-02-01T11:00:00.000Z",
    type: "meeting",
    priority: "High",
    status: "Scheduled",
    meetingLink: "https://meet.google.com/abc-def-ghi",
    meetingPlatform: "google-meet",
    category: { name: "Team", color: "#0ea5e9" },
    participants: ["507f1f77bcf86cd799439011"],
    tags: "a, b , c",
  });
  assert.equal(ok, true);
  assert.equal(errors.length, 0);
  assert.equal(data.title, "Sprint Planning");
  assert.deepEqual(data.tags, ["a", "b", "c"]);
  assert.equal(data.priority, "High");
  assert.equal(data.category.name, "Team");
});

test("missing title fails", () => {
  const { ok, errors } = validateEventPayload({ start: "2026-02-01T10:00:00.000Z" });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.toLowerCase().includes("title")));
});

test("invalid start fails", () => {
  const { ok, errors } = validateEventPayload({ title: "X", start: "not-a-date" });
  assert.equal(ok, false);
});

test("end before start fails", () => {
  const { ok, errors } = validateEventPayload({
    title: "X",
    start: "2026-02-01T10:00:00.000Z",
    end: "2026-02-01T09:00:00.000Z",
  });
  assert.equal(ok, false);
});

test("invalid meeting link fails", () => {
  const { ok, errors } = validateEventPayload({
    title: "X",
    start: "2026-02-01T10:00:00.000Z",
    meetingLink: "ftp://bad.example.com/x",
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.toLowerCase().includes("link")));
});

test("javascript: link is rejected", () => {
  assert.equal(isValidHttpUrl("javascript:alert(1)"), false);
  assert.equal(isValidHttpUrl("https://meet.google.com/abc"), true);
});

test("meeting platform detection", () => {
  assert.equal(detectMeetingPlatform("https://meet.google.com/abc"), "google-meet");
  assert.equal(detectMeetingPlatform("https://teams.microsoft.com/l/meetup-join/123"), "microsoft-teams");
  assert.equal(detectMeetingPlatform("https://zoom.us/j/123456"), "zoom");
  assert.equal(detectMeetingPlatform("https://example.webex.com/meet/abc"), "webex");
  assert.equal(detectMeetingPlatform("https://acme.example.com/room"), "custom");
});

test("invalid priority/status fall back to defaults", () => {
  const { data } = validateEventPayload({
    title: "X",
    start: "2026-02-01T10:00:00.000Z",
    priority: "Extreme",
    status: "Unknown",
  });
  assert.equal(data.priority, "Medium");
  assert.equal(data.status, "Scheduled");
});

test("normalizeReminders converts minutesBefore to absolute times", () => {
  const start = "2026-02-01T10:00:00.000Z";
  const reminders = normalizeReminders(
    [{ minutesBefore: 5 }, { minutesBefore: 30 }, { minutesBefore: 5 }, { minutesBefore: -10 }],
    start
  );
  assert.equal(reminders.length, 2);
  const first = reminders.find((r) => r.minutesBefore === 30);
  assert.equal(new Date(first.at).toISOString(), "2026-02-01T09:30:00.000Z");
});

test("normalizeReminders sorts by time ascending", () => {
  const reminders = normalizeReminders([{ minutesBefore: 30 }, { minutesBefore: 5 }], "2026-02-01T10:00:00.000Z");
  assert.equal(reminders[0].minutesBefore, 30);
  assert.equal(reminders[1].minutesBefore, 5);
});

test("normalizeRecurrence defaults", () => {
  const r = normalizeRecurrence({}, "2026-02-01T10:00:00.000Z");
  assert.equal(r.enabled, false);
  assert.equal(r.frequency, "none");
});

test("normalizeRecurrence clamps interval and filters days", () => {
  const r = normalizeRecurrence(
    { enabled: true, frequency: "custom", interval: 0, daysOfWeek: [1, 9, 3] },
    "2026-02-01T10:00:00.000Z"
  );
  assert.equal(r.interval, 1);
  assert.deepEqual(r.daysOfWeek, [1, 3]);
});

test("normalizeRecurrence rejects end date before start", () => {
  assert.throws(() =>
    normalizeRecurrence(
      { enabled: true, frequency: "daily", endDate: "2026-01-01T00:00:00.000Z" },
      "2026-02-01T10:00:00.000Z"
    )
  );
});

test("normalizeTags handles string and array", () => {
  assert.deepEqual(normalizeTags("one, two ,three"), ["one", "two", "three"]);
  assert.deepEqual(normalizeTags(["x", "  y  ", ""]), ["x", "y"]);
  assert.deepEqual(normalizeTags(123), []);
});

test("invalid participants are filtered", () => {
  const { data } = validateEventPayload({
    title: "X",
    start: "2026-02-01T10:00:00.000Z",
    participants: ["507f1f77bcf86cd799439011", "not-an-objectid", 42, { _id: "507f1f77bcf86cd799439012" }],
  });
  assert.equal(data.participants.length, 2);
});
