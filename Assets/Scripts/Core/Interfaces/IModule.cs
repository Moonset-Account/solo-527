namespace SpaceCourier.Core
{
    public interface IModule
    {
        void Initialize();
        void Shutdown();
        ModuleType Type { get; }
    }

    public enum ModuleType
    {
        GameManager,
        DataManager,
        TurnManager,
        FuelManager,
        ReputationManager,
        EventManager,
        UIManager,
        SaveManager,
        AudioManager,
        SceneLoader,
        InputManager,
        PlayRecorder
    }
}
