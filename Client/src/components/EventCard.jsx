import { Calendar } from "lucide-react";

const EventCard = ({ tasks }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {tasks.map((item, index) => {
        const raw = new Date(item.createdAt || item.datetime);
        const date = raw.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        const time = raw.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
        return (
          <div
            key={index}
            className="group relative overflow-hidden rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card transition-all duration-300 ease-smooth hover:-translate-y-1 hover:shadow-card-hover hover:border-brand-200">
            <div
              className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-brand-400 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              aria-hidden="true"
            />
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-1 ring-brand-500/10">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-ink-950 line-clamp-2 leading-snug">
                  {item.title}
                </h2>
                <p className="mt-1 text-[11px] font-medium text-ink-400">{date} · {time}</p>
              </div>
            </div>
            <p className="mt-3 text-[13px] text-ink-600 leading-relaxed line-clamp-3">
              {item.desc}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default EventCard;
