import { Download, Zap } from "lucide-react";
import { toast } from "react-toastify";

const InfoBoxCardDow = ({ tasks }) => {
  const handleDownload = async () => {
    toast.success("Download Successful");
  };

  return (
    <div className="space-y-3">
      {tasks.map((item, index) => (
        <div
          key={index}
          className="group rounded-2xl border border-ink-200/70 bg-white p-4 shadow-card transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:shadow-card-hover">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-start gap-3 min-w-0">
              <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-1 ring-brand-500/10">
                <Zap className="h-[18px] w-[18px]" />
              </div>
              <h2 className="text-sm font-semibold text-ink-900 leading-snug">{item.title}</h2>
            </div>
            {item.taskTitle && (
              <span className="chip bg-brand-50 text-brand-700 ring-1 ring-brand-500/15 flex-shrink-0">
                {item.taskTitle}
              </span>
            )}
          </div>
          <p className="text-[13px] text-ink-600 my-2.5 leading-relaxed">{item.desc}</p>
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-400">
              {new Date(item.datetime).toLocaleString()}
            </p>
            <button
              onClick={() => handleDownload(item.taskTitle)}
              className="btn-secondary btn-sm">
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InfoBoxCardDow;
