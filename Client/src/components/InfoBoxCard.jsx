const InfoBoxCard = ({ tasks }) => {
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
          <p className="text-sm text-gray-600 mb-2">{item.desc}</p>
          <p className="text-xs text-gray-400">
            {new Date(item.datetime).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
};

export default InfoBoxCard;
