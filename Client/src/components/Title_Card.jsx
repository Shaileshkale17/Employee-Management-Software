import { Link } from "react-router-dom";

const TitleCard = ({ icon, title, description, link, status }) => {
  const isComingSoon = status === "coming_soon";
  const Wrapper = link && !isComingSoon ? Link : "div";

  return (
    <Wrapper
      to={link}
      className={`relative flex flex-col items-center text-center p-5 bg-white rounded-xl border border-gray-100 shadow-card transition-all duration-200 ${
        isComingSoon
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5"
      }`}>
      <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mb-3">
        <img src={icon} alt={title} className="w-6 h-6" />
      </div>
      <h5 className="font-semibold text-sm text-gray-900">{title}</h5>
      {description && (
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>
      )}
      {isComingSoon && (
        <span className="absolute -top-2 -right-2 text-[10px] font-medium px-2 py-0.5 bg-amber-400 text-white rounded-full">
          Coming Soon
        </span>
      )}
    </Wrapper>
  );
};

export default TitleCard;
