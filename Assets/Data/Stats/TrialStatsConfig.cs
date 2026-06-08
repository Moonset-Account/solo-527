using UnityEngine;

namespace InkMountainBridge
{
    [CreateAssetMenu(fileName = "TrialStatsConfig", menuName = "InkMountainBridge/Trial Stats Config")]
    public class TrialStatsConfig : ScriptableObject
    {
        public int maxRecordsPerSession;
        public string analyticsServerUrl;
        public float autoSubmitInterval;
        public bool recordInputEvents;
        public bool recordPhysicsEvents;
        public bool recordFailureDetails;
        public bool recordSettlementData;
    }
}
