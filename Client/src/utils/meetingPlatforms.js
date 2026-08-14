export const MEETING_PLATFORMS = {
  "google-meet": { label: "Google Meet", color: "#34A853" },
  "microsoft-teams": { label: "Microsoft Teams", color: "#6264A7" },
  zoom: { label: "Zoom", color: "#2D8CFF" },
  webex: { label: "Webex", color: "#8C1C13" },
  "slack-huddle": { label: "Slack Huddle", color: "#4A154B" },
  custom: { label: "Custom Link", color: "#6B7280" },
};

export const DEFAULT_MEETING_PLATFORM = "custom";

export const platformLabel = (key) => MEETING_PLATFORMS[key]?.label || "Custom Link";

export const platformColor = (key) => MEETING_PLATFORMS[key]?.color || "#6B7280";

export const detectMeetingPlatform = (url) => {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host.includes("meet.google.com")) return "google-meet";
    if (host.includes("teams.microsoft.com") || host.includes("teams.live.com")) return "microsoft-teams";
    if (host.includes("zoom.us") || host.includes("zoom.com")) return "zoom";
    if (host.includes("webex.com")) return "webex";
    if (host.includes("slack.com")) return "slack-huddle";
    return "custom";
  } catch {
    return "";
  }
};

export const openMeetingLink = (link) => {
  if (!link) return;
  window.open(link, "_blank", "noopener,noreferrer");
};
