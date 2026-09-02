const RetroButton = ({
  children,
  type = "button",
  onClick,
  variant = "primary",
  className = "",
  disabled = false,
}) => {
  const base = "inline-flex items-center justify-center font-bold tracking-tight rounded-full transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-rose-600 text-white shadow-sm hover:bg-rose-700 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
    secondary: "bg-stone-900 text-white shadow-sm hover:bg-stone-800 hover:shadow hover:scale-[1.02] active:scale-[0.98]",
    outline: "bg-white text-stone-800 border border-stone-300 shadow-sm hover:bg-stone-50 hover:border-stone-400 hover:scale-[1.01] active:scale-[0.99]",
    amber: "bg-amber-500 text-stone-950 font-extrabold shadow-sm hover:bg-amber-400 hover:scale-[1.02] active:scale-[0.98]",
  };

  const selectedVariant = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${selectedVariant} px-6 py-3 text-sm md:text-base ${className}`}
    >
      {children}
    </button>
  );
};

export default RetroButton;