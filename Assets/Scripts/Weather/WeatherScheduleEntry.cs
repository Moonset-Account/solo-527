using System;

namespace LakeNavigation
{
    [Serializable]
    public struct WeatherScheduleEntry
    {
        public WeatherType Weather;
        public WindInfo Wind;
        public float Duration;
        public string WarningMessage;
    }
}
