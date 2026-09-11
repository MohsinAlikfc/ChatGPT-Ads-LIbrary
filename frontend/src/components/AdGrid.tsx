import type { Ad } from "../types";
import AdCard from "./AdCard";

export default function AdGrid({ ads }: { ads: Ad[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {ads.map((ad) => (
        <AdCard key={ad.id} ad={ad} />
      ))}
    </div>
  );
}
