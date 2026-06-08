using System;

namespace LakeNavigation
{
    public enum GameState
    {
        None,
        MainMenu,
        Tutorial,
        Planning,
        Sailing,
        Paused,
        Result,
        Encyclopedia,
        Settings
    }

    public enum WeatherType
    {
        Clear,
        Cloudy,
        Foggy,
        Rainy,
        Stormy
    }

    public enum WindDirection
    {
        None,
        North,
        NorthEast,
        East,
        SouthEast,
        South,
        SouthWest,
        West,
        NorthWest
    }

    public enum SupplyType
    {
        Fuel,
        Food,
        Battery
    }

    public enum MissionStatus
    {
        Locked,
        Available,
        InProgress,
        Completed,
        Failed
    }

    public enum FailReason
    {
        None,
        OutOfFuel,
        OutOfFood,
        BoatDamaged,
        TimeExpired,
        MissionFailed
    }

    public enum PhotoQuality
    {
        Poor,
        Fair,
        Good,
        Excellent
    }

    public enum BoatState
    {
        Idle,
        Moving,
        Anchored,
        Damaged,
        Sinking
    }

    public enum CollectionCategory
    {
        Bird,
        Fish,
        Mammal,
        Plant,
        Landmark,
        WeatherEvent
    }

    [Serializable]
    public struct WeatherTransition
    {
        public WeatherType From;
        public WeatherType To;
        public float TransitionDuration;
        public float WarningLeadTime;
    }

    [Serializable]
    public struct WindInfo
    {
        public WindDirection Direction;
        public float Speed;
        public float Variance;
    }

    [Serializable]
    public struct SupplyAmount
    {
        public SupplyType Type;
        public float Current;
        public float Max;
        public float DrainRate;
    }

    [Serializable]
    public struct PhotoTarget
    {
        public string Id;
        public string DisplayName;
        public CollectionCategory Category;
        public UnityEngine.Vector2 GridPosition;
        public float RequiredProximity;
        public PhotoQuality MinQuality;
        public bool IsCompleted;
        public bool IsRequired;
        public WeatherType PreferredWeather;
    }

    [Serializable]
    public struct WeatherForecast
    {
        public WeatherType UpcomingWeather;
        public WindInfo UpcomingWind;
        public float TimeUntilChange;
        public string WarningMessage;
    }

    [Serializable]
    public struct LevelObjective
    {
        public string Description;
        public bool IsRequired;
        public bool IsCompleted;
        public int ScoreReward;
    }
}
