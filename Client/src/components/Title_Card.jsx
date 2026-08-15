import { Link } from "react-router-dom";

const TitleCard = ({ icon, title, description, link, status }) => {
  const isComingSoon = status === "coming_soon";
  const Wrapper = link && !isComingSoon ? Link : "div";

  return (
    <Wrapper
      to={link}
      className={`group relative flex flex-col items-center text-center p-5 rounded-2xl border transition-all duration-300 ease-smooth ${
        isComingSoon
          ? "cursor-not-allowed border-dashed border-ink-200 bg-ink-50/60 opacity-70"
          : "cursor-pointer bg-white border-ink-200/70 shadow-card hover:-translate-y-1 hover:shadow-card-hover hover:border-brand-200"
      }`}>
        <div className={`mb-3.5 flex h-12 w-12 items-center justify-center rounded-xl ring-1 transition-all duration-300 ease-smooth group-hover:scale-105 ${isComingSoon ? "bg-ink-100 text-ink-400 ring-ink-500/10" : "bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-brand-500/10 group-hover:from-brand-600 group-hover:to-brand-700 group-hover:text-white group-hover:shadow-glow-sm"}`}>
          {typeof icon === "string" ? (
            <img src={icon} alt="" aria-hidden="true" className="h-6 w-6" />
          ) : (
            icon
          )}
        </div>
      <h5 className="font-semibold text-sm text-ink-900">{title}</h5>
      {description && (
        <p className="text-xs text-ink-500 mt-1 leading-relaxed line-clamp-2">{description}</p>
      )}
      {isComingSoon && (
        <span className="chip mt-3 bg-amber-100 text-amber-700 ring-1 ring-amber-200">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Coming Soon
        </span>
      )}
    </Wrapper>
  );
};

export default TitleCard;
