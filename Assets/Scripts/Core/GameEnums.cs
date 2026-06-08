namespace YouthTrainingManagement.Core
{
    public enum GameState
    {
        Boot,
        MainMenu,
        Tutorial,
        Playing,
        Paused,
        Settings,
        Training,
        Match,
        Recovery,
        ResultScreen,
        GameOver
    }

    public enum TrainingType
    {
        Strength,
        Speed,
        Technique,
        Endurance,
        Tactical,
        RecoveryLight
    }

    public enum PlayerPosition
    {
        Goalkeeper,
        Defender,
        Midfielder,
        Forward
    }

    public enum InjurySeverity
    {
        None,
        Minor,
        Moderate,
        Severe
    }

    public enum MatchResult
    {
        NotPlayed,
        Win,
        Draw,
        Loss
    }

    public enum UIScreen
    {
        None,
        Dashboard,
        Training,
        Match,
        Recovery,
        Squad,
        Fixtures,
        Finance,
        Tutorial,
        Settings,
        Pause,
        Result
    }

    public enum DayPhase
    {
        Morning,
        Afternoon,
        Evening,
        MatchDay
    }

    public enum FeedbackType
    {
        Success,
        Warning,
        Error,
        Info,
        Achievement
    }
}
