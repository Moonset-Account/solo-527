import ChannelComparison from "@/components/ChannelComparison";
import ChannelHeatmap from "@/components/ChannelHeatmap";
import ChannelBubbleChart from "@/components/ChannelBubbleChart";

export default function Channels() {
  return (
    <div className="space-y-6 animate-fade-in">
      <ChannelComparison />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChannelHeatmap />
        <ChannelBubbleChart />
      </div>
    </div>
  );
}
