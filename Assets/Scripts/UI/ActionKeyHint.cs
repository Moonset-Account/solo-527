using BeatRunner.Core;
using BeatRunner.Input;
using UnityEngine;
using UnityEngine.UI;

namespace BeatRunner.UI
{
    public class ActionKeyHint : MonoBehaviour
    {
        [SerializeField] private string _actionName;
        [SerializeField] private InputType _onlyShowFor;
        [SerializeField] private bool _showAll = true;

        [SerializeField] private Text[] _keyTexts;
        [SerializeField] private Image[] _keyIcons;
        [SerializeField] private GameObject _keyboardHintRoot;
        [SerializeField] private GameObject _touchHintRoot;
        [SerializeField] private GameObject _gamepadHintRoot;

        private InputType _currentInputType;

        private void OnEnable()
        {
            if (InputManager.Instance != null)
            {
                InputManager.Instance.OnInputTypeChanged += HandleInputTypeChanged;
                _currentInputType = InputManager.Instance.CurrentInputType;
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
            _currentInputType = type;
            Refresh();
        }

        public void SetAction(string actionName)
        {
            _actionName = actionName;
            Refresh();
        }

        public void Refresh()
        {
            if (_keyboardHintRoot) _keyboardHintRoot.SetActive(_currentInputType == InputType.Keyboard);
            if (_touchHintRoot) _touchHintRoot.SetActive(_currentInputType == InputType.Touch);
            if (_gamepadHintRoot) _gamepadHintRoot.SetActive(_currentInputType == InputType.Gamepad);

            if (_onlyShowFor != 0 && _currentInputType != _onlyShowFor)
            {
                gameObject.SetActive(false);
                return;
            }

            if (InputManager.Instance == null) return;
            string[] keys = InputManager.Instance.GetKeyHintsForAction(_actionName);

            for (int i = 0; i < _keyTexts.Length; i++)
            {
                if (_keyTexts[i] == null) continue;
                if (i < keys.Length)
                {
                    _keyTexts[i].text = keys[i];
                    _keyTexts[i].gameObject.SetActive(true);
                }
                else
                {
                    _keyTexts[i].gameObject.SetActive(_showAll);
                }
            }
        }
    }
}
