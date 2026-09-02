const CategoryCard = ({
  emoji,
  title,
  isActive = false,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        group relative flex min-w-[140px] sm:min-w-[160px] flex-col items-center justify-center 
        rounded-2xl p-5 sm:p-6 transition-all duration-200 cursor-pointer text-left
        ${
          isActive
            ? "bg-stone-900 text-white shadow-lg shadow-stone-900/10 scale-[1.02]"
            : "bg-white text-stone-800 border border-stone-200/80 shadow-sm hover:border-stone-300 hover:shadow-md hover:-translate-y-0.5"
        }
      `}
    >
      <span className="text-4xl sm:text-5xl transition-transform duration-200 group-hover:scale-110 mb-3 drop-shadow-sm">
        {emoji}
      </span>

      <span className="text-sm sm:text-base font-bold tracking-tight">
        {title}
      </span>

      <span className={`text-xs mt-0.5 font-medium ${isActive ? "text-stone-300" : "text-stone-400 group-hover:text-stone-600"}`}>
        Explore &rarr;
      </span>
    </button>
  );
};

export default CategoryCard;