using UnityEngine;

namespace InkMountainBridge
{
    public static class GameEvents
    {
        public static System.Action<LevelConfig> OnLevelStarted;
        public static System.Action<GameState> OnPhaseChanged;
        public static System.Action<int> OnLevelCompleted;
        public static System.Action<string> OnLevelFailed;
        public static System.Action<Vector2> OnBridgeCollapsed;
        public static System.Action OnCaravanArrived;
        public static System.Action<string> OnCaravanFailed;
        public static System.Action<WeatherType> OnWeatherChanged;
        public static System.Action<MaterialType, int> OnMaterialUsed;
        public static System.Action OnBudgetExceeded;
        public static System.Action<InputRecord> OnInputRecorded;
        public static System.Action<float> OnStressWarning;

        public static void RaiseLevelStarted(LevelConfig config) { OnLevelStarted?.Invoke(config); }
        public static void RaisePhaseChanged(GameState state) { OnPhaseChanged?.Invoke(state); }
        public static void RaiseLevelCompleted(int levelId) { OnLevelCompleted?.Invoke(levelId); }
        public static void RaiseLevelFailed(string reason) { OnLevelFailed?.Invoke(reason); }
        public static void RaiseBridgeCollapsed(Vector2 position) { OnBridgeCollapsed?.Invoke(position); }
        public static void RaiseCaravanArrived() { OnCaravanArrived?.Invoke(); }
        public static void RaiseCaravanFailed(string cause) { OnCaravanFailed?.Invoke(cause); }
        public static void RaiseWeatherChanged(WeatherType type) { OnWeatherChanged?.Invoke(type); }
        public static void RaiseMaterialUsed(MaterialType type, int remaining) { OnMaterialUsed?.Invoke(type, remaining); }
        public static void RaiseBudgetExceeded() { OnBudgetExceeded?.Invoke(); }
        public static void RaiseInputRecorded(InputRecord record) { OnInputRecorded?.Invoke(record); }
        public static void RaiseStressWarning(float stressLevel) { OnStressWarning?.Invoke(stressLevel); }

        public static void ClearAll()
        {
            OnLevelStarted = null;
            OnPhaseChanged = null;
            OnLevelCompleted = null;
            OnLevelFailed = null;
            OnBridgeCollapsed = null;
            OnCaravanArrived = null;
            OnCaravanFailed = null;
            OnWeatherChanged = null;
            OnMaterialUsed = null;
            OnBudgetExceeded = null;
            OnInputRecorded = null;
            OnStressWarning = null;
        }
    }
}
