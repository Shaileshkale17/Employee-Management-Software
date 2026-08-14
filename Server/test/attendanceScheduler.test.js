import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getCutoffMinutes,
  localDateKey,
  isTimeToRun,
} from "../utils/attendanceScheduler.js";

const withCutoff = (value, fn) => {
  const prev = process.env.ATTENDANCE_CUTOFF_TIME;
  if (value === undefined) delete process.env.ATTENDANCE_CUTOFF_TIME;
  else process.env.ATTENDANCE_CUTOFF_TIME = value;
  try {
    return fn();
  } finally {
    if (prev === undefined) delete process.env.ATTENDANCE_CUTOFF_TIME;
    else process.env.ATTENDANCE_CUTOFF_TIME = prev;
  }
};

test("getCutoffMinutes defaults to 18:00", () => {
  withCutoff(undefined, () => {
    assert.equal(getCutoffMinutes(), 18 * 60);
  });
});

test("getCutoffMinutes parses HH:MM", () => {
  withCutoff("09:30", () => {
    assert.equal(getCutoffMinutes(), 9 * 60 + 30);
  });
});

test("getCutoffMinutes falls back to 18:00 for invalid values", () => {
  withCutoff("not-a-time", () => {
    assert.equal(getCutoffMinutes(), 18 * 60);
  });
});

test("localDateKey returns local YYYY-MM-DD", () => {
  assert.equal(localDateKey(new Date(2026, 0, 5, 23, 59)), "2026-01-05");
  assert.equal(localDateKey(new Date(2026, 11, 31, 0, 0)), "2026-12-31");
});

test("isTimeToRun returns false before the cutoff", () => {
  withCutoff("18:00", () => {
    assert.equal(isTimeToRun(new Date(2026, 0, 5, 9, 0), null), false);
  });
});

test("isTimeToRun returns true at/after the cutoff when not yet run", () => {
  withCutoff("18:00", () => {
    assert.equal(isTimeToRun(new Date(2026, 0, 5, 18, 0), null), true);
    assert.equal(isTimeToRun(new Date(2026, 0, 5, 23, 59), null), true);
  });
});

test("isTimeToRun returns false once the day has been processed", () => {
  withCutoff("18:00", () => {
    assert.equal(isTimeToRun(new Date(2026, 0, 5, 18, 0), "2026-01-05"), false);
  });
});

test("isTimeToRun returns true again on the next day", () => {
  withCutoff("18:00", () => {
    assert.equal(isTimeToRun(new Date(2026, 0, 6, 19, 0), "2026-01-05"), true);
  });
});
