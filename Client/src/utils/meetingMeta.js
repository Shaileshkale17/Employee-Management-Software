export const meetingMeta = (meeting) => {
  const start = new Date(meeting.start);
  const end = meeting.end ? new Date(meeting.end) : new Date(start.getTime() + (meeting.duration || 0) * 60000);
  const organizer = meeting.organizer?.name || "Organizer";
  const interviewerCount = (meeting.interviewers || []).length;
  const isInterview = Boolean(meeting.candidate);
  const candidateName = meeting.candidate
    ? `${meeting.candidate.firstName || ""} ${meeting.candidate.lastName || ""}`.trim() || meeting.candidate.email || "Candidate"
    : "";
  return { start, end, organizer, interviewerCount, isInterview, candidateName };
};
