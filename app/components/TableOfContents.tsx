"use client";

import { useEffect, useState } from "react";

export type TocEntry = { id: string; label: string };

export default function TableOfContents({
  entries,
  title = "Contents",
}: {
  entries: TocEntry[];
  title?: string;
}) {
  const [active, setActive] = useState<string | null>(entries[0]?.id ?? null);

  useEffect(() => {
    const els = entries
      .map((e) => document.getElementById(e.id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const visible = new Map<string, number>();
    const obs = new IntersectionObserver(
      (records) => {
        for (const r of records) {
          if (r.isIntersecting) {
            visible.set(r.target.id, r.intersectionRatio);
          } else {
            visible.delete(r.target.id);
          }
        }
        if (visible.size > 0) {
          let topId = entries[0].id;
          let topY = Infinity;
          for (const id of visible.keys()) {
            const el = document.getElementById(id);
            if (!el) continue;
            const y = el.getBoundingClientRect().top;
            if (y < topY) {
              topY = y;
              topId = id;
            }
          }
          setActive(topId);
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    for (const el of els) obs.observe(el);
    return () => obs.disconnect();
  }, [entries]);

  return (
    <nav
      aria-label={title}
      className="toc hidden xl:block fixed left-6 top-24 w-56 text-[0.78rem] leading-snug"
    >
      <p className="dateline mb-3 text-[0.7rem]">{title}</p>
      <ol className="space-y-1.5">
        {entries.map((e) => {
          const isActive = e.id === active;
          return (
            <li key={e.id}>
              <a
                href={`#${e.id}`}
                className={
                  "toc-link block border-l-2 pl-3 py-0.5 transition-colors " +
                  (isActive
                    ? "border-[color:var(--accent)] text-[color:var(--ink)]"
                    : "border-[color:var(--rule)] text-[color:var(--ink-muted)] hover:text-[color:var(--ink-soft)]")
                }
              >
                {e.label}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
