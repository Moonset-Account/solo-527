namespace KitchenChaos.Core.Abstractions
{
    public interface IGameManager
    {
        GameState State { get; }
        int CurrentLevelIndex { get; }
        int CurrentScore { get; }
        float TimeRemaining { get; }
        bool IsSinglePlayerMode { get; }
        FailReason LastFailReason { get; }
        int StarsEarned { get; }

        void ChangeState(GameState newState);
        void SetSinglePlayerMode(bool single);
        void StartLevel(int levelIndex);
        void RestartLevel();
        void ExitToMenu();
        void EndLevel(bool timeUp);
    }
}
