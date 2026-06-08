using System;
using UnityEngine;
using YouthTrainingManagement.UI;

namespace YouthTrainingManagement.Core
{
    public class BootState : GameStateBase
    {
        public BootState(GameManager gameManager) : base(gameManager) { }

        public override void Enter()
        {
            Application.targetFrameRate = GameManager.Settings.TargetFrameRate;
            GameManager.AudioManager.Initialize();
            GameManager.InputManager.Initialize();
            GameManager.SaveSystem.Initialize();

            if (!GameManager.SaveSystem.HasSaveData() || GameManager.Settings.ShowTutorialOnFirstLaunch)
            {
                GameManager.StateMachine.ChangeState<TutorialState>();
            }
            else
            {
                GameManager.StateMachine.ChangeState<MainMenuState>();
            }
        }

        public override void Exit() { }
    }

    public class MainMenuState : GameStateBase
    {
        public MainMenuState(GameManager gameManager) : base(gameManager) { }

        public override void Enter()
        {
            GameManager.UIManager.ShowScreen(UIScreen.Dashboard);
            GameManager.TimeSystem.Unpause();
        }

        public override void Exit()
        {
            GameManager.UIManager.HideScreen(UIScreen.Dashboard);
        }
    }

    public class TutorialState : GameStateBase
    {
        private int _currentStep;
        private TutorialData _tutorialData;

        public TutorialState(GameManager gameManager) : base(gameManager) { }

        public override void Enter()
        {
            _currentStep = 0;
            _tutorialData = GameManager.Config.GetTutorialData();
            if (_tutorialData == null || _tutorialData.Steps == null || _tutorialData.Steps.Count == 0)
            {
                GameManager.StateMachine.ChangeState<MainMenuState>();
                return;
            }
            ShowCurrentStep();
        }

        public override void Exit()
        {
            GameManager.UIManager.HideScreen(UIScreen.Tutorial);
        }

        public void NextStep()
        {
            _currentStep++;
            if (_currentStep >= _tutorialData.Steps.Count)
            {
                GameManager.Settings.CompletedTutorial = true;
                GameManager.Settings.ShowTutorialOnFirstLaunch = false;
                GameManager.SaveSystem.SaveAll();
                GameManager.InitializeNewGame();
                GameManager.StateMachine.ChangeState<MainMenuState>();
            }
            else
            {
                ShowCurrentStep();
            }
        }

        public void SkipTutorial()
        {
            GameManager.InitializeNewGame();
            GameManager.StateMachine.ChangeState<MainMenuState>();
        }

        private void ShowCurrentStep()
        {
            var step = _tutorialData.Steps[_currentStep];
            GameManager.UIManager.ShowTutorialStep(step, _currentStep, _tutorialData.Steps.Count);
            GameManager.UIManager.ShowScreen(UIScreen.Tutorial);
        }

        public TutorialStep GetCurrentStep() => _tutorialData?.Steps != null && _currentStep < _tutorialData.Steps.Count
            ? _tutorialData.Steps[_currentStep] : null;

        public void CompleteTutorial()
        {
            GameManager.Settings.CompletedTutorial = true;
            GameManager.Settings.ShowTutorialOnFirstLaunch = false;
            GameManager.SaveSystem.SaveSettings();
            if (GameManager.Season == null)
                GameManager.InitializeNewGame();
            GameManager.StateMachine.ChangeState<MainMenuState>();
        }
    }

    public class PlayingState : GameStateBase
    {
        public PlayingState(GameManager gameManager) : base(gameManager) { }

        public override void Enter()
        {
            GameManager.TimeSystem.Unpause();
        }

        public override void Exit() { }

        public override void Update(float deltaTime)
        {
            GameManager.TimeSystem.UpdateTime(deltaTime);
        }
    }

    public class PausedState : GameStateBase
    {
        public PausedState(GameManager gameManager) : base(gameManager) { }

