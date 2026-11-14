import { Car } from "lucide-react";

export function ClassIcon({ seriesClass }: { seriesClass: string }) {
  const className = "h-4 w-4 shrink-0 text-muted-foreground";

  if (seriesClass === "Sports Car") {
    return <Car aria-hidden="true" className={className} />;
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {seriesClass === "Oval" ? (
        <>
          <rect x="2" y="5" width="20" height="14" rx="7" />
          <rect x="5" y="8" width="14" height="8" rx="4" />
        </>
      ) : seriesClass === "Formula" ? (
        <>
          <path d="M10 4h4l1 6-1 9h-4l-1-9 1-6Z" />
          <path d="M7 3h10M7 21h10M6 8h3m6 0h3M6 17h4m4 0h4" />
          <rect x="4" y="6" width="2" height="4" rx=".5" />
          <rect x="18" y="6" width="2" height="4" rx=".5" />
          <rect x="4" y="15" width="2" height="5" rx=".5" />
          <rect x="18" y="15" width="2" height="5" rx=".5" />
          <path d="M11 11h2v3h-2z" />
        </>
      ) : (
        <>
          <path d="m3 14 1-7h9l4 5 4 2v4h-3m-12 0H3v-4Zm3 4h6M5 12h12M10 7v5" />
          <circle cx="7.5" cy="17.5" r="2.5" />
          <circle cx="16.5" cy="17.5" r="2.5" />
        </>
      )}
    </svg>
  );
}
