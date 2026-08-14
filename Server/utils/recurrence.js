const MS_DAY = 24 * 60 * 60 * 1000;

export const startOfDay = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

export const endOfDay = (date) => {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
};

export const isSameDay = (a, b) => {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getUTCFullYear() === db.getUTCFullYear() &&
    da.getUTCMonth() === db.getUTCMonth() &&
    da.getUTCDate() === db.getUTCDate()
  );
};

export const addDays = (date, days) => {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
};

export const addMonths = (date, months) => {
  const d = new Date(date);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)
  ).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
};

export const diffDays = (from, to) =>
  Math.round((startOfDay(to) - startOfDay(from)) / MS_DAY);

export const diffMonths = (from, to) => {
  const a = new Date(from);
  const b = new Date(to);
  return (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
};

export const getRule = (event = {}) => {
  const r = event.recurrence || {};
  return {
    enabled: Boolean(r.enabled),
    frequency: r.frequency || "none",
    interval: Math.max(1, Number(r.interval) || 1),
    daysOfWeek: Array.isArray(r.daysOfWeek) ? r.daysOfWeek : [],
    dayOfMonth: r.dayOfMonth || null,
    endDate: r.endDate ? new Date(r.endDate) : null,
    count: r.count ? Number(r.count) : null,
  };
};

const matchesWeekly = (rule, date) => {
  const days = rule.daysOfWeek.length ? rule.daysOfWeek : [date.getUTCDay()];
  return days.includes(date.getUTCDay());
};

const monthlyDay = (rule, date) => {
  const target = rule.dayOfMonth || date.getUTCDate();
  const lastDay = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)
  ).getUTCDate();
  return Math.min(target, lastDay);
};

export const isRecurring = (event = {}) => {
  const rule = getRule(event);
  return rule.enabled && rule.frequency !== "none";
};

export const isExcluded = (event, date) => {
  const excluded = Array.isArray(event.excludedDates) ? event.excludedDates : [];
  return excluded.some((d) => isSameDay(d, date));
};

export const getOverride = (event, date) => {
  const overrides = Array.isArray(event.overrides) ? event.overrides : [];
  return overrides.find((o) => o && o.originalStart && isSameDay(o.originalStart, date)) || null;
};

const durationOf = (event) => {
  if (event.end) return Math.max(0, new Date(event.end) - new Date(event.start));
  return 0;
};

const buildOccurrence = (event, start, duration) => {
  const end = event.end ? new Date(start.getTime() + duration) : null;
  return {
    _id: event._id,
    title: event.title,
    description: event.description,
    start,
    end,
    allDay: Boolean(event.allDay),
    timezone: event.timezone || "",
    type: event.type,
    category: event.category || { name: "General", color: "#3354F4" },
    priority: event.priority,
    status: event.status,
    location: event.location || "",
    meetingLink: event.meetingLink || "",
    meetingPlatform: event.meetingPlatform || "",
    tags: event.tags || [],
    notes: event.notes || "",
    agenda: event.agenda || "",
    organizer: event.organizer,
    participants: event.participants || [],
    visibility: event.visibility || "private",
    recurrence: event.recurrence || {},
    originalStart: start,
    isOverride: false,
    source: event.source || "manual",
    interview: event.interview || null,
    link: event.link || "",
  };
};

/**
 * Expand a single event (recurring or not) into occurrences within [from, to].
 * Respects excludedDates, overrides, endDate and count.
 */
