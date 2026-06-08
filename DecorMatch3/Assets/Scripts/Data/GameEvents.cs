using System;

namespace DecorMatch3
{
    public static class GameEvents
    {
        public static event Action<int, TileType> OnTileMatched;
        public static event Action<int> OnComboHit;
        public static event Action<int, int, int> OnLevelCompleted;
        public static event Action<int, string> OnLevelFailed;
        public static event Action<string, string> OnDecorationApplied;
        public static event Action<string, float> OnCustomerScored;
        public static event Action<int> OnCoinsChanged;
        public static event Action<int> OnStarsChanged;
        public static event Action OnBoardReset;
        public static event Action<int> OnMovesChanged;
        public static event Action<int> OnScoreChanged;
        public static event Action<GameState> OnStateChanged;

        public static void TriggerTileMatched(int count, TileType type) => OnTileMatched?.Invoke(count, type);
        public static void TriggerComboHit(int combo) => OnComboHit?.Invoke(combo);
        public static void TriggerLevelCompleted(int id, int score, int stars) => OnLevelCompleted?.Invoke(id, score, stars);
        public static void TriggerLevelFailed(int id, string reason) => OnLevelFailed?.Invoke(id, reason);
        public static void TriggerDecorationApplied(string slot, string id) => OnDecorationApplied?.Invoke(slot, id);
        public static void TriggerCustomerScored(string id, float score) => OnCustomerScored?.Invoke(id, score);
        public static void TriggerCoinsChanged(int amount) => OnCoinsChanged?.Invoke(amount);
        public static void TriggerStarsChanged(int amount) => OnStarsChanged?.Invoke(amount);
        public static void TriggerBoardReset() => OnBoardReset?.Invoke();
        public static void TriggerMovesChanged(int moves) => OnMovesChanged?.Invoke(moves);
        public static void TriggerScoreChanged(int score) => OnScoreChanged?.Invoke(score);
        public static void TriggerStateChanged(GameState state) => OnStateChanged?.Invoke(state);

        public static void ClearAll()
        {
            OnTileMatched = null;
            OnComboHit = null;
            OnLevelCompleted = null;
            OnLevelFailed = null;
            OnDecorationApplied = null;
            OnCustomerScored = null;
            OnCoinsChanged = null;
            OnStarsChanged = null;
            OnBoardReset = null;
            OnMovesChanged = null;
            OnScoreChanged = null;
            OnStateChanged = null;
        }
    }
}
