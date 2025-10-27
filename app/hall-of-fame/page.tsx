"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery } from '@tanstack/react-query';
import { Crown, Skull, Search, Info, Trophy, Filter } from "lucide-react";

/**
 * Hall of Fame — Drop‑in Page
 * - Next.js App Router compatible (client component)
 * - TailwindCSS styling
 * - Includes API integration with existing endpoints
 * - Maintains existing color scheme and stat content
 */

// ----------------------
// Types
// ----------------------
export interface PodiumEntry {
  rank: number;
  manager: string;
  value: number | string;
  description: string;
  season?: string;
  avatarUrl?: string; // optional circular medallion
}

export interface Category {
  id: string;
  name: string;
  description: string;
  type: "all-time" | "single-season";
  entries: PodiumEntry[];
}

interface HallOfFameResponse {
  success: boolean;
  categories: Category[];
}

// ----------------------
// Helpers
// ----------------------
function seedColor(name: string) {
  // deterministic color seed for avatar backgrounds
  const sum = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hue = sum % 360;
  return `hsl(${hue} 70% 45%)`;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function computeTopManager(categories: Category[]) {
  const counts = new Map<string, number>();
  categories.forEach((c) => {
    c.entries.forEach((e) => {
      if (e.rank === 1) counts.set(e.manager, (counts.get(e.manager) || 0) + 1);
    });
  });
  let topName = "—";
  let topCount = 0;
  for (const [name, count] of counts) {
    if (count > topCount) {
      topCount = count;
      topName = name;
    }
  }
  return { name: topName, count: topCount };
}

// ----------------------
// UI: Atoms
// ----------------------
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium text-foreground/90 border-foreground/15 bg-foreground/5">
      {children}
    </span>
  );
}

function Medallion({ name, avatarUrl, rank }: { name: string; avatarUrl?: string; rank: 1 | 2 | 3 }) {
  const ring = rank === 1 ? "from-yellow-400 to-amber-500" : rank === 2 ? "from-zinc-300 to-zinc-400" : "from-amber-800 to-amber-900";
  const bg = avatarUrl ? undefined : seedColor(name);
  
  // Medal sizes: Gold (same), Silver (15% smaller), Bronze (30% smaller)
  const medalSizes = rank === 1 
    ? "size-32 lg:size-64 xl:size-80" 
    : rank === 2 
    ? "size-28 lg:size-54 xl:size-68" 
    : "size-24 lg:size-45 xl:size-56";
  
  // Background circle sizes - smaller than medal sizes
  const backgroundSizes = rank === 1 
    ? "size-20 md:size-28 lg:size-48 xl:size-60" 
    : rank === 2 
    ? "size-18 md:size-24 lg:size-40 xl:size-50" 
    : "size-16 md:size-20 lg:size-32 xl:size-40";
  
  const textSizes = rank === 1 
    ? "text-lg md:text-2xl lg:text-6xl xl:text-8xl" 
    : rank === 2 
    ? "text-base md:text-xl lg:text-5xl xl:text-7xl" 
    : "text-sm md:text-lg lg:text-4xl xl:text-6xl";
  
  return (
    <div className="relative">
      <div className={`absolute -inset-1 lg:-inset-2 xl:-inset-3 rounded-full bg-gradient-to-br ${ring} blur-sm opacity-60`} aria-hidden />
      <div className={`relative ${backgroundSizes} rounded-full ring-2 ring-background grid place-items-center`} style={{ background: avatarUrl ? undefined : bg }}>
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={avatarUrl} 
            alt={name} 
            className={`object-cover ${name.toLowerCase() === 'blake' || name.toLowerCase() === 'toph' || name.toLowerCase() === 'geoff' || name.toLowerCase() === 'inglis' ? 'scale-225' : 'scale-250'}`} 
            style={{ 
              width: '100%', 
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center'
            }} 
          />
        ) : (
          <span className={`font-semibold text-white drop-shadow-sm ${textSizes}`}>{initials(name)}</span>
        )}
      </div>
    </div>
  );
}

