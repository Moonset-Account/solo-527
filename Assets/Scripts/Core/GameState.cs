namespace KitchenChaos.Core
{
    public enum GameState
    {
        Boot,
        MainMenu,
        LevelSelect,
        PreGame,
        Playing,
        Paused,
        LevelComplete,
        LevelFailed,
        GameComplete
    }

    public static class GameStateExtensions
    {
        public static bool IsPlayable(this GameState state)
            => state == GameState.Playing;

        public static bool CanPause(this GameState state)
            => state == GameState.Playing || state == GameState.Paused;

        public static bool InGameplay(this GameState state)
            => state == GameState.PreGame
            || state == GameState.Playing
            || state == GameState.Paused
            || state == GameState.LevelComplete
            || state == GameState.LevelFailed;
    }
}
