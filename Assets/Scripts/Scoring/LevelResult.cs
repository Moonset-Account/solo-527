using UnityEngine;

namespace InkMountainBridge
{
    [System.Serializable]
    public class LevelResult
    {
        public int levelId;
        public bool completed;
        public int score;
        public float completionTime;
        public int materialsUsed;
        public int totalBudget;
        public float maxStressRatio;
        public string failureReason;
        public WeatherType weatherType;
        public float caravanHealthRemaining;
        public string timestamp;
    }
}
