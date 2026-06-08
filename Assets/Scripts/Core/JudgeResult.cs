namespace RainAlley.Core
{
    public enum JudgeType
    {
        Perfect,
        Early,
        Late,
        Miss
    }

    public struct JudgeResult
    {
        public JudgeType Type;
        public double TimeOffsetMs;
        public bool ColorCorrect;
        public bool TrackCorrect;
        public int Score;

        public bool IsSuccessful => Type != JudgeType.Miss && ColorCorrect && TrackCorrect;

        public static JudgeResult Miss()
        {
            return new JudgeResult
            {
                Type = JudgeType.Miss,
                TimeOffsetMs = 0,
                ColorCorrect = false,
                TrackCorrect = false,
                Score = 0
            };
        }

        public static JudgeResult Create(JudgeType type, double offsetMs, bool colorCorrect, bool trackCorrect, int score)
        {
            return new JudgeResult
            {
                Type = type,
                TimeOffsetMs = offsetMs,
                ColorCorrect = colorCorrect,
                TrackCorrect = trackCorrect,
                Score = type == JudgeType.Miss ? 0 : score
            };
        }
    }

    public struct GameStats
    {
        public int PerfectCount;
        public int EarlyCount;
        public int LateCount;
        public int MissCount;
        public int MaxCombo;
        public int CurrentCombo;
        public int TotalScore;
        public int TotalObstacles;

        public double Accuracy
        {
            get
            {
                if (TotalObstacles == 0) return 0;
                double weighted = PerfectCount * 1.0 + EarlyCount * 0.7 + LateCount * 0.7;
                return weighted / TotalObstacles;
            }
        }

        public void Reset()
        {
            PerfectCount = 0;
            EarlyCount = 0;
            LateCount = 0;
            MissCount = 0;
            MaxCombo = 0;
            CurrentCombo = 0;
            TotalScore = 0;
            TotalObstacles = 0;
        }

        public void AddResult(JudgeResult result)
        {
            TotalObstacles++;
            TotalScore += result.Score;

            switch (result.Type)
            {
                case JudgeType.Perfect: PerfectCount++; break;
                case JudgeType.Early: EarlyCount++; break;
                case JudgeType.Late: LateCount++; break;
                case JudgeType.Miss: MissCount++; break;
            }

            if (result.IsSuccessful)
            {
                CurrentCombo++;
                if (CurrentCombo > MaxCombo) MaxCombo = CurrentCombo;
            }
            else
            {
                CurrentCombo = 0;
            }
        }
    }
}
