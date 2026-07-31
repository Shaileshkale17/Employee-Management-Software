const Card = ({ children, className, padding = true }) => (
  <div className={`bg-white rounded-xl shadow-card border border-gray-100 ${padding ? "p-5" : ""} ${className || ""}`}>
    {children}
  </div>
);

export default Card;
