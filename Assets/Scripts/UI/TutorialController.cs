using UnityEngine;
using UnityEngine.UI;

namespace InkMountainBridge
{
    public class TutorialController : MonoBehaviour
    {
        public string[] tutorialSteps;
        public int currentStep;
        public Text stepIndicator;
        public Button nextButton;
        public GameObject highlightArea;

        private void OnEnable()
        {
            if (nextButton != null)
                nextButton.onClick.AddListener(NextStep);
        }

        private void OnDisable()
        {
            if (nextButton != null)
                nextButton.onClick.RemoveListener(NextStep);
        }

        public void StartTutorial(string[] steps)
        {
            tutorialSteps = steps;
            currentStep = 0;
            ShowCurrentStep();
        }

        public void NextStep()
        {
            if (tutorialSteps == null || currentStep >= tutorialSteps.Length - 1)
            {
                CompleteTutorial();
                return;
            }
            currentStep++;
            ShowCurrentStep();
        }

        public void PreviousStep()
        {
            if (currentStep <= 0) return;
            currentStep--;
            ShowCurrentStep();
        }

        public void CompleteTutorial()
        {
            currentStep = 0;
            tutorialSteps = null;
            if (highlightArea != null)
                highlightArea.SetActive(false);
            if (stepIndicator != null)
                stepIndicator.text = string.Empty;
            gameObject.SetActive(false);
        }

        public void HighlightArea(Rect area)
        {
            if (highlightArea == null) return;
            highlightArea.SetActive(true);
            highlightArea.transform.localPosition = new Vector3(area.x, area.y, 0);
            RectTransform rt = highlightArea.GetComponent<RectTransform>();
            if (rt != null)
            {
                rt.sizeDelta = new Vector2(area.width, area.height);
            }
        }

        private void ShowCurrentStep()
        {
            if (tutorialSteps == null || currentStep < 0 || currentStep >= tutorialSteps.Length) return;
            if (stepIndicator != null)
                stepIndicator.text = tutorialSteps[currentStep];
        }
    }
}
