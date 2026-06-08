using UnityEngine;

namespace LakeNavigation
{
    public static class GameConstants
    {
        public const string GameName = "Lake Navigator";
        public const string Version = "0.1.0";

        public static class Tags
        {
            public const string Boat = "Boat";
            public const string Waypoint = "Waypoint";
            public const string PhotoTarget = "PhotoTarget";
            public const string Obstacle = "Obstacle";
            public const string SupplyPickup = "SupplyPickup";
            public const string Dock = "Dock";
        }

        public static class Layers
        {
            public const int Water = 8;
            public const int Obstacle = 9;
            public const int Pickup = 10;
            public const int UI = 5;
        }

        public static class SortingLayers
        {
            public const string Water = "Water";
            public const string Objects = "Objects";
            public const string Boat = "Boat";
            public const string Effects = "Effects";
            public const string UI = "UI";
        }

        public static class SceneNames
        {
            public const string MainScene = "MainScene";
        }

        public static class PlayerPrefs
        {
            public const string MusicVolume = "MusicVolume";
            public const string SFXVolume = "SFXVolume";
            public const string TutorialCompleted = "TutorialCompleted";
            public const string HighestLevel = "HighestLevel";
            public const string TotalStars = "TotalStars";
        }

        public static class Colors
        {
            public static readonly Color BoatColor = new Color(0.6f, 0.4f, 0.2f);
            public static readonly Color WaypointColor = new Color(0.2f, 0.8f, 0.2f, 0.7f);
            public static readonly Color ActiveWaypointColor = new Color(1f, 0.9f, 0.2f, 0.9f);
            public static readonly Color CompletedWaypointColor = new Color(0.3f, 0.3f, 0.3f, 0.5f);
            public static readonly Color PhotoTargetColor = new Color(1f, 0.5f, 0f);
            public static readonly Color ObstacleColor = new Color(0.5f, 0.3f, 0.1f);
            public static readonly Color DockColor = new Color(0.4f, 0.3f, 0.1f);
            public static readonly Color SupplyPickupColor = new Color(0.2f, 0.6f, 1f);
            public static readonly Color FogOverlayColor = new Color(0.8f, 0.82f, 0.85f, 0.6f);
            public static readonly Color RainOverlayColor = new Color(0.5f, 0.55f, 0.6f, 0.3f);
            public static readonly Color StormOverlayColor = new Color(0.2f, 0.2f, 0.3f, 0.5f);
            public static readonly Color WindArrowColor = new Color(1f, 1f, 1f, 0.6f);
            public static readonly Color FuelBarColor = new Color(1f, 0.6f, 0.1f);
            public static readonly Color FoodBarColor = new Color(0.4f, 0.8f, 0.2f);
            public static readonly Color BatteryBarColor = new Color(0.2f, 0.6f, 1f);
            public static readonly Color HealthBarColor = new Color(0.9f, 0.2f, 0.2f);
            public static readonly Color StarGoldColor = new Color(1f, 0.85f, 0f);
            public static readonly Color StarEmptyColor = new Color(0.4f, 0.4f, 0.4f);
        }
    }
}
