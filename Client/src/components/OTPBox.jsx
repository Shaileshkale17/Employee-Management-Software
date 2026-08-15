const OTPBox = ({ index, otp, setOtp }) => {
  const handleChange = (e) => {
    const value = e.target.value;
    if (!/^\d*$/.test(value)) return;
    setOtp(value, index);
    if (value && index < otp.length - 1) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleBackspace = (e) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const hasValue = !!otp[index];

  return (
    <input
      id={`otp-${index}`}
      type="text"
      maxLength="1"
      value={otp[index]}
      onChange={handleChange}
      onKeyDown={handleBackspace}
      className={`w-full h-13 h-[52px] text-center text-lg font-bold rounded-xl border-2 outline-none transition-all duration-200 ease-smooth ${
        hasValue
          ? "border-brand-500 bg-brand-50/40 text-brand-700 shadow-glow-sm"
          : "border-ink-200 bg-white text-ink-900 hover:border-ink-300 dark:border-ink-700/60 dark:hover:border-ink-500"
      } focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15`}
      autoFocus={index === 0}
      aria-label={`OTP digit ${index + 1}`}
    />
  );
};

export default OTPBox;
