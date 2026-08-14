import { LoaderCircle } from "lucide-react";

const Button = ({ label, type, loading, disabled, onClick, className, variant = "primary", size = "md" }) => {
  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
    danger: "btn-danger",
  };

  const sizes = {
    sm: "btn-sm",
    md: "btn-md",
    lg: "btn-lg",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className || ""}`}>
      {loading ? (
        <span className="inline-flex items-center justify-center gap-2">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          <span>Processing...</span>
        </span>
      ) : (
        <>{label}</>
      )}
    </button>
  );
};

export default Button;
