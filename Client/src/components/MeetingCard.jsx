import React from "react";

const MeetingCard = ({ tasks, selectedTaskTitle, setSelectedTaskTitle }) => {
  return (
    <div className="w-full relative">
      {selectedTaskTitle && (
        <div className="mb-6 border-b p-4 sticky -top-5 bg-white z-10">
          <h2 className="text-lg font-bold">{selectedTaskTitle.title}</h2>
          <p className="text-sm text-gray-700 mt-2">{selectedTaskTitle.desc}</p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(selectedTaskTitle.datetime).toLocaleString()}
          </p>
        </div>
      )}

      <ul className="flex flex-col gap-4">
        {tasks.map((task, index) => (
          <li key={index}>
            <button
              onClick={() => setSelectedTaskTitle(task)}
              className={`w-full text-start px-4 py-2 rounded-md transition-all ${
                selectedTaskTitle?.title === task.title
                  ? "bg-gray-700 text-white"
                  : "text-gray-800 hover:text-white hover:bg-gray-400"
              }`}>
              <div className="font-semibold">{task.title}</div>
              <div className="text-sm text-gray-600">
                {new Date(task.datetime).toLocaleString()}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MeetingCard;
