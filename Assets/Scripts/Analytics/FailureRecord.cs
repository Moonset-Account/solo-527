using System;

namespace InkMountainBridge
{
    [Serializable]
    public class FailureRecord
    {
        public float timestamp;
        public int levelId;
        public string reason;
        public float caravanHealth;
        public float maxStressRatio;
        public WeatherType weatherType;
        public int elementsPlaced;
    }
}
