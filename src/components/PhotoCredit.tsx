import { ExternalLink } from "lucide-react";
import type { PhotoCredit as PhotoCreditType } from "@/data/debateData";

interface PhotoCreditProps {
  credit: PhotoCreditType;
  personaName: string;
}

export function PhotoCredit({ credit, personaName }: PhotoCreditProps) {
  return (
    <div className="text-xs text-slate-400 mt-2 space-y-1">
      <div className="flex items-center gap-1">
        <span className="font-medium">Photo:</span>
        <span>{credit.photographer}, {credit.date}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-medium">Source:</span>
        <a
          href={credit.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-slate-300 underline inline-flex items-center gap-1"
        >
          {credit.source}
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <div className="text-slate-500">{credit.license}</div>
    </div>
  );
}
