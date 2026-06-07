import WorkloadDistribution from "@/components/WorkloadDistribution";
import WorkloadTimeline from "@/components/WorkloadTimeline";
import FeedbackCompletion from "@/components/FeedbackCompletion";

export default function Workload() {
  return (
    <div className="space-y-6 animate-fade-in">
      <WorkloadDistribution />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <WorkloadTimeline />
        <FeedbackCompletion />
      </div>
    </div>
  );
}
