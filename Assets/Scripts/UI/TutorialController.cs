using System;
using System.Collections;
using System.Collections.Generic;
using BeatRunner.Core;
using BeatRunner.Data;
using BeatRunner.Input;
using BeatRunner.Tools;
using UnityEngine;
using UnityEngine.UI;

namespace BeatRunner.UI
{
    public class TutorialController : MonoBehaviour
    {
        [Serializable]
        public class TutorialStep
        {
            public string message;
            public string actionKey;
            public float autoAdvanceDelay = -1f;
            public bool requiresInput;
            public int spawnDemoBeatOffset = -1;
        }

        [SerializeField] private GameObject _tutorialRoot;
        [SerializeField] private Text _messageText;
        [SerializeField] private Text _keyHintText;
        [SerializeField] private GameObject _keyboardHints;
        [SerializeField] private GameObject _touchHints;
        [SerializeField] private GameObject _gamepadHints;
        [SerializeField] private Button _skipButton;
        [SerializeField] private Image _progressFill;

        [SerializeField] private List<TutorialStep> _steps = new List<TutorialStep>
        {
            new TutorialStep { message = "欢迎来到节拍跑酷！跟随鼓点节奏操作，收集节奏碎片解锁更多曲目。", autoAdvanceDelay = 3.5f },
            new TutorialStep { message = "在鼓点时按跳跃键跳过矮障碍", actionKey = "jump", requiresInput = true, spawnDemoBeatOffset = 4 },
            new TutorialStep { message = "按滑行键滑过低空障碍", actionKey = "slide", requiresInput = true, spawnDemoBeatOffset = 4 },
            new TutorialStep { message = "用方向键或 A/D 切换左右轨道", actionKey = "left", requiresInput = true, spawnDemoBeatOffset = 4 },
            new TutorialStep { message = "现在开始正式挑战！祝你好运！", autoAdvanceDelay = 2.5f }
        };

        private int _currentStep;
        private Coroutine _autoAdvanceCoroutine;
        private InputType _lastInputType;
        private TrackData _tutorialTrack;
        private bool _waitingForInput;

        public event Action OnTutorialComplete;
        public event Action OnTutorialSkipped;

        public bool IsRunning => _currentStep < _steps.Count;

        private void OnEnable()
        {
            if (_skipButton) _skipButton.onClick.AddListener(SkipTutorial);

            if (InputManager.Instance != null)
            {
                InputManager.Instance.OnInputTypeChanged += UpdateInputHints;
                InputManager.Instance.OnJump += OnJumpInput;
                InputManager.Instance.OnSlide += OnSlideInput;
                InputManager.Instance.OnLeft += OnLaneInput;
                InputManager.Instance.OnRight += OnLaneInput;
            }

            ServiceLocator.TryGet(out RuntimeGameData data);
            if (data != null)
            {
                _lastInputType = data.currentInputType;
                UpdateInputHints(_lastInputType);
            }

            UpdateInputHints(InputManager.Instance != null
                ? InputManager.Instance.CurrentInputType
                : InputType.Keyboard);
        }

        private void OnDisable()
        {
            if (_skipButton) _skipButton.onClick.RemoveListener(SkipTutorial);

            if (InputManager.Instance != null)
            {
                InputManager.Instance.OnInputTypeChanged -= UpdateInputHints;
                InputManager.Instance.OnJump -= OnJumpInput;
                InputManager.Instance.OnSlide -= OnSlideInput;
                InputManager.Instance.OnLeft -= OnLaneInput;
                InputManager.Instance.OnRight -= OnLaneInput;
            }

            if (_autoAdvanceCoroutine != null) StopCoroutine(_autoAdvanceCoroutine);
        }

        public void StartTutorial()
        {
            if (_tutorialRoot) _tutorialRoot.SetActive(true);
            _currentStep = 0;
            ShowCurrentStep();
            SaveSystem.CurrentSave.tutorialCompleted = false;
        }

