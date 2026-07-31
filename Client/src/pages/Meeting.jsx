import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import SideNavbar from "../components/SideNavber";
import HRSideNavber from "../components/HRSideNavber";
import { api } from "../utils/api";
import Button from "../components/Button";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import Heading from "../components/Heading";
import InputBox from "../components/InputBox";
import TextArea from "../components/TextArea";

const HR_ROLES = ["Super Admin", "Company Admin", "HR", "HR Manager", "Recruiter"];

const Meeting = () => {
  const { user } = useSelector((state) => state.auth);
  const role = user?.user?.role;
  const isHR = HR_ROLES.includes(role);

  const SideNav = (r) => (HR_ROLES.includes(r) ? <HRSideNavber /> : <SideNavbar />);

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", start: "", end: "", link: "" });

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/calendar/upcoming");
      setMeetings(res.data.data || []);
    } catch {
      toast.error("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const setField = (key) => (value) => setForm((p) => ({ ...p, [key]: value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.start || !form.end) {
      toast.error("Please fill in title, start and end");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/calendar/create", {
        title: form.title,
        description: form.description,
        start: new Date(form.start).toISOString(),
        end: new Date(form.end).toISOString(),
        type: "meeting",
        link: form.link,
        attendees: [],
      });
      toast.success("Meeting created");
      setForm({ title: "", description: "", start: "", end: "", link: "" });
      setShowForm(false);
      fetchMeetings();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create meeting");
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = (meeting) => {
    if (meeting.link) {
      window.open(meeting.link, "_blank", "noopener,noreferrer");
    } else {
      toast("No meeting link available");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/calendar/delete/${id}`);
      toast.success("Meeting deleted");
      fetchMeetings();
    } catch {
      toast.error("Failed to delete meeting");
    }
  };

  return (
    <div className="flex">
      {SideNav(role)}
      <div className="flex-1 min-h-[calc(100vh-4rem)] bg-surface-100 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Heading heading="Meetings" />
            {isHR && (
              <Button
                variant="secondary"
                label={showForm ? "Cancel" : "Create Meeting"}
                onClick={() => setShowForm((s) => !s)}
              />
            )}
          </div>

          {isHR && showForm && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Meeting</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <InputBox
                  label="Title"
                  id="meetingTitle"
                  name="title"
                  placeholder="Meeting title"
                  setInput={setField("title")}
                  getInput={form.title}
                />
                <TextArea
                  label="Description"
                  id="meetingDescription"
                  name="description"
                  placeholder="Meeting description"
                  value={form.description}
                  onChange={(e) => setField("description")(e.target.value)}
                  rows={3}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputBox
                    label="Start"
                    id="meetingStart"
                    name="start"
                    type="datetime-local"
                    setInput={setField("start")}
                    getInput={form.start}
                  />
                  <InputBox
                    label="End"
                    id="meetingEnd"
                    name="end"
                    type="datetime-local"
                    setInput={setField("end")}
                    getInput={form.end}
                  />
                </div>
                <InputBox
                  label="Link"
                  id="meetingLink"
                  name="link"
                  placeholder="https://meet.example.com/abc"
                  setInput={setField("link")}
                  getInput={form.link}
                />
                <div className="flex justify-end">
                  <Button type="submit" label="Create Meeting" loading={submitting} disabled={submitting} />
                </div>
              </form>
            </Card>
          )}

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
                  <div className="skeleton h-5 w-1/3 mb-3" />
                  <div className="skeleton h-4 w-full mb-2" />
                  <div className="skeleton h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : meetings.length === 0 ? (
            <Card>
              <EmptyState
                title="No upcoming meetings"
                description="Meetings you create or are invited to will appear here."
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {meetings.map((meeting) => (
                <Card key={meeting._id}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
                      {meeting.description && (
                        <p className="text-sm text-gray-500 mt-1">{meeting.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(meeting.start).toLocaleString()}
                        {meeting.end ? ` — ${new Date(meeting.end).toLocaleString()}` : ""}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {(meeting.attendees || []).length} attendee(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button size="sm" label="Join" onClick={() => handleJoin(meeting)} />
                      {isHR && (
                        <Button size="sm" variant="danger" label="Delete" onClick={() => handleDelete(meeting._id)} />
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Meeting;
