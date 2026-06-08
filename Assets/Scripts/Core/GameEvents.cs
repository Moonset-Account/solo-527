using UnityEngine;

public static class GameEvents
{
    public struct LevelStartedEvent
    {
        public int LevelIndex;
    }

    public struct LevelCompletedEvent
    {
        public int LevelIndex;
        public int Score;
        public int Stars;
    }

    public struct LevelFailedEvent
    {
        public int LevelIndex;
        public string Reason;
    }

    public struct OrderSpawnedEvent
    {
        public Order Order;
    }

    public struct OrderCompletedEvent
    {
        public Order Order;
        public Dish Dish;
    }

    public struct OrderFailedEvent
    {
        public Order Order;
    }

    public struct PlayerInteractEvent
    {
        public int PlayerIndex;
        public StationType StationType;
    }

    public struct ScoreChangedEvent
    {
        public int NewScore;
        public int Combo;
    }

    public struct ComboBrokenEvent
    {
        public int PreviousCombo;
    }
}
