import { Calendar } from "lucide-react";

const MeetingCard = ({ tasks, selectedTaskTitle, setSelectedTaskTitle }) => {
  return (
    <div className="space-y-4">
      {selectedTaskTitle && (
        <div className="relative overflow-hidden rounded-xl border border-brand-100 bg-gradient-to-br from-brand-50 to-brand-100/60 p-3.5">
          <div className="flex items-center gap-2 text-brand-700">
            <Calendar className="h-4 w-4" />
            <h3 className="text-sm font-semibold text-brand-900">{selectedTaskTitle.title}</h3>
          </div>
          <p className="text-xs text-brand-700/90 mt-1.5 leading-relaxed">{selectedTaskTitle.desc}</p>
          <p className="text-[11px] font-medium text-brand-500 mt-1.5">
            {new Date(selectedTaskTitle.datetime).toLocaleString()}
          </p>
        </div>
      )}

      <ul className="space-y-1">
        {tasks.map((task, index) => (
          <li key={index}>
            <button
              onClick={() => setSelectedTaskTitle(task)}
              className={`group w-full text-left px-3.5 py-2.5 rounded-xl transition-all duration-200 ease-smooth ${
                selectedTaskTitle?.title === task.title
                  ? "bg-brand-50 text-brand-700 font-semibold"
                  : "text-ink-600 hover:text-ink-900 hover:bg-ink-100/70"
              }`}>
              <p className="text-sm font-medium">{task.title}</p>
              <p
                className={`text-xs mt-0.5 ${
                  selectedTaskTitle?.title === task.title ? "text-white/75" : "text-ink-400"
                }`}>
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
