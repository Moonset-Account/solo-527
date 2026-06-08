using System;
using System.Collections.Generic;
using UnityEngine;
using Kitchen.Core;

namespace Kitchen.Input
{
    public class InputManager : MonoBehaviour
    {
        public static InputManager Instance { get; private set; }

        [Header("Input Profiles")]
        public InputProfile[] defaultProfiles = new InputProfile[4];
        public InputProfile[] runtimeProfiles = new InputProfile[4];

        [Header("Join Settings")]
        public KeyCode joinKeyP1 = KeyCode.Joystick1Button0;
        public KeyCode joinKeyP2 = KeyCode.Joystick2Button0;
        public KeyCode joinKeyP3 = KeyCode.Joystick3Button0;
        public KeyCode joinKeyP4 = KeyCode.Joystick4Button0;
        public bool allowKeyboardSplit = true;

        [Header("Runtime")]
        [SerializeField] private List<int> connectedPlayers = new List<int>();
        public IReadOnlyList<int> ConnectedPlayers => connectedPlayers;

        public event Action<int> OnPlayerJoinedInput;
        public event Action<int, InputAction, float> OnInputEvent;
        public event Action OnPausePressed;
        public event Action OnMenuPressed;

        private Dictionary<int, Vector2> currentMoveInput = new Dictionary<int, Vector2>();
        private Dictionary<int, bool> interactPressed = new Dictionary<int, bool>();
        private Dictionary<int, bool> switchPressed = new Dictionary<int, bool>();

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            InitializeDefaultBindings();
        }

        private void InitializeDefaultBindings()
        {
            for (int i = 0; i < 4; i++)
            {
                if (runtimeProfiles[i] == null && defaultProfiles[i] != null)
                {
                    runtimeProfiles[i] = Instantiate(defaultProfiles[i]);
                }
                else if (runtimeProfiles[i] == null)
                {
                    runtimeProfiles[i] = CreateDefaultProfile(i);
                }
            }
        }

        public InputProfile CreateDefaultProfile(int playerIndex)
        {
            InputProfile profile = ScriptableObject.CreateInstance<InputProfile>();
            profile.profileName = $"Player{playerIndex + 1}";

            if (playerIndex == 0)
            {
                profile.deviceType = InputDeviceType.KeyboardMouse;
                profile.bindings.AddRange(new[]
                {
                    new InputBinding { action = InputAction.MoveX, primaryKey = KeyCode.D, secondaryKey = KeyCode.A, isAxis = true },
                    new InputBinding { action = InputAction.MoveY, primaryKey = KeyCode.W, secondaryKey = KeyCode.S, isAxis = true },
                    new InputBinding { action = InputAction.Interact, primaryKey = KeyCode.E },
                    new InputBinding { action = InputAction.Drop, primaryKey = KeyCode.Q },
                    new InputBinding { action = InputAction.SwitchCharacter, primaryKey = KeyCode.Tab },
                    new InputBinding { action = InputAction.Pause, primaryKey = KeyCode.Escape },
                    new InputBinding { action = InputAction.Confirm, primaryKey = KeyCode.Space },
                    new InputBinding { action = InputAction.Cancel, primaryKey = KeyCode.Escape },
                });
            }
            else if (playerIndex == 1 && allowKeyboardSplit)
            {
                profile.deviceType = InputDeviceType.KeyboardMouse;
                profile.bindings.AddRange(new[]
                {
                    new InputBinding { action = InputAction.MoveX, primaryKey = KeyCode.RightArrow, secondaryKey = KeyCode.LeftArrow, isAxis = true },
                    new InputBinding { action = InputAction.MoveY, primaryKey = KeyCode.UpArrow, secondaryKey = KeyCode.DownArrow, isAxis = true },
                    new InputBinding { action = InputAction.Interact, primaryKey = KeyCode.KeypadEnter },
                    new InputBinding { action = InputAction.Drop, primaryKey = KeyCode.Keypad0 },
                    new InputBinding { action = InputAction.Confirm, primaryKey = KeyCode.KeypadEnter },
                    new InputBinding { action = InputAction.Cancel, primaryKey = KeyCode.Backspace },
                });
            }
            else
            {
                profile.deviceType = InputDeviceType.Gamepad;
                int padIndex = playerIndex + 1;
                profile.bindings.AddRange(new[]
                {
                    new InputBinding { action = InputAction.MoveX, isAxis = true, gamepadAxis = $"XAxis_{padIndex}" },
                    new InputBinding { action = InputAction.MoveY, isAxis = true, gamepadAxis = $"YAxis_{padIndex}", invertAxis = true },
                    new InputBinding { action = InputAction.Interact, gamepadButton = 0 },
                    new InputBinding { action = InputAction.Drop, gamepadButton = 1 },
                    new InputBinding { action = InputAction.SwitchCharacter, gamepadButton = 3 },
                    new InputBinding { action = InputAction.Pause, gamepadButton = 7 },
                    new InputBinding { action = InputAction.Confirm, gamepadButton = 0 },
                    new InputBinding { action = InputAction.Cancel, gamepadButton = 1 },
                });
            }

            return profile;
        }

