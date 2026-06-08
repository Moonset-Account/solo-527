using System;
using System.Collections.Generic;
using UnityEngine;

namespace Kitchen.Input
{
    [CreateAssetMenu(fileName = "InputProfile_", menuName = "Kitchen/Input/Input Profile", order = 0)]
    public class InputProfile : ScriptableObject
    {
        public string profileName = "Default";
        public InputDeviceType deviceType = InputDeviceType.KeyboardMouse;
        public List<InputBinding> bindings = new List<InputBinding>();
    }

    public enum InputDeviceType
    {
        KeyboardMouse,
        Gamepad,
        Touch
    }

    [Serializable]
    public class InputBinding
    {
        public InputAction action;
        public KeyCode primaryKey = KeyCode.None;
        public KeyCode secondaryKey = KeyCode.None;
        public string gamepadAxis = "";
        public int gamepadButton = -1;
        public bool isAxis = false;
        public bool invertAxis = false;
    }

    public enum InputAction
    {
        MoveX,
        MoveY,
        Interact,
        Drop,
        SwitchCharacter,
        Pause,
        OpenMenu,
        Confirm,
        Cancel
    }
}