function Pill({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm transition border ${
        active ? "bg-foreground text-background border-foreground" : "bg-background text-foreground/80 border-foreground/15 hover:bg-foreground/5"
      }`}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

// ----------------------
// UI: Podium Column (Olympic style)
// ----------------------
function PodiumColumn({ entry, position }: { entry: PodiumEntry; position: number }) {
  const rank = entry.rank as 1 | 2 | 3;
  const isGold = rank === 1;
  const isSilver = rank === 2;
  const isBronze = rank === 3;
  
  // Olympic podium order: Silver (left), Gold (center), Bronze (right)
  const podiumOrder = [2, 1, 3]; // Silver, Gold, Bronze
  const actualRank = podiumOrder[position];
  const isCorrectPosition = rank === actualRank;
  
  return (
    <div className={`flex flex-col items-center ${rank === 1 ? 'p-2 md:p-4 lg:p-6 xl:p-8 mt-8 md:mt-20 lg:mt-24 xl:mt-28' : rank === 2 ? 'p-1.5 md:p-3 lg:p-4 xl:p-6 mt-8 md:mt-20 lg:mt-24 xl:mt-28' : 'p-1 md:p-2 lg:p-3 xl:p-4 mt-8 md:mt-20 lg:mt-24 xl:mt-28'} rounded-xl hover:bg-foreground/5 transition ${
      isGold ? 'order-2' : isSilver ? 'order-1' : 'order-3'
    }`}>
      <div className="relative mb-2 lg:mb-3 xl:mb-4">
        <Medallion name={entry.manager} avatarUrl={entry.avatarUrl} rank={rank} />
      </div>
      <div className="text-center">
        <div className={`${rank === 1 ? 'h-8 md:h-12 lg:h-20 xl:h-28' : rank === 2 ? 'h-6 md:h-12 lg:h-16 xl:h-20' : 'h-6 md:h-12 lg:h-16 xl:h-20'}`}></div>
        <p className="text-xs md:text-sm lg:text-lg xl:text-2xl text-foreground/70 whitespace-pre-line mb-3 md:mb-6 lg:mb-8 xl:mb-10">
          {entry.description}{entry.season ? ` • ${entry.season}` : ''}
        </p>
      </div>
    </div>
  );
}

// ----------------------
// UI: Category Card
// ----------------------
function CategoryCard({ category }: { category: Category }) {
  return (
    <article className="group rounded-2xl border border-foreground/10 bg-gradient-to-b from-background to-foreground/[0.02] p-2 lg:p-3 xl:p-4 shadow-sm hover:shadow-md transition min-h-[280px] md:min-h-[400px] lg:min-h-[500px] xl:min-h-[600px] flex flex-col">
      <div className="text-center mb-2 lg:mb-3 xl:mb-4 bg-transparent relative z-10">
        <h3 className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-semibold leading-tight mb-2">{category.name}</h3>
        <p className="text-xs md:text-sm lg:text-base xl:text-lg text-foreground/60">{category.description}</p>
      </div>
      <div className="flex-1 overflow-visible flex items-start justify-center mt-2 md:mt-4 lg:mt-6 xl:mt-8">
        <div className="grid grid-cols-3 gap-2 md:gap-4 lg:gap-6 xl:gap-8 w-full">
          {category.entries.slice(0, 3).map((e, index) => (
            <PodiumColumn key={`${category.id}-${e.rank}-${e.manager}`} entry={e} position={index} />
          ))}
        </div>
      </div>
    </article>
  );
}

// ----------------------
// UI: Spotlight Card
// ----------------------
function Spotlight({ icon, label, name, count }: { icon: React.ReactNode; label: string; name: string; count: number }) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-gradient-to-br from-foreground/[0.03] to-transparent p-4">
      <div className="flex items-center gap-3">
        <div className="size-10 grid place-items-center rounded-xl bg-foreground/5 border border-foreground/10">{icon}</div>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wide text-foreground/60">{label}</p>
          <p className="text-lg font-semibold leading-tight">{name || "—"}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-foreground/60">1st‑place finishes</p>
          <p className="text-2xl font-bold tabular-nums">{count}</p>
        </div>
      </div>
    </div>
  );
}

// ----------------------
// UI: Sticky Filters
// ----------------------
function Filters({
  scope,
  setScope,
  query,
  setQuery,
}: {
  scope: "all-time" | "single-season" | "all";
  setScope: (s: "all-time" | "single-season" | "all") => void;
  query: string;
  setQuery: (q: string) => void;
}) {
  return (
    <div className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-background/60 bg-background/90 border-b border-foreground/10">
      <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full">
            <Crown className="h-5 w-5 text-white" />
            <span className="text-lg font-black text-white">Hall of Fame</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2">
            <Pill active={scope === "all"} onClick={() => setScope("all")}>All</Pill>
            <Pill active={scope === "all-time"} onClick={() => setScope("all-time")}>All‑Time</Pill>
            <Pill active={scope === "single-season"} onClick={() => setScope("single-season")}>Single‑Season</Pill>
          </div>
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-foreground/50" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories or managers…"
              className="w-full rounded-xl border border-foreground/15 bg-background pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/30"
              aria-label="Search categories or managers"
            />
          </div>
          <button className="md:hidden inline-flex items-center gap-2 rounded-xl border border-foreground/15 px-3 py-2 text-sm"><Filter className="size-4" /> Filters</button>
        </div>
      </div>
    </div>
  );
}

// ----------------------
// Main Page Component
// ----------------------
export default function HallOfFamePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { 
    data, 
    isLoading, 
    error: queryError, 
    refetch,
    dataUpdatedAt 
  } = useQuery<HallOfFameResponse>({
    queryKey: ['hall-of-fame'],
    queryFn: async () => {
      const response = await fetch('/api/stats/hall-of-fame')
      if (!response.ok) {
        throw new Error('Failed to fetch Hall of Fame data')
      }
      return response.json()
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2
  });

  // Handle loading and error states
  useEffect(() => {
    setLoading(isLoading);
    setError(queryError?.message || null);
  }, [isLoading, queryError]);

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-background text-foreground">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 rounded-2xl border border-foreground/10 bg-foreground/5 animate-pulse" />
            ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-dvh bg-background text-foreground">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6">
            <p className="font-semibold">Hall of Fame</p>
            <p className="text-sm mt-1">{error || 'Unknown error'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Content */}
      <section className="flex-1 px-6 py-8 overflow-y-auto">
        {loading && (
          <div className="grid grid-cols-1 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 rounded-2xl border border-foreground/10 bg-foreground/5 animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6">
            <p className="font-semibold">Hall of Fame</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 gap-6">
            {data.categories.map((c) => (
              <CategoryCard key={c.id} category={c} />
            ))}
          </div>
        )}

        {/* Footer note for partial data */}
        {data.categories.some(c => c.entries.length === 0) && (
          <p className="mt-8 text-center text-sm text-foreground/60">
            Some categories are still being calculated. Check back soon!
          </p>
        )}
      </section>
    </div>
  );
}
