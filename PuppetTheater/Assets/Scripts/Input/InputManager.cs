using UnityEngine;
using System;
using PuppetTheater.Data;
using PuppetTheater.Core;

namespace PuppetTheater.Input
{
    public struct TouchZoneLayout
    {
        public Rect[] zones;
        public LightColor[] colors;
    }

    public struct InputPromptInfo
    {
        public LightColor color;
        public string keyboardKey;
        public int touchZoneIndex;
        public bool isActive;
    }

    public class InputManager : MonoBehaviour
    {
        [SerializeField] private BeatManager _beatManager;
        [SerializeField] private bool _forceMobileMode;
        [SerializeField] private bool _forceKeyboardMode;

        private float _calibrationOffsetMs;
        private TouchZoneLayout _touchZoneLayout;
        private bool _touchZoneLayoutInitialized;

        private static readonly (KeyCode key, LightColor color, string displayName)[] KeyBindings =
        {
            (KeyCode.Q, LightColor.Red, "Q"),
            (KeyCode.W, LightColor.Blue, "W"),
            (KeyCode.E, LightColor.Green, "E"),
            (KeyCode.R, LightColor.Yellow, "R"),
            (KeyCode.T, LightColor.Purple, "T"),
            (KeyCode.Space, LightColor.White, "Space")
        };

        public event Action<LightColor, double> OnLightInput;

        private void Awake()
        {
            InitializeDefaultTouchZoneLayout();
        }

        private void InitializeDefaultTouchZoneLayout()
        {
            float screenWidth = Screen.width;
            float screenHeight = Screen.height;
            float zoneWidth = screenWidth / 6f;
            float zoneHeight = screenHeight * 0.2f;

            var zones = new Rect[6];
            var colors = new LightColor[6];

            for (int i = 0; i < 6; i++)
            {
                zones[i] = new Rect(i * zoneWidth, 0f, zoneWidth, zoneHeight);
                colors[i] = KeyBindings[i].color;
            }

            _touchZoneLayout = new TouchZoneLayout { zones = zones, colors = colors };
            _touchZoneLayoutInitialized = true;
        }

        private void Update()
        {
            ProcessKeyboardInput();
            ProcessTouchInput();
        }

        private void ProcessKeyboardInput()
        {
            for (int i = 0; i < KeyBindings.Length; i++)
            {
                if (Input.GetKeyDown(KeyBindings[i].key))
                {
                    double inputTimeMs = AudioSettings.dspTime * 1000.0;
                    OnLightInput?.Invoke(KeyBindings[i].color, inputTimeMs);
                }
            }
        }

        private void ProcessTouchInput()
        {
            for (int i = 0; i < Input.touchCount; i++)
            {
                Touch touch = Input.GetTouch(i);
                if (touch.phase != TouchPhase.Began) continue;

                LightColor? resolved = ResolveTouchZone(touch.position);
                if (resolved.HasValue)
                {
                    double inputTimeMs = AudioSettings.dspTime * 1000.0;
                    OnLightInput?.Invoke(resolved.Value, inputTimeMs);
                }
            }
        }

        private LightColor? ResolveTouchZone(Vector2 position)
        {
            if (!_touchZoneLayoutInitialized) return null;

            Rect[] zones = _touchZoneLayout.zones;
            LightColor[] colors = _touchZoneLayout.colors;

            for (int i = 0; i < zones.Length; i++)
            {
                if (zones[i].Contains(position))
                {
                    if (i < colors.Length) return colors[i];
                    return null;
                }
            }

            return null;
        }

        public void SetCalibrationOffset(float offsetMs)
        {
            _calibrationOffsetMs = offsetMs;
            if (_beatManager != null)
            {
                _beatManager.SetCalibrationOffset((double)offsetMs);
            }
        }

        public bool IsMobileMode()
        {
            if (_forceMobileMode) return true;
            if (_forceKeyboardMode) return false;
            return Application.isMobilePlatform;
        }

        public void SetTouchZoneLayout(TouchZoneLayout layout)
        {
            _touchZoneLayout = layout;
            _touchZoneLayoutInitialized =
                layout.zones != null && layout.colors != null &&
                layout.zones.Length > 0 && layout.colors.Length > 0;
        }

        public void TriggerHaptic(JudgmentGrade grade)
        {
            if (!IsMobileMode()) return;

            switch (grade)
            {
                case JudgmentGrade.Perfect:
                    TriggerHapticMedium();
                    break;
                case JudgmentGrade.Great:
                    TriggerHapticLight();
                    break;
                case JudgmentGrade.Miss:
                    TriggerHapticHeavy();
                    break;
            }
        }

        private static void TriggerHapticLight()
        {
#if UNITY_ANDROID && !UNITY_EDITOR
            using (var unityPlayer = new AndroidJavaClass("com.unity3d.player.UnityPlayer"))
            using (var activity = unityPlayer.GetStatic<AndroidJavaObject>("currentActivity"))
            using (var vibrator = activity.Call<AndroidJavaObject>("getSystemService", "vibrator"))
            {
                vibrator.Call("vibrate", 10L);
            }
#else
            Handheld.Vibrate();
#endif
        }

        private static void TriggerHapticMedium()
        {
#if UNITY_ANDROID && !UNITY_EDITOR
            using (var unityPlayer = new AndroidJavaClass("com.unity3d.player.UnityPlayer"))
            using (var activity = unityPlayer.GetStatic<AndroidJavaObject>("currentActivity"))
            using (var vibrator = activity.Call<AndroidJavaObject>("getSystemService", "vibrator"))
            {
                vibrator.Call("vibrate", 25L);
            }
#else
            Handheld.Vibrate();
#endif
        }

        private static void TriggerHapticHeavy()
        {
#if UNITY_ANDROID && !UNITY_EDITOR
            using (var unityPlayer = new AndroidJavaClass("com.unity3d.player.UnityPlayer"))
            using (var activity = unityPlayer.GetStatic<AndroidJavaObject>("currentActivity"))
            using (var vibrator = activity.Call<AndroidJavaObject>("getSystemService", "vibrator"))
            {
                vibrator.Call("vibrate", 50L);
            }
#else
            Handheld.Vibrate();
#endif
        }

        public float GetInputLatencyMs()
        {
            if (!IsMobileMode()) return 5f;

#if UNITY_ANDROID
            return 20f;
#elif UNITY_IOS
            return 15f;
#else
            return 30f;
#endif
        }

        public InputPromptInfo[] GetActivePrompts()
        {
            var prompts = new InputPromptInfo[KeyBindings.Length];

            for (int i = 0; i < KeyBindings.Length; i++)
            {
                prompts[i] = new InputPromptInfo
                {
                    color = KeyBindings[i].color,
                    keyboardKey = KeyBindings[i].displayName,
                    touchZoneIndex = i,
                    isActive = true
                };
            }

            return prompts;
        }
    }
}
