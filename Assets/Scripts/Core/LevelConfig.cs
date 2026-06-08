using System.Collections.Generic;
using UnityEngine;

namespace RainAlley.Core
{
    [CreateAssetMenu(fileName = "LevelConfig", menuName = "RainAlley/Level Config")]
    public class LevelConfig : ScriptableObject
    {
        [Header("基础设置")]
        public string LevelId;
        public string LevelName;
        public int LevelNumber;
        public string Description;

        [Header("节拍设置")]
        [Range(60, 200)] public float BPM = 100f;
        public int BeatsPerMeasure = 4;
        public int TotalBeats = 64;

        [Header("机制解锁")]
        public bool UnlockDualTrack = false;
        public bool UnlockColorSwitching = true;

        [Header("颜色池")]
        public List<UmbrellaColorType> AvailableColors = new List<UmbrellaColorType>
        {
            UmbrellaColorType.Blue,
            UmbrellaColorType.Pink
        };

        [Header("难度")]
        [Range(0.05f, 0.3f)] public float PerfectWindowMs = 80f;
        [Range(0.1f, 0.5f)] public float GoodWindowMs = 160f;
        [Range(1, 10)] public int MissThreshold = 3;

        [Header("障碍物数据")]
        public List<ObstacleData> Obstacles = new List<ObstacleData>();

        public double MsPerBeat => 60000.0 / BPM;

        public double GetBeatTimeMs(int beatIndex)
        {
            return beatIndex * MsPerBeat;
        }

        public void OnValidate()
        {
            if (Obstacles.Count == 0) GenerateDefaultObstacles();
        }

        public void GenerateDefaultObstacles()
        {
            Obstacles.Clear();
            double msPerBeat = 60000.0 / BPM;

            if (LevelNumber <= 3)
            {
                GenerateTeachingLevelObstacles(msPerBeat);
            }
            else
            {
                GenerateAdvancedLevelObstacles(msPerBeat);
            }
        }

        private void GenerateTeachingLevelObstacles(double msPerBeat)
        {
            int colorCount = Mathf.Max(2, AvailableColors.Count);
            for (int i = 4; i < TotalBeats; i += 2)
            {
                var color = AvailableColors[i % colorCount];
                ObstacleType type;
                if (LevelNumber == 1) type = ObstacleType.Puddle;
                else if (LevelNumber == 2) type = i % 2 == 0 ? ObstacleType.Puddle : ObstacleType.WindChime;
                else type = (ObstacleType)(i % 3);

                Obstacles.Add(new ObstacleData(
                    beatIndex: i,
                    beatTimeMs: i * msPerBeat,
                    type: type,
                    requiredColor: color,
                    track: TrackPosition.Left,
                    requiresSwitch: false
                ));
            }
        }

        private void GenerateAdvancedLevelObstacles(double msPerBeat)
        {
            int colorCount = AvailableColors.Count;
            TrackPosition lastTrack = TrackPosition.Left;

            for (int i = 4; i < TotalBeats; i++)
            {
                if (i % 2 != 0) continue;
                var color = AvailableColors[i % colorCount];
                ObstacleType type = (ObstacleType)(i % 3);

                TrackPosition track = lastTrack;
                bool needsSwitch = false;
                if (UnlockDualTrack && i % 6 == 0)
                {
                    track = track == TrackPosition.Left ? TrackPosition.Right : TrackPosition.Left;
                    needsSwitch = true;
                }
                lastTrack = track;

                Obstacles.Add(new ObstacleData(
                    beatIndex: i,
                    beatTimeMs: i * msPerBeat,
                    type: type,
                    requiredColor: color,
                    track: track,
                    requiresSwitch: needsSwitch
                ));
            }
        }

        public static LevelConfig CreateDefaultLevel1()
        {
            var config = ScriptableObject.CreateInstance<LevelConfig>();
            config.LevelId = "level_01";
            config.LevelName = "初遇雨巷";
            config.LevelNumber = 1;
            config.Description = "学习基础：只有水洼和两种颜色。跟随雨声节奏切换纸伞。";
            config.BPM = 80f;
            config.TotalBeats = 48;
            config.UnlockDualTrack = false;
            config.AvailableColors = new List<UmbrellaColorType>
            {
                UmbrellaColorType.Blue,
                UmbrellaColorType.Pink
            };
            config.PerfectWindowMs = 100f;
            config.GoodWindowMs = 200f;
            config.Obstacles.Clear();
            double msPerBeat = 60000.0 / 80f;
            for (int i = 4; i < 48; i += 2)
            {
                var color = (i / 2) % 2 == 0 ? UmbrellaColorType.Blue : UmbrellaColorType.Pink;
                config.Obstacles.Add(new ObstacleData(i, i * msPerBeat, ObstacleType.Puddle, color, TrackPosition.Left));
            }
            return config;
        }

