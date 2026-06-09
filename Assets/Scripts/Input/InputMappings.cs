using System;
using System.Collections.Generic;
using UnityEngine;
using KitchenChaos.Core;

namespace KitchenChaos.Input
{
    public enum InputDeviceType
    {
        KeyboardMouse,
        Gamepad,
        Touch
    }

    public interface IInputMapping
    {
        string Name { get; }
        InputDeviceType DeviceType { get; }
        Vector2 Move { get; }
        bool InteractPressed { get; }
        bool InteractReleased { get; }
        bool SecondaryPressed { get; }
        bool SecondaryReleased { get; }
        bool DropPressed { get; }
        bool SwitchCharPressed { get; }
        bool PausePressed { get; }
        void Tick();
    }

    public abstract class InputMappingBase : IInputMapping
    {
        public abstract string Name { get; }
        public abstract InputDeviceType DeviceType { get; }
        public Vector2 Move { get; protected set; }
        public bool InteractPressed { get; protected set; }
        public bool InteractReleased { get; protected set; }
        public bool SecondaryPressed { get; protected set; }
        public bool SecondaryReleased { get; protected set; }
        public bool DropPressed { get; protected set; }
        public bool SwitchCharPressed { get; protected set; }
        public bool PausePressed { get; protected set; }

        protected bool _prevInteract, _prevSecondary;

        public abstract void Tick();

        protected void UpdateEdgeFlags(bool interactDown, bool secondaryDown)
        {
            InteractPressed = interactDown && !_prevInteract;
            InteractReleased = !interactDown && _prevInteract;
            SecondaryPressed = secondaryDown && !_prevSecondary;
            SecondaryReleased = !secondaryDown && _prevSecondary;
            _prevInteract = interactDown;
            _prevSecondary = secondaryDown;
        }
    }

    public class KeyboardP1Mapping : InputMappingBase
    {
        public override string Name => "KB_P1_WASD_E";
        public override InputDeviceType DeviceType => InputDeviceType.KeyboardMouse;

        public override void Tick()
        {
            float x = 0, y = 0;
            if (UnityEngine.Input.GetKey(KeyCode.A)) x -= 1;
            if (UnityEngine.Input.GetKey(KeyCode.D)) x += 1;
            if (UnityEngine.Input.GetKey(KeyCode.S)) y -= 1;
            if (UnityEngine.Input.GetKey(KeyCode.W)) y += 1;
            Move = new Vector2(x, y).normalized;

            bool interact = UnityEngine.Input.GetKey(KeyCode.E);
            bool secondary = UnityEngine.Input.GetKey(KeyCode.Q);

            DropPressed = UnityEngine.Input.GetKeyDown(KeyCode.F);
            SwitchCharPressed = UnityEngine.Input.GetKeyDown(KeyCode.Tab);
            PausePressed = UnityEngine.Input.GetKeyDown(KeyCode.Escape);

            UpdateEdgeFlags(interact, secondary);
        }
    }

    public class KeyboardP2Mapping : InputMappingBase
    {
        public override string Name => "KB_P2_Arrows_Enter";
        public override InputDeviceType DeviceType => InputDeviceType.KeyboardMouse;

        public override void Tick()
        {
            float x = 0, y = 0;
            if (UnityEngine.Input.GetKey(KeyCode.LeftArrow)) x -= 1;
            if (UnityEngine.Input.GetKey(KeyCode.RightArrow)) x += 1;
            if (UnityEngine.Input.GetKey(KeyCode.DownArrow)) y -= 1;
            if (UnityEngine.Input.GetKey(KeyCode.UpArrow)) y += 1;
            Move = new Vector2(x, y).normalized;

            bool interact = UnityEngine.Input.GetKey(KeyCode.KeypadEnter) || UnityEngine.Input.GetKey(KeyCode.Return);
            bool secondary = UnityEngine.Input.GetKey(KeyCode.RightShift);

            DropPressed = UnityEngine.Input.GetKeyDown(KeyCode.RightControl);
            SwitchCharPressed = UnityEngine.Input.GetKeyDown(KeyCode.Backspace);
            PausePressed = UnityEngine.Input.GetKeyDown(KeyCode.P);

            UpdateEdgeFlags(interact, secondary);
        }
    }

    public class GamepadMapping : InputMappingBase
    {
        readonly int _joystickId;
        public override string Name => $"Gamepad_{_joystickId}";
        public override InputDeviceType DeviceType => InputDeviceType.Gamepad;

        public GamepadMapping(int joystickId) => _joystickId = joystickId;

        public override void Tick()
        {
            string prefix = $"Joy{_joystickId + 1}";
            float x = UnityEngine.Input.GetAxis($"{prefix}_Horizontal");
            float y = UnityEngine.Input.GetAxis($"{prefix}_Vertical");
            var raw = new Vector2(x, y);
            Move = raw.sqrMagnitude > 0.1f ? raw.normalized : Vector2.zero;

            bool interact = UnityEngine.Input.GetKey($"joystick {_joystickId + 1} button 0") ||
                            UnityEngine.Input.GetAxis($"{prefix}_Triggers") < -0.5f;
            bool secondary = UnityEngine.Input.GetKey($"joystick {_joystickId + 1} button 1");

            DropPressed = UnityEngine.Input.GetKeyDown($"joystick {_joystickId + 1} button 2");
            SwitchCharPressed = UnityEngine.Input.GetKeyDown($"joystick {_joystickId + 1} button 3");
            PausePressed = UnityEngine.Input.GetKeyDown($"joystick {_joystickId + 1} button 7");

            UpdateEdgeFlags(interact, secondary);
        }
    }
}
