using BeatRunner.Core;
using BeatRunner.Input;
using UnityEngine;
using UnityEngine.UI;

namespace BeatRunner.UI
{
    public class InputTypeDisplay : MonoBehaviour
    {
        [SerializeField] private GameObject _keyboardPanel;
        [SerializeField] private GameObject _touchPanel;
        [SerializeField] private GameObject _gamepadPanel;
        [SerializeField] private Text _currentInputText;
        [SerializeField] private Image _currentInputIcon;

        [SerializeField] private Sprite _keyboardIcon;
        [SerializeField] private Sprite _touchIcon;
        [SerializeField] private Sprite _gamepadIcon;

        [SerializeField] private Color _highlightColor = new Color(0.3f, 0.6f, 1f);

        private InputType _currentType;

        private void OnEnable()
        {
            if (InputManager.Instance != null)
            {
                _currentType = InputManager.Instance.CurrentInputType;
                InputManager.Instance.OnInputTypeChanged += HandleInputTypeChanged;
            }
            Refresh();
        }

        private void OnDisable()
        {
            if (InputManager.Instance != null)
            {
                InputManager.Instance.OnInputTypeChanged -= HandleInputTypeChanged;
            }
        }

        private void HandleInputTypeChanged(InputType type)
        {
            _currentType = type;
            Refresh();
        }

        public void Refresh()
        {
            if (_keyboardPanel != null)
            {
                SetPanelActive(_keyboardPanel, _currentType == InputType.Keyboard);
            }
            if (_touchPanel != null)
            {
                SetPanelActive(_touchPanel, _currentType == InputType.Touch);
            }
            if (_gamepadPanel != null)
            {
                SetPanelActive(_gamepadPanel, _currentType == InputType.Gamepad);
            }

            if (_currentInputText != null)
            {
                switch (_currentType)
                {
                    case InputType.Keyboard: _currentInputText.text = "键盘"; break;
                    case InputType.Touch: _currentInputText.text = "触屏"; break;
                    case InputType.Gamepad: _currentInputText.text = "手柄"; break;
                }
            }

            if (_currentInputIcon != null)
            {
                switch (_currentType)
                {
                    case InputType.Keyboard: _currentInputIcon.sprite = _keyboardIcon; break;
                    case InputType.Touch: _currentInputIcon.sprite = _touchIcon; break;
                    case InputType.Gamepad: _currentInputIcon.sprite = _gamepadIcon; break;
                }
            }
        }

        private void SetPanelActive(GameObject panel, bool active)
        {
            foreach (var img in panel.GetComponentsInChildren<Image>(true))
            {
                if (img.gameObject == panel) continue;
                var c = img.color;
                c.a = active ? 1f : 0.3f;
                img.color = c;
            }
            foreach (var txt in panel.GetComponentsInChildren<Text>(true))
            {
                var c = txt.color;
                c.a = active ? 1f : 0.4f;
                txt.color = c;
            }
        }
    }
}
