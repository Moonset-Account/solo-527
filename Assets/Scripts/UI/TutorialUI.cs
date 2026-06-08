using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class TutorialUI : MonoBehaviour
{
    public TMPro.TextMeshProUGUI stepText;
    public Image highlightCircle;
    public int stepIndex;
    public List<TutorialStep> tutorialSteps;

    private void OnEnable()
    {
        if (LevelManager.Instance != null && LevelManager.Instance.currentLevelData != null)
            tutorialSteps = LevelManager.Instance.currentLevelData.tutorialSteps;

        stepIndex = 0;
        ShowStep(stepIndex);
    }

    public void ShowStep(int index)
    {
        if (tutorialSteps == null || index < 0 || index >= tutorialSteps.Count)
            return;

        TutorialStep step = tutorialSteps[index];
        stepText.text = step.description;

        highlightCircle.rectTransform.anchoredPosition = step.highlightPosition;
        highlightCircle.rectTransform.sizeDelta = new Vector2(step.highlightRadius * 2f, step.highlightRadius * 2f);
        highlightCircle.gameObject.SetActive(true);
    }

    public void AdvanceStep()
    {
        if (tutorialSteps == null) return;

        tutorialSteps[stepIndex].isCompleted = true;
        stepIndex++;

        if (stepIndex >= tutorialSteps.Count)
        {
            CompleteTutorial();
        }
        else
        {
            ShowStep(stepIndex);
        }
    }

    public void CompleteTutorial()
    {
        stepText.text = "Tutorial Complete!";
        highlightCircle.gameObject.SetActive(false);
        GameManager.Instance.CompleteLevel();
    }
}
