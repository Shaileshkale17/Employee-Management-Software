import test from "node:test";
import assert from "node:assert/strict";
import {
  validateMeetingPayload,
  normalizeDuration,
  normalizeMeetingParticipants,
} from "../utils/meetingValidation.js";

test("validateMeetingPayload requires a title and valid start", () => {
  const result = validateMeetingPayload({});
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("Title")));

  const missingStart = validateMeetingPayload({ title: "Sprint", type: "scheduled" });
  assert.equal(missingStart.ok, false);

  const good = validateMeetingPayload({
    title: "Sprint review",
    type: "scheduled",
    start: new Date("2030-01-01T10:00:00Z"),
    duration: 45,
  });
  assert.equal(good.ok, true);
  assert.equal(good.data.title, "Sprint review");
  assert.equal(good.data.duration, 45);
});

test("validateMeetingPayload rejects end before start", () => {
  const result = validateMeetingPayload({
    title: "Bad",
    type: "scheduled",
    start: "2030-01-02T10:00:00Z",
    end: "2030-01-01T09:00:00Z",
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("before start")));
});

test("instant meetings do not require a start time", () => {
  const result = validateMeetingPayload({ title: "Now", type: "instant" });
  assert.equal(result.ok, true);
  assert.ok(result.data.start instanceof Date);
});

test("normalizeDuration clamps to the allowed range", () => {
  assert.equal(normalizeDuration(30), 30);
  assert.equal(normalizeDuration(2), 5);
  assert.equal(normalizeDuration(99999), 1440);
  assert.equal(normalizeDuration("abc"), 60);
});

test("normalizeMeetingParticipants filters invalid ids", () => {
  const ids = normalizeMeetingParticipants(["507f1f77bcf86cd799439011", "nope", null, 42]);
  assert.equal(ids.length, 1);
  assert.equal(ids[0], "507f1f77bcf86cd799439011");
});

test("sanitizes long titles", () => {
  const result = validateMeetingPayload({
    title: "x".repeat(500),
    type: "instant",
  });
  assert.equal(result.data.title.length, 150);
});
