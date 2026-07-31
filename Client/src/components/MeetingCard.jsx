const MeetingCard = ({ tasks, selectedTaskTitle, setSelectedTaskTitle }) => {
  return (
    <div className="space-y-4">
      {selectedTaskTitle && (
        <div className="bg-brand-50 rounded-lg p-3 border border-brand-100">
          <h3 className="text-sm font-semibold text-brand-900">{selectedTaskTitle.title}</h3>
          <p className="text-xs text-brand-700 mt-1">{selectedTaskTitle.desc}</p>
          <p className="text-[10px] text-brand-500 mt-1">
            {new Date(selectedTaskTitle.datetime).toLocaleString()}
          </p>
        </div>
      )}

      <ul className="space-y-1">
        {tasks.map((task, index) => (
          <li key={index}>
            <button
              onClick={() => setSelectedTaskTitle(task)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                selectedTaskTitle?.title === task.title
                  ? "bg-brand-600 text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}>
              <p className="text-sm font-medium">{task.title}</p>
              <p className={`text-xs mt-0.5 ${selectedTaskTitle?.title === task.title ? "text-white/70" : "text-gray-400"}`}>
                {new Date(task.datetime).toLocaleString()}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MeetingCard;
