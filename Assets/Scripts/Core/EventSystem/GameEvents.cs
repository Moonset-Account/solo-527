using System;
using System.Collections.Generic;

namespace KitchenChaos.Core
{
    public struct GameStateChangedEvent : IEvent
    {
        public GameState PreviousState;
        public GameState NewState;
    }

    public struct LevelStartedEvent : IEvent
    {
        public int LevelIndex;
        public float Duration;
    }

    public struct LevelEndedEvent : IEvent
    {
        public int LevelIndex;
        public bool Victory;
        public FailReason FailReason;
        public int FinalScore;
        public int StarsEarned;
    }

    public struct RequestInitializeLevelEvent : IEvent
    {
        public int LevelIndex;
        public bool IsSinglePlayer;
    }

    public struct RequestResetComboEvent : IEvent { }

    public struct RequestApplyLevelMechanicsEvent : IEvent
    {
        public int LevelIndex;
    }

    public struct RequestSaveLevelResultEvent : IEvent
    {
        public int LevelIndex;
        public int Score;
        public int Stars;
        public bool Victory;
    }

    public struct RequestCheckAchievementsEvent : IEvent
    {
        public int Score;
        public int Stars;
        public int LevelIndex;
        public bool Victory;
    }

    public struct RequestMaxFailedOrdersEvent : IEvent
    {
        public int LevelIndex;
        public int ReplyToken;
    }

    public struct ReplyMaxFailedOrdersEvent : IEvent
    {
        public int ReplyToken;
        public int MaxFailedOrders;
    }

    public struct RequestLevelDurationEvent : IEvent
    {
        public int LevelIndex;
        public int ReplyToken;
    }

    public struct ReplyLevelDurationEvent : IEvent
    {
        public int ReplyToken;
        public float Duration;
    }

    public struct RequestStarThresholdsEvent : IEvent
    {
        public int LevelIndex;
        public int ReplyToken;
    }

    public struct ReplyStarThresholdsEvent : IEvent
    {
        public int ReplyToken;
        public int[] Thresholds;
    }

    public struct OrderCreatedEvent : IEvent
    {
        public Guid OrderId;
        public string RecipeName;
        public List<string> Ingredients;
        public float TimeLimit;
        public int BaseScore;
        public int OrderIndex;
    }

    public struct OrderDeliveredEvent : IEvent
    {
        public Guid OrderId;
        public int ScoreGained;
        public int ComboCount;
        public bool Perfect;
    }

    public struct OrderFailedEvent : IEvent
    {
        public Guid OrderId;
        public string RecipeName;
        public int PenaltyScore;
    }

    public struct PlayerJoinedEvent : IEvent
    {
        public int PlayerId;
        public string ControlScheme;
    }

    public struct PlayerLeftEvent : IEvent
    {
        public int PlayerId;
    }

    public struct PlayerSwitchedEvent : IEvent
    {
        public int NewPlayerId;
    }

    public struct IngredientPickedUpEvent : IEvent
    {
        public int PlayerId;
        public string IngredientName;
        public IngredientState State;
    }

    public struct IngredientDroppedEvent : IEvent
    {
        public int PlayerId;
        public string IngredientName;
    }

    public struct IngredientProcessedEvent : IEvent
    {
        public string StationName;
        public string IngredientName;
        public IngredientState FromState;
        public IngredientState ToState;
    }

    public struct ScoreUpdatedEvent : IEvent
    {
        public int CurrentScore;
        public int Delta;
        public int ComboCount;
    }

    public struct TimerUpdatedEvent : IEvent
    {
        public float TimeRemaining;
        public float TotalTime;
    }

    public struct StationInteractEvent : IEvent
    {
        public int PlayerId;
        public string StationName;
    }

    public struct AchievementUnlockedEvent : IEvent
    {
        public string AchievementId;
        public string AchievementName;
    }

    public struct TutorialTriggerEvent : IEvent
    {
        public string TutorialKey;
    }
}
