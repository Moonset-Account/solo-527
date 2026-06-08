using UnityEngine;

namespace InkMountainBridge
{
    [CreateAssetMenu(fileName = "AudioEventConfig", menuName = "InkMountainBridge/Audio Event Config")]
    public class AudioEventConfig : ScriptableObject
    {
        public string beamPlaceClip;
        public string ropePlaceClip;
        public string pierPlaceClip;
        public string bridgeSnapClip;
        public string bridgeCreakClip;
        public string caravanMoveClip;
        public string caravanFallClip;
        public string successFanfareClip;
        public string failureDrumClip;
        public string rainAmbientClip;
        public string windAmbientClip;
        public string stormAmbientClip;
        public string buttonClickClip;
        public string tutorialStepClip;
        public string budgetWarningClip;
        public string stressWarningClip;
    }
}
