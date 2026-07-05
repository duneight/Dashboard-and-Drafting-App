import PodiumBoard from "../components/PodiumBoard";

export default function HallOfFamePage() {
  return (
    <PodiumBoard
      endpoint="/api/stats/hall-of-fame"
      queryKey="hall-of-fame"
      title="Hall of Fame"
      theme={{
        goldRing: "from-yellow-400 to-amber-500",
        bronzeRing: "from-amber-800 to-amber-900",
        goldSpacer: "h-8 md:h-12 lg:h-20 xl:h-28",
      }}
    />
  );
}
