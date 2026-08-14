import { SquareCheck, Clock } from "lucide-react";

const InfoBoxCard = ({ tasks }) => {
  return (
    <div className="space-y-3">
      {tasks.map((item, index) => (
        <div
          key={index}
          className="group rounded-2xl border border-ink-200/70 bg-white p-4 shadow-card transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:shadow-card-hover">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3 min-w-0">
              <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-1 ring-brand-500/10">
                <SquareCheck className="h-4.5 w-4.5 h-[18px] w-[18px]" />
              </div>
              <h2 className="text-sm font-semibold text-ink-900 leading-snug">{item.title}</h2>
            </div>
            {item.taskTitle && (
              <span className="chip bg-brand-50 text-brand-700 ring-1 ring-brand-500/15 flex-shrink-0">
                {item.taskTitle}
              </span>
            )}
          </div>
          <p className="text-[13px] text-ink-600 mt-2 leading-relaxed">{item.desc}</p>
          <p className="text-xs text-ink-400 mt-2 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {new Date(item.datetime).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
};

export default InfoBoxCard;
