import { useEffect } from "react";

interface PageMeta {
  title: string;
  description: string;
}

export function usePageMeta({ title, description }: PageMeta) {
  useEffect(() => {
    const suffix = " | Roundtaible";
    document.title = title.includes("Roundtaible") ? title : title + suffix;

    let meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", description);
    }
  }, [title, description]);
}
