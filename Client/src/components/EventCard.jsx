const EventCard = ({ tasks }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {tasks.map((item, index) => (
        <div
          key={index}
          className="bg-white rounded-xl border border-gray-100 shadow-card p-5 transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 line-clamp-2 min-h-[2.5rem]">
            {item.title}
          </h2>
          <p className="text-sm text-gray-600 mb-4 line-clamp-3 min-h-[3.75rem]">
            {item.desc}
          </p>
          <p className="text-xs text-gray-400">
            {new Date(item.createdAt || item.datetime).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
};

export default EventCard;
