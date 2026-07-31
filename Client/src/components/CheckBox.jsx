const CheckBox = ({ label, checked, onChange }) => {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <input
        type="checkbox"
        className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500/30 focus:ring-offset-0 cursor-pointer transition-all"
        checked={checked}
        onChange={onChange}
      />
      <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">{label}</span>
    </label>
  );
};

export default CheckBox;
