export function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <svg aria-hidden="true" viewBox="0 0 32 32" className="size-7 shrink-0">
        <rect width="32" height="32" rx="7" fill="#101827" stroke="#2cc4b4" strokeOpacity=".5" />
        <path d="M5 19c3 0 3-2.5 6-2.5s3 2.5 6 2.5 3-2.5 6-2.5 3 2.5 4 2.5" fill="none" stroke="#2cc4b4" strokeWidth="2" strokeLinecap="round" />
        <path d="M5 24c3 0 3-2.5 6-2.5s3 2.5 6 2.5 3-2.5 6-2.5 3 2.5 4 2.5" fill="none" stroke="#2cc4b4" strokeOpacity=".5" strokeWidth="2" strokeLinecap="round" />
        <circle cx="21" cy="10" r="3.5" fill="#f5b544" />
      </svg>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-fg">Beach Avenue!</p>
        <p className="text-[11px] tracking-wide text-subtle uppercase">Admin Console</p>
      </div>
    </div>
  );
}
