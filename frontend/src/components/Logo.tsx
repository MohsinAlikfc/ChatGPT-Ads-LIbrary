import { Link } from "react-router-dom";

export default function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 font-bold tracking-tight">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M6 17V7l9 5-9 5z" />
        </svg>
      </span>
      <span className="text-base sm:text-lg">
        ChatGPT Ads <span className="text-brand-500">Library</span>
      </span>
    </Link>
  );
}