        private void Update()
        {
            CheckPlayerJoin();
            ProcessAllPlayersInput();
            CheckGlobalInput();
        }

        private void CheckPlayerJoin()
        {
            if (!connectedPlayers.Contains(0) && IsJoinPressed(0))
            {
                JoinPlayer(0);
            }
            if (!connectedPlayers.Contains(1) && IsJoinPressed(1))
            {
                JoinPlayer(1);
            }
            if (!connectedPlayers.Contains(2) && IsJoinPressed(2))
            {
                JoinPlayer(2);
            }
            if (!connectedPlayers.Contains(3) && IsJoinPressed(3))
            {
                JoinPlayer(3);
            }
        }

        private bool IsJoinPressed(int playerIndex)
        {
            switch (playerIndex)
            {
                case 0: return UnityEngine.Input.GetKeyDown(KeyCode.E) || UnityEngine.Input.GetKeyDown(KeyCode.Joystick1Button0);
                case 1: return UnityEngine.Input.GetKeyDown(KeyCode.KeypadEnter) || UnityEngine.Input.GetKeyDown(KeyCode.Joystick2Button0);
                case 2: return UnityEngine.Input.GetKeyDown(KeyCode.Joystick3Button0);
                case 3: return UnityEngine.Input.GetKeyDown(KeyCode.Joystick4Button0);
                default: return false;
            }
        }

        private void JoinPlayer(int playerIndex)
        {
            if (connectedPlayers.Contains(playerIndex)) return;
            connectedPlayers.Add(playerIndex);
            currentMoveInput[playerIndex] = Vector2.zero;
            interactPressed[playerIndex] = false;
            switchPressed[playerIndex] = false;
            OnPlayerJoinedInput?.Invoke(playerIndex);
        }

        private void ProcessAllPlayersInput()
        {
            foreach (int pid in connectedPlayers)
            {
                ProcessPlayerInput(pid);
            }
        }

        private void ProcessPlayerInput(int playerIndex)
        {
            InputProfile profile = runtimeProfiles[playerIndex];
            if (profile == null) return;

            Vector2 move = Vector2.zero;

            foreach (var binding in profile.bindings)
            {
                float value = ReadBindingValue(binding);

                if (binding.isAxis)
                {
                    if (binding.action == InputAction.MoveX) move.x = value;
                    else if (binding.action == InputAction.MoveY) move.y = value;
                }
                else
                {
                    if (value > 0.5f)
                    {
                        OnInputEvent?.Invoke(playerIndex, binding.action, value);
                        HandleAction(playerIndex, binding.action);
                    }
                }
            }

            currentMoveInput[playerIndex] = move;
            ApplyMoveInputToPlayer(playerIndex, move);
        }

