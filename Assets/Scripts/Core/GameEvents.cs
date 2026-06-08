using UnityEngine;

namespace InkMountainBridge
{
    public static class GameEvents
    {
        public static event System.Action<LevelConfig> OnLevelStarted;
        public static event System.Action<GameState> OnPhaseChanged;
        public static event System.Action<int> OnLevelCompleted;
        public static event System.Action<string> OnLevelFailed;
        public static event System.Action<Vector2> OnBridgeCollapsed;
        public static event System.Action OnCaravanArrived;
        public static event System.Action<string> OnCaravanFailed;
        public static event System.Action<WeatherType> OnWeatherChanged;
        public static event System.Action<MaterialType, int> OnMaterialUsed;
        public static event System.Action OnBudgetExceeded;
        public static event System.Action<InputRecord> OnInputRecorded;
        public static event System.Action<float> OnStressWarning;
    }
}
