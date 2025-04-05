import React, { useState } from "react";

const ClickInAndClickOut = () => {
  const [status, setStatus] = useState("not_clicked_in"); // "clicked_in", "on_break", "clicked_out"
  const [timestamps, setTimestamps] = useState({
    inTime: null,
    breakStart: null,
    breakEnd: null,
    outTime: null,
  });

  const handleClickIn = () => {
    setStatus("clicked_in");
    setTimestamps((prev) => ({
      ...prev,
      inTime: new Date().toLocaleTimeString(),
    }));
  };

  const handleBreakStart = () => {
    setStatus("on_break");
    setTimestamps((prev) => ({
      ...prev,
      breakStart: new Date().toLocaleTimeString(),
    }));
  };

  const handleBreakEnd = () => {
    setStatus("clicked_in");
    setTimestamps((prev) => ({
      ...prev,
      breakEnd: new Date().toLocaleTimeString(),
    }));
  };

  const handleClickOut = () => {
    setStatus("clicked_out");
    setTimestamps((prev) => ({
      ...prev,
      outTime: new Date().toLocaleTimeString(),
    }));
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-md w-full h-full flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
          🕒 Click In / Out
        </h2>
        <div className="flex flex-col gap-3 mb-4">
          {status === "not_clicked_in" && (
            <button
              onClick={handleClickIn}
              className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg">
              ✅ Click In
            </button>
          )}

          {status === "clicked_in" && (
            <>
              <button
                onClick={handleBreakStart}
                className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg">
                ☕ Take Break
              </button>
              <button
                onClick={handleClickOut}
                className="bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg">
                🔚 Click Out
              </button>
            </>
          )}

          {status === "on_break" && (
            <button
              onClick={handleBreakEnd}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg">
              🔁 Resume Work
            </button>
          )}

          {status === "clicked_out" && (
            <div className="text-center text-sm text-gray-600">
              ✅ You have successfully clicked out.
            </div>
          )}
        </div>
      </div>

      <div className="text-sm text-gray-700 border-t pt-3">
        <p>
          <strong>Click In:</strong> {timestamps.inTime || "--"}
        </p>
        <p>
          <strong>Break Start:</strong> {timestamps.breakStart || "--"}
        </p>
        <p>
          <strong>Break End:</strong> {timestamps.breakEnd || "--"}
        </p>
        <p>
          <strong>Click Out:</strong> {timestamps.outTime || "--"}
        </p>
      </div>
    </div>
  );
};

export default ClickInAndClickOut;
