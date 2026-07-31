import Download from "../assets/material-symbols-light_download.svg";
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
          className="bg-white rounded-xl border border-gray-100 shadow-card p-5 transition-all duration-200 hover:shadow-card-hover">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h2 className="text-sm font-semibold text-gray-900">{item.title}</h2>
            {item.taskTitle && (
              <span className="text-[10px] font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full flex-shrink-0">
                {item.taskTitle}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-3">{item.desc}</p>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {new Date(item.datetime).toLocaleString()}
            </p>
            <button
              onClick={() => handleDownload(item.taskTitle)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
              <img className="w-4 h-4" src={Download} alt="" />
              Download
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InfoBoxCardDow;
