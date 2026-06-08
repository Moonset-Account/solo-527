using System;
using System.Collections;
using System.Collections.Generic;
using Kitchen.Config;
using Kitchen.Core;
using Kitchen.Save;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Kitchen.UI
{
    public class TutorialController : MonoBehaviour
    {
        [Header("References")]
        public GameObject tutorialPanel;
        public TextMeshProUGUI stepText;
        public TextMeshProUGUI stepCounterText;
        public Image highlightArrow;
        public GameObject nextButton;
        public GameObject skipButton;
        public GameObject advanceHint;
        public RectTransform focusRect;

        [Header("Runtime")]
        [SerializeField] private TutorialConfig currentConfig;
        [SerializeField] private int currentStepIndex = -1;
        [SerializeField] private bool isRunning;
        [SerializeField] private bool waitingForAction;
        [SerializeField] private TutorialAction pendingAction;
        [SerializeField] private float stepTimer;

        public event Action OnTutorialCompleted;
        public event Action<bool> OnTutorialEnded;

        public bool IsRunning => isRunning;

        private void OnEnable()
        {
            GameManager.OnStateChanged += HandleStateChanged;
        }

        private void OnDisable()
        {
            GameManager.OnStateChanged -= HandleStateChanged;
        }

        private void HandleStateChanged(GameManager.GameState oldS, GameManager.GameState newS)
        {
            if (newS == GameManager.GameState.Tutorial && GameManager.Instance.currentLevelConfig != null)
            {
                StartTutorial(GameManager.Instance.currentLevelConfig.tutorial);
            }
        }

        public void StartTutorial(TutorialConfig config)
        {
            if (config == null || config.steps == null || config.steps.Count == 0)
            {
                EndTutorial(false);
                return;
            }

            currentConfig = config;
            currentStepIndex = -1;
            isRunning = true;
            if (tutorialPanel != null) tutorialPanel.SetActive(true);
            AdvanceToNextStep();
        }

        private void AdvanceToNextStep()
        {
            currentStepIndex++;
            if (currentStepIndex >= currentConfig.steps.Count)
            {
                EndTutorial(false);
                return;
            }

            TutorialStep step = currentConfig.steps[currentStepIndex];
            if (stepText != null) stepText.text = step.instructionText;
            if (stepCounterText != null) stepCounterText.text = $"{currentStepIndex + 1}/{currentConfig.steps.Count}";

            if (highlightArrow != null) highlightArrow.enabled = step.showArrow;
            if (nextButton != null) nextButton.SetActive(step.requiredAction == TutorialAction.None);
            if (advanceHint != null) advanceHint.SetActive(step.requiredAction != TutorialAction.None);

            waitingForAction = step.requiredAction != TutorialAction.None;
            pendingAction = step.requiredAction;
            stepTimer = step.timeLimit;

            StartCoroutine(StepTimeoutRoutine(step));
        }

        private IEnumerator StepTimeoutRoutine(TutorialStep step)
        {
            if (step.timeLimit <= 0f) yield break;
            while (stepTimer > 0f && waitingForAction)
            {
                stepTimer -= Time.unscaledDeltaTime;
                yield return null;
            }
            if (waitingForAction)
            {
                waitingForAction = false;
                AdvanceToNextStep();
            }
        }

        public void ReportAction(TutorialAction action, string objectId = null)
        {
            if (!isRunning || !waitingForAction) return;
            if (pendingAction != action) return;
            waitingForAction = false;
            Invoke(nameof(AdvanceToNextStep), currentConfig.autoAdvanceDelay);
        }

        public void OnUserClickedNext()
        {
            if (!isRunning) return;
            waitingForAction = false;
            AdvanceToNextStep();
        }

        public void OnUserClickedSkip()
        {
            EndTutorial(true);
        }

        private void EndTutorial(bool skipped)
        {
            isRunning = false;
            waitingForAction = false;
            if (tutorialPanel != null) tutorialPanel.SetActive(false);

            if (SaveManager.Instance != null && GameManager.Instance?.currentLevelConfig != null)
            {
                SaveManager.Instance.RecordTutorialCompletion(GameManager.Instance.currentLevelConfig, skipped);
            }

            OnTutorialEnded?.Invoke(skipped);
            OnTutorialCompleted?.Invoke();

            GameManager.Instance?.ChangeState(GameManager.GameState.Countdown);
        }
    }
}
