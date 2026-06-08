using System.Collections.Generic;
using UnityEngine;

namespace DecorMatch3
{
    public class InputManager : MonoBehaviour
    {
        public static InputManager Instance { get; private set; }

        private Dictionary<string, KeyCode> _actionBindings = new Dictionary<string, KeyCode>();

        private float _frameRateCheckTimer;
        private float _frameRateCheckInterval = 5f;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        public void Init()
        {
            _actionBindings["Swap"] = KeyCode.Mouse0;
            _actionBindings["Confirm"] = KeyCode.Return;
            _actionBindings["Cancel"] = KeyCode.Escape;
            _actionBindings["Pause"] = KeyCode.Escape;

            if (SaveManager.Instance != null && SaveManager.Instance.CurrentSave != null)
            {
                var settings = SaveManager.Instance.CurrentSave.settings;
                if (settings.keyBindings != null)
                {
                    foreach (var pair in settings.keyBindings)
                    {
                        if (System.Enum.TryParse(pair.value, out KeyCode key))
                        {
                            _actionBindings[pair.key] = key;
                        }
                    }
                }
            }
        }

        public void RemapAction(string actionName, KeyCode newKey)
        {
            if (_actionBindings.ContainsKey(actionName))
            {
                _actionBindings[actionName] = newKey;
            }
            else
            {
                _actionBindings.Add(actionName, newKey);
            }

            if (SaveManager.Instance != null && SaveManager.Instance.CurrentSave != null)
            {
                var settings = SaveManager.Instance.CurrentSave.settings;
                var bindings = new List<StringPair>();
                if (settings.keyBindings != null)
                {
                    bindings = new List<StringPair>(settings.keyBindings);
                }
                var existing = bindings.Find(b => b.key == actionName);
                if (existing != null)
                {
                    existing.value = newKey.ToString();
                }
                else
                {
                    bindings.Add(new StringPair { key = actionName, value = newKey.ToString() });
                }
                settings.keyBindings = bindings;
            }
        }

        public KeyCode GetBinding(string actionName)
        {
            if (_actionBindings.TryGetValue(actionName, out KeyCode key))
            {
                return key;
            }
            return KeyCode.None;
        }

        public Vector2 GetPointerPosition()
        {
            return Input.mousePosition;
        }

        public bool GetSwapInput()
        {
            return Input.GetMouseButtonDown(0);
        }

        public bool GetConfirmInput()
        {
            return Input.GetKeyDown(GetBinding("Confirm"));
        }

        public bool GetCancelInput()
        {
            return Input.GetKeyDown(GetBinding("Cancel"));
        }

        public bool GetPauseInput()
        {
            return Input.GetKeyDown(GetBinding("Pause"));
        }

        private void Update()
        {
            _frameRateCheckTimer += Time.unscaledDeltaTime;
            if (_frameRateCheckTimer >= _frameRateCheckInterval)
            {
                _frameRateCheckTimer = 0f;
                if (PerformanceMonitor.Instance != null)
                {
                    PerformanceMonitor.Instance.AdaptFrameRate();
                    Application.targetFrameRate = PerformanceMonitor.Instance.TargetFrameRate;
                }
            }
        }
    }
}
