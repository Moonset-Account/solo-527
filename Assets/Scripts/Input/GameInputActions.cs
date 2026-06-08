using UnityEngine.InputSystem;

public static class GameInputActions
{
    public static InputActionMap CreatePlayerActionMap()
    {
        var playerMap = new InputActionMap("Player");

        var moveAction = playerMap.AddAction("Move", InputActionType.Value);
        moveAction.AddCompositeBinding("2DVector")
            .With("Up", "<Keyboard>/w")
            .With("Down", "<Keyboard>/s")
            .With("Left", "<Keyboard>/a")
            .With("Right", "<Keyboard>/d");
        moveAction.AddBinding("<Gamepad>/leftStick");

        var interactAction = playerMap.AddAction("Interact", InputActionType.Button);
        interactAction.AddBinding("<Keyboard>/e");
        interactAction.AddBinding("<Gamepad>/buttonSouth");

        var pickUpAction = playerMap.AddAction("PickUp", InputActionType.Button);
        pickUpAction.AddBinding("<Keyboard>/q");
        pickUpAction.AddBinding("<Gamepad>/buttonWest");

        var dropAction = playerMap.AddAction("Drop", InputActionType.Button);
        dropAction.AddBinding("<Keyboard>/r");
        dropAction.AddBinding("<Gamepad>/buttonEast");

        var switchCharacterAction = playerMap.AddAction("SwitchCharacter", InputActionType.Button);
        switchCharacterAction.AddBinding("<Keyboard>/tab");
        switchCharacterAction.AddBinding("<Gamepad>/buttonNorth");

        var pauseAction = playerMap.AddAction("Pause", InputActionType.Button);
        pauseAction.AddBinding("<Keyboard>/escape");
        pauseAction.AddBinding("<Gamepad>/start");

        return playerMap;
    }

    public static InputActionMap CreateUIActionMap()
    {
        var uiMap = new InputActionMap("UI");

        var navigateAction = uiMap.AddAction("Navigate", InputActionType.Value);
        navigateAction.AddCompositeBinding("2DVector")
            .With("Up", "<Keyboard>/upArrow")
            .With("Down", "<Keyboard>/downArrow")
            .With("Left", "<Keyboard>/leftArrow")
            .With("Right", "<Keyboard>/rightArrow");
        navigateAction.AddBinding("<Gamepad>/leftStick");

        var submitAction = uiMap.AddAction("Submit", InputActionType.Button);
        submitAction.AddBinding("<Keyboard>/enter");
        submitAction.AddBinding("<Gamepad>/buttonSouth");

        var cancelAction = uiMap.AddAction("Cancel", InputActionType.Button);
        cancelAction.AddBinding("<Keyboard>/escape");
        cancelAction.AddBinding("<Gamepad>/buttonEast");

        return uiMap;
    }

    public static UnityEngine.InputSystem.InputActionAsset CreateAsset()
    {
        var asset = ScriptableObject.CreateInstance<UnityEngine.InputSystem.InputActionAsset>();
        asset.AddActionMap(CreatePlayerActionMap());
        asset.AddActionMap(CreateUIActionMap());
        return asset;
    }
}
