import React from "react";

const Unauthorized = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center animate-bounce">
        <h1 className="text-6xl font-bold text-red-500 mb-4">401</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
          Unauthorized Access
        </h2>
        <p className="text-gray-500 mb-6">
          You don't have permission to view this page.
        </p>
        <button
          onClick={() => (window.location.href = "/overview")}
          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-300">
          Go Home
        </button>
      </div>
    </div>
  );
};
export default Unauthorized;
