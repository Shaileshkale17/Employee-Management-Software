const Heading = ({ heading, className }) => {
  return (
    <h1 className={`text-2xl font-bold text-gray-900 tracking-tight ${className || ""}`}>
      {heading}
    </h1>
  );
};

export default Heading;