        public TrackData GetTutorialTrack()
        {
            if (_tutorialTrack == null)
            {
                _tutorialTrack = ScriptableObject.CreateInstance<TrackData>();
                _tutorialTrack.trackId = "tutorial";
                _tutorialTrack.trackName = "教程";
                _tutorialTrack.artistName = "节奏引导";
                _tutorialTrack.bpm = 100f;
                _tutorialTrack.description = "学习核心操作";
                _tutorialTrack.themeColor = new Color(0.5f, 0.8f, 1f);
                _tutorialTrack.isUnlockedByDefault = true;
                _tutorialTrack.normalLevel = LevelGenerator.GenerateTutorialLevel();
                _tutorialTrack.easyLevel = _tutorialTrack.normalLevel;
                _tutorialTrack.hardLevel = _tutorialTrack.normalLevel;
            }
            return _tutorialTrack;
        }

        private void ShowCurrentStep()
        {
            if (_currentStep >= _steps.Count)
            {
                CompleteTutorial();
                return;
            }

            var step = _steps[_currentStep];
            if (_messageText) _messageText.text = step.message;
            if (_progressFill) _progressFill.fillAmount = (float)_currentStep / _steps.Count;

            UpdateInputHints(InputManager.Instance != null
                ? InputManager.Instance.CurrentInputType
                : _lastInputType);

            string keyStr = "";
            if (!string.IsNullOrEmpty(step.actionKey) && InputManager.Instance != null)
            {
                var keys = InputManager.Instance.GetKeyHintsForAction(step.actionKey);
                keyStr = string.Join(" / ", keys);
            }
            if (_keyHintText) _keyHintText.text = keyStr;

            _waitingForInput = step.requiresInput;

            if (step.autoAdvanceDelay > 0f)
            {
                _waitingForInput = false;
                if (_autoAdvanceCoroutine != null) StopCoroutine(_autoAdvanceCoroutine);
                _autoAdvanceCoroutine = StartCoroutine(AutoAdvance(step.autoAdvanceDelay));
            }
        }

        private IEnumerator AutoAdvance(float delay)
        {
            yield return new WaitForSeconds(delay);
            AdvanceStep();
        }

        private void OnJumpInput()
        {
            if (!_waitingForInput || _currentStep >= _steps.Count) return;
            if (_steps[_currentStep].actionKey == "jump") AdvanceStep();
        }

        private void OnSlideInput()
        {
            if (!_waitingForInput || _currentStep >= _steps.Count) return;
            if (_steps[_currentStep].actionKey == "slide") AdvanceStep();
        }

        private void OnLaneInput()
        {
            if (!_waitingForInput || _currentStep >= _steps.Count) return;
            if (_steps[_currentStep].actionKey == "left" || _steps[_currentStep].actionKey == "right")
            {
                AdvanceStep();
            }
        }

        private void AdvanceStep()
        {
            _currentStep++;
            ShowCurrentStep();
        }

        private void UpdateInputHints(InputType type)
        {
            _lastInputType = type;
            if (_keyboardHints) _keyboardHints.SetActive(type == InputType.Keyboard);
            if (_touchHints) _touchHints.SetActive(type == InputType.Touch);
            if (_gamepadHints) _gamepadHints.SetActive(type == InputType.Gamepad);
        }

        public void SkipTutorial()
        {
            if (_autoAdvanceCoroutine != null) StopCoroutine(_autoAdvanceCoroutine);
            CompleteTutorial(true);
        }

        private void CompleteTutorial(bool skipped = false)
        {
            SaveSystem.CurrentSave.tutorialCompleted = true;
            SaveSystem.SaveSaveData();

            if (_tutorialRoot) _tutorialRoot.SetActive(false);

            if (skipped)
            {
                OnTutorialSkipped?.Invoke();
            }
            else
            {
                OnTutorialComplete?.Invoke();
            }
        }

        public void SetVisible(bool visible)
        {
            if (_tutorialRoot) _tutorialRoot.SetActive(visible);
        }
    }
}
