const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-6">
    {icon && (
      <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 text-gray-300">
        {icon}
      </div>
    )}
    <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
    {description && (
      <p className="text-xs text-gray-400 mt-1 max-w-xs">{description}</p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
