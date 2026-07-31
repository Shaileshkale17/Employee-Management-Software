const OTPBox = ({ index, otp, setOtp }) => {
  const handleChange = (e) => {
    const value = e.target.value;
    if (!/^\d*$/.test(value)) return;
    setOtp(value, index);
    if (value && index < otp.length - 1) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleBackspace = (e) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  return (
    <input
      id={`otp-${index}`}
      type="text"
      maxLength="1"
      value={otp[index]}
      onChange={handleChange}
      onKeyDown={handleBackspace}
      className="w-12 h-14 text-center text-lg font-semibold border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all duration-200"
      autoFocus={index === 0}
      aria-label={`OTP digit ${index + 1}`}
    />
  );
};

export default OTPBox;