        public static LevelConfig CreateDefaultLevel2()
        {
            var config = ScriptableObject.CreateInstance<LevelConfig>();
            config.LevelId = "level_02";
            config.LevelName = "风铃初响";
            config.LevelNumber = 2;
            config.Description = "加入风铃！识别两种障碍物并保持节奏。";
            config.BPM = 90f;
            config.TotalBeats = 56;
            config.UnlockDualTrack = false;
            config.AvailableColors = new List<UmbrellaColorType>
            {
                UmbrellaColorType.Blue,
                UmbrellaColorType.Pink
            };
            config.PerfectWindowMs = 90f;
            config.GoodWindowMs = 180f;
            config.Obstacles.Clear();
            double msPerBeat = 60000.0 / 90f;
            for (int i = 4; i < 56; i += 2)
            {
                var color = (i / 2) % 2 == 0 ? UmbrellaColorType.Blue : UmbrellaColorType.Pink;
                var type = i % 4 == 0 ? ObstacleType.WindChime : ObstacleType.Puddle;
                config.Obstacles.Add(new ObstacleData(i, i * msPerBeat, type, color, TrackPosition.Left));
            }
            return config;
        }

        public static LevelConfig CreateDefaultLevel3()
        {
            var config = ScriptableObject.CreateInstance<LevelConfig>();
            config.LevelId = "level_03";
            config.LevelName = "灯笼映雨";
            config.LevelNumber = 3;
            config.Description = "三种颜色和三种障碍物齐登场，熟练掌握后准备进入双轨模式。";
            config.BPM = 100f;
            config.TotalBeats = 64;
            config.UnlockDualTrack = false;
            config.AvailableColors = new List<UmbrellaColorType>
            {
                UmbrellaColorType.Blue,
                UmbrellaColorType.Pink,
                UmbrellaColorType.Green
            };
            config.PerfectWindowMs = 80f;
            config.GoodWindowMs = 160f;
            config.Obstacles.Clear();
            double msPerBeat = 60000.0 / 100f;
            for (int i = 4; i < 64; i += 2)
            {
                int colorIdx = (i / 2) % 3;
                var color = config.AvailableColors[colorIdx];
                var type = (ObstacleType)((i / 2) % 3);
                config.Obstacles.Add(new ObstacleData(i, i * msPerBeat, type, color, TrackPosition.Left));
            }
            return config;
        }

        public static LevelConfig CreateDefaultLevel4()
        {
            var config = ScriptableObject.CreateInstance<LevelConfig>();
            config.LevelId = "level_04";
            config.LevelName = "双巷交错";
            config.LevelNumber = 4;
            config.Description = "双轨模式开启！注意切换轨道穿过灯笼门。";
            config.BPM = 105f;
            config.TotalBeats = 72;
            config.UnlockDualTrack = true;
            config.AvailableColors = new List<UmbrellaColorType>
            {
                UmbrellaColorType.Blue,
                UmbrellaColorType.Pink,
                UmbrellaColorType.Green
            };
            config.PerfectWindowMs = 75f;
            config.GoodWindowMs = 150f;
            config.Obstacles.Clear();
            double msPerBeat = 60000.0 / 105f;
            TrackPosition track = TrackPosition.Left;
            for (int i = 4; i < 72; i += 2)
            {
                if (i % 8 == 0) track = track == TrackPosition.Left ? TrackPosition.Right : TrackPosition.Left;
                int colorIdx = (i / 2) % 3;
                var color = config.AvailableColors[colorIdx];
                var type = i % 6 == 0 ? ObstacleType.LanternGate : (ObstacleType)(((i / 2) % 2));
                bool needsSwitch = i % 8 == 0;
                config.Obstacles.Add(new ObstacleData(i, i * msPerBeat, type, color, track, needsSwitch));
            }
            return config;
        }

        public static List<LevelConfig> GetAllDefaultLevels()
        {
            return new List<LevelConfig>
            {
                CreateDefaultLevel1(),
                CreateDefaultLevel2(),
                CreateDefaultLevel3(),
                CreateDefaultLevel4()
            };
        }
    }
}
