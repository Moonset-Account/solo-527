using System.Collections.Generic;
using UnityEngine;

#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif

public class InputMapper : MonoBehaviour
{
    public static InputMapper Instance { get; private set; }

    public event System.Action<string> InputActionTriggered;

    private Dictionary<string, KeyCode> _keyBindings = new Dictionary<string, KeyCode>();
    private Dictionary<string, bool> _previousFrameState = new Dictionary<string, bool>();

    private static readonly string[] ActionNames = new string[]
    {
        "Move", "Confirm", "Cancel", "Pause", "Zoom", "Photo", "OpenMap", "OpenSupply", "OpenCollection"
    };

    private static readonly Dictionary<string, KeyCode> DefaultBindings = new Dictionary<string, KeyCode>
    {
        { "Move", KeyCode.W },
        { "Confirm", KeyCode.Return },
        { "Cancel", KeyCode.Escape },
        { "Pause", KeyCode.P },
        { "Zoom", KeyCode.Z },
        { "Photo", KeyCode.F },
        { "OpenMap", KeyCode.M },
        { "OpenSupply", KeyCode.I },
        { "OpenCollection", KeyCode.C }
    };

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
        DontDestroyOnLoad(gameObject);
        LoadBindings();
    }

    private void Update()
    {
        foreach (var action in ActionNames)
        {
            bool currentDown = GetButtonDownInternal(action);
            bool previousDown = _previousFrameState.ContainsKey(action) && _previousFrameState[action];

            if (currentDown && !previousDown)
            {
                InputActionTriggered?.Invoke(action);
                GameEvents.TriggerInputActionTriggered(action);
            }

            _previousFrameState[action] = currentDown;
        }
    }

    public Vector2 GetAxis(string action)
    {
        if (action != "Move") return Vector2.zero;

#if ENABLE_INPUT_SYSTEM
        if (Keyboard.current != null)
        {
            Vector2 dir = Vector2.zero;
            if (Keyboard.current.wKey.isPressed || Keyboard.current.upArrowKey.isPressed) dir.y += 1f;
            if (Keyboard.current.sKey.isPressed || Keyboard.current.downArrowKey.isPressed) dir.y -= 1f;
            if (Keyboard.current.aKey.isPressed || Keyboard.current.leftArrowKey.isPressed) dir.x -= 1f;
            if (Keyboard.current.dKey.isPressed || Keyboard.current.rightArrowKey.isPressed) dir.x += 1f;
            return dir.normalized;
        }
#endif

        float h = Input.GetAxisRaw("Horizontal");
        float v = Input.GetAxisRaw("Vertical");
        return new Vector2(h, v).normalized;
    }

    public bool GetButtonDown(string action)
    {
        return GetButtonDownInternal(action);
    }

    private bool GetButtonDownInternal(string action)
    {
#if ENABLE_INPUT_SYSTEM
        if (Keyboard.current == null) return false;

        if (!_keyBindings.ContainsKey(action)) return false;
        KeyCode key = _keyBindings[action];

        switch (key)
        {
            case KeyCode.W: return Keyboard.current.wKey.wasPressedThisFrame;
            case KeyCode.A: return Keyboard.current.aKey.wasPressedThisFrame;
            case KeyCode.S: return Keyboard.current.sKey.wasPressedThisFrame;
            case KeyCode.D: return Keyboard.current.dKey.wasPressedThisFrame;
            case KeyCode.Return: return Keyboard.current.enterKey.wasPressedThisFrame;
            case KeyCode.Escape: return Keyboard.current.escapeKey.wasPressedThisFrame;
            case KeyCode.P: return Keyboard.current.pKey.wasPressedThisFrame;
            case KeyCode.Z: return Keyboard.current.zKey.wasPressedThisFrame;
            case KeyCode.F: return Keyboard.current.fKey.wasPressedThisFrame;
            case KeyCode.M: return Keyboard.current.mKey.wasPressedThisFrame;
            case KeyCode.I: return Keyboard.current.iKey.wasPressedThisFrame;
            case KeyCode.C: return Keyboard.current.cKey.wasPressedThisFrame;
            case KeyCode.UpArrow: return Keyboard.current.upArrowKey.wasPressedThisFrame;
            case KeyCode.DownArrow: return Keyboard.current.downArrowKey.wasPressedThisFrame;
            case KeyCode.LeftArrow: return Keyboard.current.leftArrowKey.wasPressedThisFrame;
            case KeyCode.RightArrow: return Keyboard.current.rightArrowKey.wasPressedThisFrame;
            case KeyCode.Space: return Keyboard.current.spaceKey.wasPressedThisFrame;
            default: return false;
        }
#else
        if (!_keyBindings.ContainsKey(action)) return false;
        return Input.GetKeyDown(_keyBindings[action]);
#endif
    }

    public void RebindAction(string action, KeyCode newKey)
    {
        if (_keyBindings.ContainsKey(action))
        {
            _keyBindings[action] = newKey;
            PlayerPrefs.SetString("Input_" + action, newKey.ToString());
            PlayerPrefs.Save();
        }
    }

    public KeyCode GetBinding(string action)
    {
        if (_keyBindings.ContainsKey(action)) return _keyBindings[action];
        return KeyCode.None;
    }

    private void LoadBindings()
    {
        foreach (var kvp in DefaultBindings)
        {
            string saved = PlayerPrefs.GetString("Input_" + kvp.Key, "");
            if (!string.IsNullOrEmpty(saved) && System.Enum.IsDefined(typeof(KeyCode), saved))
            {
                _keyBindings[kvp.Key] = (KeyCode)System.Enum.Parse(typeof(KeyCode), saved);
            }
            else
            {
                _keyBindings[kvp.Key] = kvp.Value;
            }
        }
    }
}
