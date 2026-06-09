using System;
using UnityEngine;

namespace LakeSailing.Core
{
    public static class SceneService
    {
        public static Func<Vector2[]> GetSupplyStationPositions;
        public static Func<Vector2[]> GetTaskTargetPositions;
        public static Func<string[]> GetTaskTargetNames;
        public static Func<int[]> GetTaskTargetRarities;
        public static Func<Vector2> GetBoatPosition;
        public static Func<float> GetBoatHeading;
        public static Func<float> GetBoatCurrentFuel;
        public static Func<float> GetBoatMaxFuel;
        public static Func<float> GetBoatSpeed;
        public static Func<bool> GetBoatCanShootPhoto;

        public static Action<Vector2> BoatAddWaypoint;
        public static Action BoatUndoWaypoint;
        public static Action BoatClearWaypoints;
        public static Action BoatPlanRoute;
        public static Action BoatShootPhoto;
        public static Action BoatFinishShooting;
        public static Action BoatAnchor;
        public static Action BoatSetSail;

        public static Func<int> GetTaskCompletedCount;
        public static Func<int> GetTaskTotalCount;

        public static void ResetAll()
        {
            GetSupplyStationPositions = null;
            GetTaskTargetPositions = null;
            GetTaskTargetNames = null;
            GetTaskTargetRarities = null;
            GetBoatPosition = null;
            GetBoatHeading = null;
            GetBoatCurrentFuel = null;
            GetBoatMaxFuel = null;
            GetBoatSpeed = null;
            GetBoatCanShootPhoto = null;
            BoatAddWaypoint = null;
            BoatUndoWaypoint = null;
            BoatClearWaypoints = null;
            BoatPlanRoute = null;
            BoatShootPhoto = null;
            BoatFinishShooting = null;
            BoatAnchor = null;
            BoatSetSail = null;
            GetTaskCompletedCount = null;
            GetTaskTotalCount = null;
        }
    }

    public enum UIRequestPanel
    {
        None = 0,
        RoutePlanner = 1,
        PauseMenu = 2,
        SettingsMenu = 3,
        Tutorial = 4,
        HUD = 5,
        MainMenu = 6,
        LevelSelect = 7,
        Gallery = 8,
        Achievements = 9,
        Leaderboard = 10,
        DailyChallenge = 11,
        PhotoPreview = 12,
        Loading = 13
    }

    public struct RequestUIPanelEvent : IEvent
    {
        public readonly UIRequestPanel Panel;
        public readonly bool Open;
        public readonly bool ClosePrevious;
        public RequestUIPanelEvent(UIRequestPanel panel, bool open = true, bool closePrevious = false)
        {
            Panel = panel;
            Open = open;
            ClosePrevious = closePrevious;
        }
    }

    public struct RequestTogglePauseEvent : IEvent { }

    public struct RequestShootPhotoEvent : IEvent { }

    public struct RequestToggleCameraFollowEvent : IEvent { }

    public struct RequestNextWeatherEvent : IEvent { }
}
