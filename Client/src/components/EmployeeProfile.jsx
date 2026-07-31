const EmployeeProfile = ({ index, image, name, role, email, phone, status }) => {
  return (
    <div
      key={index}
      className={`bg-white rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-card-hover ${
        status === "Active" ? "border-green-200 hover:border-green-300" : "border-red-200 hover:border-red-300"
      }`}>
      <img src={image} alt={name} className="w-full h-36 object-cover rounded-lg mb-3 bg-gray-50" />
      <div className="flex items-start justify-between mb-1">
        <h2 className="text-sm font-semibold text-gray-900 truncate">{name}</h2>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
          status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}>
          {status}
        </span>
      </div>
      <p className="text-xs font-medium text-gray-500 mb-1">{role}</p>
      <p className="text-xs text-gray-400 truncate">{email}</p>
      <p className="text-xs text-gray-400">{phone}</p>
    </div>
  );
};

export default EmployeeProfile;