export const expandEvent = (event, from, to) => {
  const fromD = startOfDay(from);
  const toD = endOfDay(to);
  const duration = durationOf(event);
  const rule = getRule(event);

  if (!rule.enabled || rule.frequency === "none") {
    const start = new Date(event.start);
    if (start > toD || (event.end && event.end < fromD)) return [];
    return [buildOccurrence(event, start, duration)];
  }

  const anchor = startOfDay(event.start);
  const occurrences = [];
  const maxScan = 5000;

  const freq = rule.frequency;
  const interval = rule.interval;

  // Occurrence index counter for count-based recurrence.
  let stepIndex = 0;
  if (freq === "daily") {
    const before = Math.max(0, diffDays(anchor, fromD));
    stepIndex = Math.floor(before / interval);
  } else if (freq === "weekly") {
    const days = diffDays(anchor, fromD);
    if (days > 0) stepIndex = Math.floor(days / (7 * interval));
  } else if (freq === "monthly") {
    const months = Math.max(0, diffMonths(anchor, fromD));
    stepIndex = Math.floor(months / interval);
  }

  let cursor = anchor;
  let scans = 0;

  const computeCursor = (anchorDate, targetIndex) => {
    if (freq === "daily") return addDays(anchorDate, targetIndex * interval);
    if (freq === "weekly") return addDays(anchorDate, targetIndex * 7 * interval);
    if (freq === "monthly") {
      // Build the exact monthly date to avoid sequential clamp drift (Jan 31 -> Feb 28 -> Mar 28).
      const anchorDay = rule.dayOfMonth || anchorDate.getUTCDate();
      const month = anchorDate.getUTCMonth() + targetIndex * interval;
      const year = anchorDate.getUTCFullYear() + Math.floor(month / 12);
      const m = ((month % 12) + 12) % 12;
      const lastDay = new Date(Date.UTC(year, m + 1, 0)).getUTCDate();
      return new Date(Date.UTC(year, m, Math.min(anchorDay, lastDay)));
    }
    return addDays(anchorDate, targetIndex * 7 * interval);
  };

  const isDateIncluded = (date) => {
    if (freq === "monthly") {
      return date.getUTCDate() === monthlyDay(rule, date);
    }
    if (freq === "custom") {
      return rule.daysOfWeek.length ? matchesWeekly(rule, date) : matchesWeekly(rule, date);
    }
    return matchesWeekly(rule, date);
  };

  const windowStart = Math.max(anchor, fromD);

  if (freq === "custom" && rule.daysOfWeek.length) {
    // Step day by day within each interval week.
    let weekStart = addDays(anchor, Math.floor(diffDays(anchor, windowStart) / (7 * interval)) * 7 * interval);
    while (weekStart <= toD && scans < maxScan) {
      scans += 1;
      if (weekStart < windowStart - 7 * interval) {
        weekStart = addDays(weekStart, 7 * interval);
        continue;
      }
      for (let d = 0; d < 7; d += 1) {
        const candidate = addDays(weekStart, d);
        if (candidate < windowStart || candidate > toD) continue;
        if (!matchesWeekly(rule, candidate)) continue;
        const beforeCount = Math.max(0, diffDays(anchor, candidate));
        const occurrenceIndex = Math.floor(beforeCount / 7 / interval) * rule.daysOfWeek.length + rule.daysOfWeek.indexOf(candidate.getUTCDay());
        if (rule.count && occurrenceIndex >= rule.count) return occurrences;
        pushOccurrence(candidate, occurrenceIndex);
      }
      weekStart = addDays(weekStart, 7 * interval);
    }
    return occurrences;
  }

  // Standard frequencies: cursor lands on anchor-equivalent dates.
  if (rule.count && stepIndex >= rule.count) return [];

  cursor = computeCursor(anchor, stepIndex);

  // If cursor is before window (monthly clamping edge), step forward.
  while (cursor < windowStart && scans < maxScan) {
    scans += 1;
    stepIndex += 1;
    if (rule.count && stepIndex >= rule.count) return occurrences;
    cursor = computeCursor(anchor, stepIndex);
  }

  while (cursor <= toD && scans < maxScan) {
    scans += 1;
    const included = isDateIncluded(cursor);
    if (included) {
      const occurrenceIndex = stepIndex;
      if (rule.count && occurrenceIndex >= rule.count) break;
      pushOccurrence(cursor, occurrenceIndex);
    }
    if (rule.endDate && cursor >= startOfDay(rule.endDate)) break;
    stepIndex += 1;
    cursor = computeCursor(anchor, stepIndex);
  }

  function pushOccurrence(date, occurrenceIndex) {
    if (rule.endDate && date > startOfDay(rule.endDate)) return;
    if (rule.count && occurrenceIndex >= rule.count) return;
    if (isExcluded(event, date)) return;
    const override = getOverride(event, date);
    const occStart = override && override.start ? new Date(override.start) : new Date(date);
    const occEnd =
      override && override.end
        ? new Date(override.end)
        : event.end
          ? new Date(occStart.getTime() + duration)
          : null;
    const occ = buildOccurrence(event, occStart, duration);
    occ.originalStart = new Date(date);
    occ.end = occEnd;
    if (override) {
      occ.isOverride = true;
      if (override.title) occ.title = override.title;
      if (override.status) occ.status = override.status;
    }
    occurrences.push(occ);
  }

  return occurrences;
};

/**
 * Expand many events into a single sorted occurrence list within [from, to].
 */
export const getOccurrencesInRange = (events = [], from, to) => {
  const out = [];
  for (const event of events) {
    try {
      out.push(...expandEvent(event, from, to));
    } catch (error) {
      console.error("Failed to expand event", event._id, error.message);
    }
  }
  return out.sort((a, b) => new Date(a.start) - new Date(b.start));
};

/**
 * Next occurrence of an event strictly at/after `after` (start-of-day boundary aware).
 */
export const nextOccurrence = (event, after = new Date()) => {
  const fromD = startOfDay(after);
  const occurrences = expandEvent(event, fromD, addDays(fromD, 730));
  const filtered = occurrences.filter((o) => new Date(o.start) >= new Date(after));
  return filtered.length ? filtered[0] : null;
};

export const computeDurationMinutes = (start, end) => {
  if (!start) return 0;
  if (!end) return 0;
  return Math.max(0, Math.round((new Date(end) - new Date(start)) / 60000));
};