        private float ReadBindingValue(InputBinding binding)
        {
            float value = 0f;

            if (binding.primaryKey != KeyCode.None)
            {
                if (binding.isAxis)
                {
                    if (UnityEngine.Input.GetKey(binding.primaryKey)) value += 1f;
                    if (UnityEngine.Input.GetKey(binding.secondaryKey)) value -= 1f;
                }
                else
                {
                    value = UnityEngine.Input.GetKeyDown(binding.primaryKey) ? 1f : 0f;
                    if (value < 0.5f && binding.secondaryKey != KeyCode.None)
                        value = UnityEngine.Input.GetKeyDown(binding.secondaryKey) ? 1f : 0f;
                }
            }

            if (binding.isAxis && !string.IsNullOrEmpty(binding.gamepadAxis))
            {
                float axisVal = UnityEngine.Input.GetAxisRaw(binding.gamepadAxis);
                if (Mathf.Abs(axisVal) > 0.1f) value = binding.invertAxis ? -axisVal : axisVal;
            }

            if (!binding.isAxis && binding.gamepadButton >= 0)
            {
                if (UnityEngine.Input.GetKeyDown((KeyCode)System.Enum.Parse(typeof(KeyCode), $"JoystickButton{binding.gamepadButton}")))
                {
                    value = 1f;
                }
            }

            return value;
        }

        private void HandleAction(int playerIndex, InputAction action)
        {
            PlayerController pc = PlayerManager.Instance?.GetPlayer(playerIndex);
            if (pc == null) return;

            switch (action)
            {
                case InputAction.Interact:
                    pc.TryInteract();
                    break;
                case InputAction.Drop:
                    break;
                case InputAction.SwitchCharacter:
                    if (GameManager.Instance?.IsSinglePlayerMode == true)
                        PlayerManager.Instance?.SwitchActivePlayer();
                    break;
                case InputAction.Pause:
                    if (GameManager.Instance != null) GameManager.Instance.TogglePause();
                    break;
            }
        }

        private void ApplyMoveInputToPlayer(int playerIndex, Vector2 move)
        {
            PlayerController pc = PlayerManager.Instance?.GetPlayer(playerIndex);
            if (pc != null && pc.IsControllable)
            {
                pc.SetMoveInput(move);
            }
            else if (GameManager.Instance?.IsSinglePlayerMode == true)
            {
                PlayerController active = PlayerManager.Instance?.GetActivePlayer();
                if (active != null && playerIndex == 0) active.SetMoveInput(move);
            }
        }

        private void CheckGlobalInput()
        {
            if (UnityEngine.Input.GetKeyDown(KeyCode.P) || UnityEngine.Input.GetKeyDown(KeyCode.Escape))
            {
                if (GameManager.Instance?.CurrentState == GameManager.GameState.Playing ||
                    GameManager.Instance?.CurrentState == GameManager.GameState.Paused)
                {
                    GameManager.Instance?.TogglePause();
                }
            }
        }

        public Vector2 GetMoveInput(int playerIndex)
        {
            return currentMoveInput.TryGetValue(playerIndex, out var val) ? val : Vector2.zero;
        }

        public void RemapBinding(int playerIndex, InputAction action, KeyCode newKey, bool isPrimary = true)
        {
            if (playerIndex < 0 || playerIndex >= runtimeProfiles.Length) return;
            InputProfile profile = runtimeProfiles[playerIndex];
            if (profile == null) return;

            InputBinding binding = profile.bindings.Find(b => b.action == action);
            if (binding == null)
            {
                binding = new InputBinding { action = action };
                profile.bindings.Add(binding);
            }

            if (isPrimary) binding.primaryKey = newKey;
            else binding.secondaryKey = newKey;
        }

        public void ResetToDefault(int playerIndex)
        {
            if (playerIndex < 0 || playerIndex >= defaultProfiles.Length) return;
            if (defaultProfiles[playerIndex] != null)
            {
                runtimeProfiles[playerIndex] = Instantiate(defaultProfiles[playerIndex]);
            }
            else
            {
                runtimeProfiles[playerIndex] = CreateDefaultProfile(playerIndex);
            }
        }

        public List<InputBinding> GetBindings(int playerIndex)
        {
            if (playerIndex < 0 || playerIndex >= runtimeProfiles.Length) return new List<InputBinding>();
            return runtimeProfiles[playerIndex]?.bindings ?? new List<InputBinding>();
        }

        public void DisconnectPlayer(int playerIndex)
        {
            connectedPlayers.Remove(playerIndex);
        }
    }
}
