using UnityEngine;
using System;

namespace ShadowPlatformer.Player
{
    public class PlayerInput : MonoBehaviour
    {
        public Vector2 MoveInput { get; private set; }
        public bool JumpPressed { get; private set; }
        public bool JumpHeld { get; private set; }
        public bool LightSwitchPressed { get; private set; }
        public bool PausePressed { get; private set; }
        public bool InteractPressed { get; private set; }

        public event Action OnJumpPressed;
        public event Action OnLightSwitchPressed;
        public event Action OnPausePressed;
        public event Action OnInteractPressed;

        private void Update()
        {
            MoveInput = new Vector2(
                Input.GetAxisRaw("Horizontal"),
                Input.GetAxisRaw("Vertical")
            );

            if (Input.GetButtonDown("Jump"))
            {
                JumpPressed = true;
                OnJumpPressed?.Invoke();
            }
            JumpHeld = Input.GetButton("Jump");

            if (Input.GetButtonDown("LightSwitch"))
            {
                LightSwitchPressed = true;
                OnLightSwitchPressed?.Invoke();
            }

            if (Input.GetButtonDown("Pause"))
            {
                PausePressed = true;
                OnPausePressed?.Invoke();
            }

            if (Input.GetButtonDown("Interact"))
            {
                InteractPressed = true;
                OnInteractPressed?.Invoke();
            }
        }

        private void LateUpdate()
        {
            JumpPressed = false;
            LightSwitchPressed = false;
            PausePressed = false;
            InteractPressed = false;
        }
    }
}
