using System.Collections.Generic;
using UnityEngine;

namespace LakeNavigation
{
    [CreateAssetMenu(fileName = "LevelData", menuName = "Lake Navigation/Level Data")]
    public class LevelData : ScriptableObject
    {
        public string LevelName;
        public string LevelDescription;
        public int LevelIndex;
        public Vector2 BoatStartPosition;
        public float BoatStartHealth;
        public List<SupplyAmount> StartingSupplies = new List<SupplyAmount>();
        public List<PhotoTarget> PhotoTargets = new List<PhotoTarget>();
        public List<LevelObjective> Objectives = new List<LevelObjective>();
        public float TimeLimit;
        public List<WeatherScheduleEntry> WeatherSchedule = new List<WeatherScheduleEntry>();
        public List<Vector2> ObstaclePositions = new List<Vector2>();
        public List<Vector2> SupplyPickupPositions = new List<Vector2>();
        public List<Vector2> DockPositions = new List<Vector2>();
        public int MaxWaypoints;
        public int RequiredStarsToUnlock;
        public string TutorialHint;
        public bool IsTutorialLevel;
    }
}
