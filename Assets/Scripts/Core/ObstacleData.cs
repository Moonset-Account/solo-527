using System;

namespace RainAlley.Core
{
    public enum ObstacleType
    {
        Puddle,
        WindChime,
        LanternGate
    }

    public enum TrackPosition
    {
        Left = 0,
        Right = 1
    }

    [Serializable]
    public class ObstacleData
    {
        public int BeatIndex;
        public double BeatTimeMs;
        public ObstacleType Type;
        public UmbrellaColorType RequiredColor;
        public TrackPosition Track;
        public bool RequiresTrackSwitch;

        public ObstacleData() { }

        public ObstacleData(int beatIndex, double beatTimeMs, ObstacleType type,
                           UmbrellaColorType requiredColor, TrackPosition track,
                           bool requiresSwitch = false)
        {
            BeatIndex = beatIndex;
            BeatTimeMs = beatTimeMs;
            Type = type;
            RequiredColor = requiredColor;
            Track = track;
            RequiresTrackSwitch = requiresSwitch;
        }
    }

    public static class ObstacleTypeExtensions
    {
        public static string ToDisplayString(this ObstacleType type)
        {
            switch (type)
            {
                case ObstacleType.Puddle: return "水洼";
                case ObstacleType.WindChime: return "风铃";
                case ObstacleType.LanternGate: return "灯笼门";
                default: return "未知";
            }
        }
    }
}
