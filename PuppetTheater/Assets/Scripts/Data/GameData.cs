namespace PuppetTheater.Data
{
    public enum JudgmentGrade
    {
        Perfect,
        Great,
        Good,
        Early,
        Late,
        Miss
    }

    public enum LightColor
    {
        Red,
        Blue,
        Green,
        Yellow,
        Purple,
        White
    }

    public enum PuppetActionType
    {
        Idle,
        Bow,
        Dance,
        Spin,
        Jump,
        Wave,
        Collapse
    }

    public enum AudienceEmotion
    {
        Ecstatic,
        Happy,
        Neutral,
        Bored,
        Angry
    }

    public enum StoryBranch
    {
        Default,
        Heroic,
        Tragic,
        Comedic,
        Mysterious
    }

    public enum GameMode
    {
        Normal,
        Practice
    }

    public enum FailReason
    {
        None,
        TooManyMisses,
        AudienceLeft,
        PuppetCollapsed,
        StoryDeadEnd
    }

    public struct JudgmentResult
    {
        public JudgmentGrade Grade;
        public double OffsetMs;
        public LightColor ExpectedColor;
        public LightColor ActualColor;
        public int BeatIndex;

        public bool IsHit => Grade == JudgmentGrade.Perfect ||
                             Grade == JudgmentGrade.Great ||
                             Grade == JudgmentGrade.Good;

        public bool IsEarly => Grade == JudgmentGrade.Early;
        public bool IsLate => Grade == JudgmentGrade.Late;
        public bool IsMiss => Grade == JudgmentGrade.Miss;
    }

    public struct PerformanceStats
    {
        public int PerfectCount;
        public int GreatCount;
        public int GoodCount;
        public int EarlyCount;
        public int LateCount;
        public int MissCount;
        public int MaxCombo;
        public int TotalBeats;
        public float AudienceEmotionScore;
        public StoryBranch FinalBranch;
        public FailReason FailReason;
        public bool Completed;
        public double TotalScore;

        public int TotalHits => PerfectCount + GreatCount + GoodCount;
        public int TotalErrors => EarlyCount + LateCount + MissCount;
        public float Accuracy => TotalBeats > 0 ? (float)TotalHits / TotalBeats : 0f;
    }
}
