using UnityEngine.InputSystem;

public static class GameInputActionsHolder
{
    public static UnityEngine.InputSystem.InputActionAsset GetOrCreateAsset()
    {
        return GameInputActions.CreateAsset();
    }
}
