"use client";

import { useQuery } from '@tanstack/react-query';

/**
 * PodiumBoard — shared Hall of Fame / Wall of Shame board
 * - Next.js App Router compatible (client component)
 * - TailwindCSS styling
 * - Fetches categories from the given endpoint and renders Olympic-style podiums
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

interface PodiumResponse {
  success: boolean;
  categories: Category[];
}

export interface PodiumTheme {
  /** Gradient classes for the rank-1 medallion ring (e.g. "from-yellow-400 to-amber-500") */
  goldRing: string;
  /** Gradient classes for the rank-3 medallion ring (e.g. "from-amber-800 to-amber-900") */
  bronzeRing: string;
  /** Height classes for the spacer under the rank-1 medallion (e.g. "h-8 md:h-12 lg:h-20 xl:h-28") */
  goldSpacer: string;
}

export interface PodiumBoardProps {
  /** API endpoint returning { success, categories } */
  endpoint: string;
  /** React Query cache key */
  queryKey: string;
  /** Page title, shown in the error state and error messages */
  title: string;
  theme: PodiumTheme;
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

// ----------------------
// UI: Medallion
// ----------------------
function Medallion({ name, avatarUrl, rank, theme }: { name: string; avatarUrl?: string; rank: 1 | 2 | 3; theme: PodiumTheme }) {
  const ring = rank === 1 ? theme.goldRing : rank === 2 ? "from-zinc-300 to-zinc-400" : theme.bronzeRing;
  const bg = avatarUrl ? undefined : seedColor(name);

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

// ----------------------
// UI: Podium Column (Olympic style)
// ----------------------
function PodiumColumn({ entry, theme }: { entry: PodiumEntry; theme: PodiumTheme }) {
  const rank = entry.rank as 1 | 2 | 3;
  const isGold = rank === 1;
  const isSilver = rank === 2;

  return (
    <div className={`flex flex-col items-center ${rank === 1 ? 'p-2 md:p-4 lg:p-6 xl:p-8 mt-8 md:mt-20 lg:mt-24 xl:mt-28' : rank === 2 ? 'p-1.5 md:p-3 lg:p-4 xl:p-6 mt-8 md:mt-20 lg:mt-24 xl:mt-28' : 'p-1 md:p-2 lg:p-3 xl:p-4 mt-8 md:mt-20 lg:mt-24 xl:mt-28'} rounded-xl hover:bg-foreground/5 transition ${
      isGold ? 'order-2' : isSilver ? 'order-1' : 'order-3'
    }`}>
      <div className="relative mb-2 lg:mb-3 xl:mb-4">
        <Medallion name={entry.manager} avatarUrl={entry.avatarUrl} rank={rank} theme={theme} />
      </div>
      <div className="text-center">
        <div className={`${rank === 1 ? theme.goldSpacer : 'h-6 md:h-12 lg:h-16 xl:h-20'}`}></div>
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
function CategoryCard({ category, theme }: { category: Category; theme: PodiumTheme }) {
  return (
    <article className="group rounded-2xl border border-foreground/10 bg-gradient-to-b from-background to-foreground/[0.02] p-2 lg:p-3 xl:p-4 shadow-sm hover:shadow-md transition min-h-[280px] md:min-h-[400px] lg:min-h-[500px] xl:min-h-[600px] flex flex-col">
      <div className="text-center mb-2 lg:mb-3 xl:mb-4 bg-transparent relative z-10">
        <h3 className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-semibold leading-tight mb-2">{category.name}</h3>
        <p className="text-xs md:text-sm lg:text-base xl:text-lg text-foreground/60">{category.description}</p>
      </div>
      <div className="flex-1 overflow-visible flex items-start justify-center mt-2 md:mt-4 lg:mt-6 xl:mt-8">
        <div className="grid grid-cols-3 gap-2 md:gap-4 lg:gap-6 xl:gap-8 w-full">
          {category.entries.slice(0, 3).map((e) => (
            <PodiumColumn key={`${category.id}-${e.rank}-${e.manager}`} entry={e} theme={theme} />
          ))}
        </div>
      </div>
    </article>
  );
}

// ----------------------
// Main Board Component
// ----------------------
export default function PodiumBoard({ endpoint, queryKey, title, theme }: PodiumBoardProps) {
  const {
    data,
    isLoading,
    error: queryError
  } = useQuery<PodiumResponse>({
    queryKey: [queryKey],
    queryFn: async () => {
      const response = await fetch(endpoint)
      if (!response.ok) {
        throw new Error(`Failed to fetch ${title} data`)
      }
      return response.json()
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2
  });

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

  if (queryError || !data) {
    return (
      <div className="min-h-dvh bg-background text-foreground">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6">
            <p className="font-semibold">{title}</p>
            <p className="text-sm mt-1">{queryError?.message || 'Unknown error'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Content */}
      <section className="flex-1 px-6 py-8 overflow-y-auto">
        <div className="grid grid-cols-1 gap-6">
          {data.categories.map((c) => (
            <CategoryCard key={c.id} category={c} theme={theme} />
          ))}
        </div>

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
