using System;
using UnityEngine;
using UnityEngine.InputSystem;

[Serializable]
public class PlayerInputData
{
    public Vector2 MoveInput;
    public bool InteractPressed;
    public bool PickUpPressed;
    public bool DropPressed;
    public bool SwitchPressed;

    private InputAction _moveAction;
    private InputAction _interactAction;
    private InputAction _pickUpAction;
    private InputAction _dropAction;
    private InputAction _switchAction;

    public void Initialize(PlayerInput playerInput)
    {
        _moveAction = playerInput.actions["Move"];
        _interactAction = playerInput.actions["Interact"];
        _pickUpAction = playerInput.actions["PickUp"];
        _dropAction = playerInput.actions["Drop"];
        _switchAction = playerInput.actions["SwitchCharacter"];
    }

    public void UpdateFromInput(PlayerInput playerInput)
    {
        if (_moveAction != null)
            MoveInput = _moveAction.ReadValue<Vector2>();

        if (_interactAction != null)
            InteractPressed = _interactAction.WasPressedThisFrame();

        if (_pickUpAction != null)
            PickUpPressed = _pickUpAction.WasPressedThisFrame();

        if (_dropAction != null)
            DropPressed = _dropAction.WasPressedThisFrame();

        if (_switchAction != null)
            SwitchPressed = _switchAction.WasPressedThisFrame();
    }

    public void ResetFrameState()
    {
        MoveInput = Vector2.zero;
        InteractPressed = false;
        PickUpPressed = false;
        DropPressed = false;
        SwitchPressed = false;
    }
}
