const OTPBox = ({ index, otp, setOtp }) => {
  const handleChange = (e) => {
    const value = e.target.value;
    if (!/^\d*$/.test(value)) return; // Ensure only numbers are entered

    setOtp(value, index); // Directly call the passed function

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
      className="w-12 h-12 text-center text-lg border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
};

export default OTPBox;
