using System;
using System.Collections.Generic;
using UnityEngine;
using TeaGardenDefense.Config;

namespace TeaGardenDefense.Core
{
    public class TutorialManager
    {
        private int _currentStep;
        private bool _tutorialActive;
        private bool _tutorialCompleted;
        private string _currentLevelId;
        private LevelConfig _currentLevelConfig;

        private Queue<TutorialStep> _tutorialSteps;
        private TutorialStep _activeStep;
        private float _stepStartTime;

        public bool TutorialActive => _tutorialActive;
        public bool TutorialCompleted => _tutorialCompleted;
        public TutorialStep ActiveStep => _activeStep;
        public int CurrentStepIndex => _currentStep;
        public int TotalSteps => _tutorialSteps?.Count ?? 0;

        public event Action<TutorialStep> OnTutorialStepStart;
        public event Action<TutorialStep> OnTutorialStepComplete;
        public event Action OnTutorialCompleted;
        public event Action OnTutorialDismissed;

        public TutorialManager()
        {
            _tutorialSteps = new Queue<TutorialStep>();
        }

        public void Initialize(LevelConfig levelConfig)
        {
            _currentLevelId = levelConfig.levelId;
            _currentLevelConfig = levelConfig;
            _currentStep = 0;
            _tutorialCompleted = false;

            bool showTutorial = SaveSystem.Instance.PlayerData.settings.showTutorial;
            if (!showTutorial)
            {
                _tutorialCompleted = true;
                _tutorialActive = false;
                return;
            }

            BuildTutorialSteps(levelConfig);
            _tutorialActive = _tutorialSteps.Count > 0;

            if (_tutorialActive)
            {
                StartNextStep();
            }
        }

        private void BuildTutorialSteps(LevelConfig level)
        {
            _tutorialSteps.Clear();

            AddStep(new TutorialStep
            {
                stepId = "welcome",
                title = $"欢迎来到「{level.levelName}」",
                message = level.description,
                highlightType = TutorialHighlightType.None,
                displayDuration = 4f,
                priority = 0,
                autoAdvance = true,
                inputActionToAdvance = "confirm"
            });

            AddStep(new TutorialStep
            {
                stepId = "path",
                title = "运输路线",
                message = "这条山路是采摘车的必经之路。害虫会从左侧入侵，保护右侧的仓库！",
                highlightType = TutorialHighlightType.Path,
                displayDuration = 3f,
                autoAdvance = true,
                inputActionToAdvance = "confirm"
            });

            AddStep(new TutorialStep
            {
                stepId = "tower_slots",
                title = "放置防御塔",
                message = "点击发光的塔位图标可以查看可选塔型。选择合适的塔进行建造！\n按数字键 1-5 也可以快速选择塔型。",
                highlightType = TutorialHighlightType.TowerSlots,
                displayDuration = 5f,
                autoAdvance = true,
                inputActionToAdvance = "confirm"
            });

            if (!string.IsNullOrEmpty(level.tutorialMessage))
            {
                AddStep(new TutorialStep
                {
                    stepId = "level_hint",
                    title = "关卡提示",
                    message = level.tutorialMessage,
                    highlightType = TutorialHighlightType.None,
                    displayDuration = 4f,
                    autoAdvance = true,
                    inputActionToAdvance = "confirm"
                });
            }

            if (level.weatherPatterns.Count > 1)
            {
                AddStep(new TutorialStep
                {
                    stepId = "weather",
                    title = "天气系统",
                    message = "本关会出现不同天气！注意天气变化对塔属性的影响，屏幕上方有天气提示。",
                    highlightType = TutorialHighlightType.Weather,
                    displayDuration = 3.5f,
                    autoAdvance = true,
                    inputActionToAdvance = "confirm"
                });
            }

            AddStep(new TutorialStep
            {
                stepId = "start_wave",
                title = "开始战斗！",
                message = "准备好了就按空格键或点击「开始波次」按钮！按住 Shift 可以加速游戏。",
                highlightType = TutorialHighlightType.StartButton,
                displayDuration = 0,
                autoAdvance = false,
                inputActionToAdvance = "start_wave"
            });
        }

        private void AddStep(TutorialStep step)
        {
            step.stepIndex = _tutorialSteps.Count;
            _tutorialSteps.Enqueue(step);
        }

        private void StartNextStep()
        {
            if (_tutorialSteps.Count == 0)
            {
                CompleteTutorial();
                return;
            }

            _activeStep = _tutorialSteps.Dequeue();
            _stepStartTime = Time.time;
            _currentStep = _activeStep.stepIndex;
            OnTutorialStepStart?.Invoke(_activeStep);
        }

        public void Update(float deltaTime)
        {
            if (!_tutorialActive || _activeStep == null) return;

            if (_activeStep.displayDuration > 0 && _activeStep.autoAdvance)
            {
                if (Time.time - _stepStartTime >= _activeStep.displayDuration)
                {
                    CompleteCurrentStep();
                }
            }
        }

        public void HandleInputAction(string actionName)
        {
            if (!_tutorialActive || _activeStep == null) return;

            if (actionName == _activeStep.inputActionToAdvance || actionName == "confirm")
            {
                CompleteCurrentStep();
            }
        }

        public void CompleteCurrentStep()
        {
            if (_activeStep == null) return;

            OnTutorialStepComplete?.Invoke(_activeStep);
            _activeStep = null;

            if (_tutorialSteps.Count == 0)
            {
                CompleteTutorial();
            }
            else
            {
                StartNextStep();
            }
        }

        private void CompleteTutorial()
        {
            _tutorialActive = false;
            _tutorialCompleted = true;
            OnTutorialCompleted?.Invoke();
        }

        public void SkipTutorial()
        {
            _tutorialSteps.Clear();
            _activeStep = null;
            _tutorialActive = false;
            _tutorialCompleted = true;
            OnTutorialDismissed?.Invoke();
        }

        public void DismissStep()
        {
            CompleteCurrentStep();
        }

        public void ResetTutorial()
        {
            _currentStep = 0;
            _tutorialCompleted = false;
            _activeStep = null;
            if (_currentLevelConfig != null)
            {
                Initialize(_currentLevelConfig);
            }
        }

        public void MarkTutorialShownForever()
        {
            SaveSystem.Instance.PlayerData.settings.showTutorial = false;
            SaveSystem.Instance.SavePlayerData();
        }
    }

    [Serializable]
    public class TutorialStep
    {
        public int stepIndex;
        public string stepId;
        public string title;
        public string message;
        public TutorialHighlightType highlightType;
        public Vector3 highlightPosition;
        public float displayDuration;
        public bool autoAdvance;
        public string inputActionToAdvance;
        public int priority;
    }

    public enum TutorialHighlightType
    {
        None,
        TowerSlots,
        Path,
        Base,
        StartButton,
        ResourcePanel,
        TowerCard,
        Weather,
        SpecificTower,
        WaveInfo
    }
}
