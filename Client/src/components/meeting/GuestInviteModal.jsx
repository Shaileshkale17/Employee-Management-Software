import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Button from "../Button";
import InputBox from "../InputBox";
import SelectBox from "../SelectBox";
import { inviteGuestToMeeting } from "../../redux/slices/meetingSlice";
import { useDispatch } from "react-redux";
import { X } from "lucide-react";

const GuestInviteModal = ({ open, onClose, meetingId, candidates = [] }) => {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ name: "", email: "", inviteeType: "guest", candidate: "" });
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm({ name: "", email: "", inviteeType: "guest", candidate: "" });
      setErrors({});
    }
  }, [open]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const candidateOptions = (candidates || []).map((c) => ({
    value: String(c._id),
    label: `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.email,
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "A valid email is required";
    setErrors(next);
    if (Object.keys(next).length) return;
    setSending(true);
    try {
      await dispatch(inviteGuestToMeeting(meetingId, form));
      toast.success("Invitation sent — guest will receive an email with a join link");
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send invitation");
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-ink-200/60 animate-fade-in-up">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink-950">Invite guest</h2>
            <p className="mt-0.5 text-xs text-ink-400">
              They&apos;ll receive a secure link with a verification code
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-400 transition-colors hover:bg-ink-100/70 hover:text-ink-700"
            aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputBox
            label="Name"
            id="guestName"
            name="name"
            placeholder="Guest name"
            setInput={(v) => set("name", v)}
            getInput={form.name}
          />
          <InputBox
            label="Email"
            id="guestEmail"
            name="email"
            type="email"
            placeholder="guest@example.com"
            setInput={(v) => set("email", v)}
            getInput={form.email}
            error={errors.email}
          />
          <SelectBox
            label="Guest type"
            id="guestType"
            name="inviteeType"
            getInput={form.inviteeType}
            setInput={(v) => set("inviteeType", v)}
            option={[
              { value: "guest", label: "External guest" },
              { value: "candidate", label: "Candidate" },
            ]}
          />
          {form.inviteeType === "candidate" && (
            <SelectBox
              label="Candidate"
              id="guestCandidate"
              name="candidate"
              getInput={form.candidate}
              setInput={(v) => set("candidate", v)}
              option={candidateOptions}
              placeholder="Select candidate"
            />
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" label="Cancel" onClick={onClose} disabled={sending} />
            <Button type="submit" label="Send Invite" loading={sending} disabled={sending} />
          </div>
        </form>
      </div>
    </div>
  );
};

export default GuestInviteModal;
