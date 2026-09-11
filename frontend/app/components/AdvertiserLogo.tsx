import { useState } from "react";
import { initials } from "../lib/utils";

interface AdvertiserLogoProps {
  src: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-xl",
};

export default function AdvertiserLogo({ src, name, size = "sm" }: AdvertiserLogoProps) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-zinc-200 bg-white font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 ${SIZES[size]}`}
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          className="h-full w-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}
