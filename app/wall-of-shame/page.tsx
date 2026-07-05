import PodiumBoard from "../components/PodiumBoard";

export default function WallOfShamePage() {
  return (
    <PodiumBoard
      endpoint="/api/stats/wall-of-shame"
      queryKey="wall-of-shame"
      title="Wall of Shame"
      theme={{
        goldRing: "from-red-400 to-rose-500",
        bronzeRing: "from-red-800 to-red-900",
        goldSpacer: "h-12 md:h-12 lg:h-20 xl:h-28",
      }}
    />
  );
}
