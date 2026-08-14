import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "../components/Button";
import InputBox from "../components/InputBox";
import Card from "../components/Card";
import { getPublicInvitation, verifyGuestOtp, resendGuestOtp } from "../utils/meetingApi";
import { formatDateTime } from "../utils/dateUtils";
import { Check, Video, Clock, User, Info } from "lucide-react";

const Step = ({ step, active, done, label }) => (
  <div className="flex items-center gap-2">
    <span
      className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
        done
          ? "bg-emerald-500 text-white"
          : active
            ? "bg-brand-600 text-white"
            : "bg-ink-200 text-ink-500"
      }`}>
      {done ? (
        <Check className="h-3 w-3" strokeWidth={3} />
      ) : (
        step
      )}
    </span>
    <span className={`text-xs font-medium ${active || done ? "text-ink-800" : "text-ink-400"}`}>{label}</span>
  </div>
);

const GuestJoin = () => {
  const { meetingId } = useParams();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!inviteToken) {
      toast.error("Invalid invitation link");
      setLoading(false);
      return;
    }
    getPublicInvitation(inviteToken)
      .then((data) => {
        setMeeting(data.meeting);
        setInvitation(data.invitation);
        setEmail(data.invitation?.email || "");
      })
      .catch((err) => {
        toast.error(err?.response?.data?.message || "Failed to load invitation");
      })
      .finally(() => setLoading(false));
  }, [inviteToken]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email || !otp) {
      toast.error("Enter your email and the verification code");
      return;
    }
    setVerifying(true);
    try {
      const data = await verifyGuestOtp({ token: inviteToken, email, otp });
      const guestToken = data.guestToken;
      if (guestToken) {
        try {
          sessionStorage.setItem("meetingGuestToken", guestToken);
          sessionStorage.setItem("meetingGuestEmail", data.participant?.email || email);
          sessionStorage.setItem("meetingGuestName", data.participant?.name || "");
          sessionStorage.setItem("meetingGuestTitle", meeting?.title || "");
        } catch {
          /* sessionStorage may be unavailable */
        }
        setVerified(true);
        toast.success("Identity verified — redirecting to the meeting…");
        setTimeout(() => navigate(`/join/${meetingId}/room`), 1200);
      } else {
        setVerified(true);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendGuestOtp(inviteToken);
      setCountdown(30);
      toast.success("A new verification code has been sent");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-mesh-light p-4">
      <div className="w-full max-w-md space-y-5 animate-fade-in-up">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow-sm">
            <Video className="h-7 w-7" strokeWidth={1.8} />
          </div>
          <h1 className="text-xl font-bold text-ink-950">You&apos;re invited to a meeting</h1>
          <p className="mt-1 text-sm text-ink-500">Verify your identity to join the room</p>
        </div>

        {loading ? (
          <Card>
            <div className="space-y-3">
              <div className="skeleton h-6 w-2/3" />
              <div className="skeleton h-4 w-1/2" />
              <div className="skeleton h-12 w-full rounded-xl" />
            </div>
          </Card>
        ) : meeting ? (
          <>
            <Card>
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{meeting.meetingId}</p>
                <h2 className="mt-1 text-lg font-semibold text-ink-950">{meeting.title}</h2>
                {meeting.description && <p className="mt-1 text-sm text-ink-500 line-clamp-2">{meeting.description}</p>}
              </div>
              <div className="space-y-2 text-sm text-ink-600">
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-ink-400" />
                  {meeting.start ? formatDateTime(meeting.start) : "Starts immediately"}
                </p>
                {meeting.organizer && (
                  <p className="flex items-center gap-2">
                    <User className="h-4 w-4 text-ink-400" />
                    Hosted by {meeting.organizer.name}
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-ink-400" />
                  {meeting.duration ? `${meeting.duration} minutes` : "Duration not set"}
                </p>
              </div>
            </Card>

            {verified ? (
              <Card className="border-emerald-200 bg-emerald-50/40">
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
                    <Check className="h-6 w-6" strokeWidth={2.5} />
                  </span>
                  <p className="text-sm font-semibold text-emerald-700">Verified!</p>
                  <p className="text-xs text-emerald-600">Joining the meeting room…</p>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex gap-3">
                    <Step step={1} active done={false} label="Invite" />
                    <Step step={2} active done={false} label="Verify" />
                    <Step step={3} active={false} done={false} label="Join" />
                  </div>
                </div>
                <form onSubmit={handleVerify} className="space-y-4">
                  <InputBox
                    label="Email"
                    id="guestEmail"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    setInput={setEmail}
                    getInput={email}
                    hint={invitation?.email ? "The code was sent to this address" : "Use the email on the invitation"}
                  />
                  <InputBox
                    label="Verification code"
                    id="guestOtp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit code"
                    setInput={setOtp}
                    getInput={otp}
                  />
                  <Button type="submit" label="Verify & Join" loading={verifying} disabled={verifying} className="w-full" />
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending || countdown > 0}
                      className="text-xs font-medium text-brand-600 transition-colors hover:text-brand-700 disabled:text-ink-400">
                      {countdown > 0 ? `Resend code in ${countdown}s` : resending ? "Sending…" : "Didn't get the code? Resend"}
                    </button>
                  </div>
                </form>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <p className="text-center text-sm text-ink-500">This invitation could not be loaded or has expired.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GuestJoin;