        public override void Enter()
        {
            GameManager.TimeSystem.Pause();
            GameManager.UIManager.ShowScreen(UIScreen.Pause);
        }

        public override void Exit()
        {
            GameManager.TimeSystem.Unpause();
            GameManager.UIManager.HideScreen(UIScreen.Pause);
        }

        public void Resume()
        {
            GameManager.StateMachine.ChangeState<PlayingState>();
        }

        public void ResumeGame() => Resume();

        public void GoToMainMenu()
        {
            GameManager.SaveSystem.SaveAll();
            GameManager.StateMachine.ChangeState<MainMenuState>();
        }

        public void QuitGame()
        {
            GameManager.SaveSystem.SaveAll();
#if UNITY_EDITOR
            UnityEditor.EditorApplication.isPlaying = false;
#else
            Application.Quit();
#endif
        }
    }

    public class SettingsState : GameStateBase
    {
        public SettingsState(GameManager gameManager) : base(gameManager) { }

        public override void Enter()
        {
            GameManager.UIManager.ShowScreen(UIScreen.Settings);
        }

        public override void Exit()
        {
            GameManager.UIManager.HideScreen(UIScreen.Settings);
            GameManager.SaveSystem.SaveSettings();
        }

        public void ApplySettings(GameSettings newSettings)
        {
            GameManager.ApplySettings(newSettings);
        }

        public void Back()
        {
            if (GameManager.StateMachine.CurrentState == this)
            {
                GameManager.StateMachine.ChangeState<PlayingState>();
            }
        }

        public void CloseSettings() => Back();
    }

    public class TrainingState : GameStateBase
    {
        public TrainingState(GameManager gameManager) : base(gameManager) { }

        public override void Enter()
        {
            GameManager.UIManager.ShowScreen(UIScreen.Training);
        }

        public override void Exit()
        {
            GameManager.UIManager.HideScreen(UIScreen.Training);
        }

        public void CompleteTraining()
        {
            GameManager.StateMachine.ChangeState<PlayingState>();
        }
    }

    public class MatchState : GameStateBase
    {
        public MatchState(GameManager gameManager) : base(gameManager) { }

        public override void Enter()
        {
            GameManager.UIManager.ShowScreen(UIScreen.Match);
            GameManager.MatchSystem.StartNextMatch();
        }

        public override void Exit()
        {
            GameManager.UIManager.HideScreen(UIScreen.Match);
        }

        public void CompleteMatch(bool played = true)
        {
            if (played) GameManager.TimeSystem?.AdvancePhaseAfterMatch();
            GameManager.StateMachine.ChangeState<PlayingState>();
        }
    }

    public class RecoveryState : GameStateBase
    {
        public RecoveryState(GameManager gameManager) : base(gameManager) { }

        public override void Enter()
        {
            GameManager.UIManager.ShowScreen(UIScreen.Recovery);
        }

        public override void Exit()
        {
            GameManager.UIManager.HideScreen(UIScreen.Recovery);
        }

        public void CompleteRecovery()
        {
            GameManager.StateMachine.ChangeState<PlayingState>();
        }
    }

    public class ResultScreenState : GameStateBase
    {
        public ResultScreenState(GameManager gameManager) : base(gameManager) { }

        public override void Enter()
        {
            GameManager.UIManager.ShowScreen(UIScreen.Result);
        }

        public override void Exit()
        {
            GameManager.UIManager.HideScreen(UIScreen.Result);
        }

        public void Continue()
        {
            GameManager.StateMachine.ChangeState<PlayingState>();
        }
    }

    public class GameOverState : GameStateBase
    {
        public GameOverState(GameManager gameManager) : base(gameManager) { }

        public override void Enter()
        {
            GameManager.SaveSystem.DeleteSave();
        }

        public override void Exit() { }

        public void Restart()
        {
            GameManager.InitializeNewGame();
            GameManager.StateMachine.ChangeState<MainMenuState>();
        }
    }
}
