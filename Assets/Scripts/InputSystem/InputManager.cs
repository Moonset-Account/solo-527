using System;
using UnityEngine;

namespace RainAlley.InputSystem
{
    public enum InputSource
    {
        Keyboard,
        TouchMobile
    }

    public enum GameInputAction
    {
        Judge,
        ColorNext,
        ColorPrev,
        Color1,
        Color2,
        Color3,
        Color4,
        TrackToggle,
        Pause
    }

    public class InputManager
    {
        public InputSource CurrentSource { get; private set; }
        public bool IsMobile { get; private set; }

        public event Action OnJudgeInput;
        public event Action<int> OnColorSelect;
        public event Action OnColorNext;
        public event Action OnColorPrev;
        public event Action OnTrackToggle;
        public event Action OnPause;

        public bool IsEnabled = true;

        public InputManager()
        {
            DetectPlatform();
        }

        private void DetectPlatform()
        {
#if UNITY_ANDROID || UNITY_IOS || UNITY_WSA
            IsMobile = true;
            CurrentSource = InputSource.TouchMobile;
#else
            IsMobile = false;
            CurrentSource = InputSource.Keyboard;
#endif
        }

        public void SetInputSource(InputSource source)
        {
            CurrentSource = source;
            IsMobile = source == InputSource.TouchMobile;
        }

        public void Tick()
        {
            if (!IsEnabled) return;

            if (CurrentSource == InputSource.Keyboard)
            {
                HandleKeyboardInput();
            }
            else
            {
                HandleTouchInput();
            }
        }

        private void HandleKeyboardInput()
        {
            if (Input.GetKeyDown(KeyCode.Space) || Input.GetKeyDown(KeyCode.Return) || Input.GetKeyDown(KeyCode.F))
            {
                OnJudgeInput?.Invoke();
            }

            if (Input.GetKeyDown(KeyCode.D) || Input.GetKeyDown(KeyCode.RightArrow))
            {
                OnColorNext?.Invoke();
            }
            if (Input.GetKeyDown(KeyCode.A) || Input.GetKeyDown(KeyCode.LeftArrow))
            {
                OnColorPrev?.Invoke();
            }

            if (Input.GetKeyDown(KeyCode.Alpha1) || Input.GetKeyDown(KeyCode.Z))
            {
                OnColorSelect?.Invoke(0);
            }
            if (Input.GetKeyDown(KeyCode.Alpha2) || Input.GetKeyDown(KeyCode.X))
            {
                OnColorSelect?.Invoke(1);
            }
            if (Input.GetKeyDown(KeyCode.Alpha3) || Input.GetKeyDown(KeyCode.C))
            {
                OnColorSelect?.Invoke(2);
            }
            if (Input.GetKeyDown(KeyCode.Alpha4) || Input.GetKeyDown(KeyCode.V))
            {
                OnColorSelect?.Invoke(3);
            }

            if (Input.GetKeyDown(KeyCode.W) || Input.GetKeyDown(KeyCode.UpArrow) || Input.GetKeyDown(KeyCode.Tab))
            {
                OnTrackToggle?.Invoke();
            }

            if (Input.GetKeyDown(KeyCode.Escape) || Input.GetKeyDown(KeyCode.P))
            {
                OnPause?.Invoke();
            }
        }

        private void HandleTouchInput()
        {
            for (int i = 0; i < Input.touchCount; i++)
            {
                var touch = Input.GetTouch(i);
                if (touch.phase != TouchPhase.Began) continue;

                Vector2 pos = touch.position;
                float screenW = Screen.width;
                float screenH = Screen.height;

                if (pos.y > screenH * 0.7f)
                {
                    if (pos.x < screenW * 0.5f)
                        OnColorNext?.Invoke();
                    else
                        OnColorPrev?.Invoke();
                }
                else if (pos.y > screenH * 0.4f)
                {
                    OnTrackToggle?.Invoke();
                }
                else
                {
                    OnJudgeInput?.Invoke();
                }
            }

            if (Input.GetMouseButtonDown(0))
            {
                Vector2 pos = Input.mousePosition;
                float screenH = Screen.height;
                if (pos.y < screenH * 0.4f)
                {
                    OnJudgeInput?.Invoke();
                }
            }
        }

        public void TriggerJudge()
        {
            if (IsEnabled) OnJudgeInput?.Invoke();
        }

        public void TriggerColorSelect(int index)
        {
            if (IsEnabled) OnColorSelect?.Invoke(index);
        }

        public void TriggerColorNext()
        {
            if (IsEnabled) OnColorNext?.Invoke();
        }

        public void TriggerColorPrev()
        {
            if (IsEnabled) OnColorPrev?.Invoke();
        }

        public void TriggerTrackToggle()
        {
            if (IsEnabled) OnTrackToggle?.Invoke();
        }

        public string GetHintForAction(GameInputAction action)
        {
            if (CurrentSource == InputSource.Keyboard)
            {
                switch (action)
                {
                    case GameInputAction.Judge: return "空格 / F / 回车";
                    case GameInputAction.ColorNext: return "→ / D";
                    case GameInputAction.ColorPrev: return "← / A";
                    case GameInputAction.Color1: return "1 / Z";
                    case GameInputAction.Color2: return "2 / X";
                    case GameInputAction.Color3: return "3 / C";
                    case GameInputAction.Color4: return "4 / V";
                    case GameInputAction.TrackToggle: return "↑ / W / Tab";
                    case GameInputAction.Pause: return "Esc / P";
                    default: return "";
                }
            }
            else
            {
                switch (action)
                {
                    case GameInputAction.Judge: return "点击屏幕下方";
                    case GameInputAction.ColorNext: return "点击屏幕左上";
                    case GameInputAction.ColorPrev: return "点击屏幕右上";
                    case GameInputAction.TrackToggle: return "点击屏幕中部";
                    case GameInputAction.Pause: return "长按屏幕两秒";
                    default: return "";
                }
            }
        }
    }
}
