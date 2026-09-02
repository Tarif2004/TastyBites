const SectionTitle = ({
  eyebrow,
  title,
  description,
  align = "left",
}) => {
  const alignment = align === "center" ? "text-center items-center mx-auto" : "text-left items-start";

  return (
    <div className={`mb-10 flex flex-col ${alignment}`}>
      {eyebrow && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200/60 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
          {eyebrow}
        </span>
      )}

      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-stone-900 leading-tight">
        {title}
      </h2>

      {description && (
        <p className="mt-3.5 max-w-2xl text-base sm:text-lg text-stone-600 leading-relaxed font-normal">
          {description}
        </p>
      )}
    </div>
  );
};

export default SectionTitle;