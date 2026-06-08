using System;
using UnityEngine;
using UnityEngine.UI;

namespace DecorMatch3
{
    public class TutorialUI : MonoBehaviour
    {
        [SerializeField] private GameObject _tutorialPanel;
        [SerializeField] private Text _tutorialText;
        [SerializeField] private Image _tutorialHighlight;
        [SerializeField] private Button _nextBtn;
        [SerializeField] private Button _skipBtn;

        private int _currentStep;

        private string[] _tutorialSteps = {
            "欢迎来到装修配色三消！",
            "点击两个相邻的方块来交换它们",
            "三个或更多相同方块连成一线即可消除",
            "消除方块获得材料来装修房间",
            "注意步数限制，合理规划每一步",
            "试试创建连击来获得更高分数！"
        };

        public event Action OnTutorialFinished;

        private void Start()
        {
            _nextBtn.onClick.AddListener(NextStep);
            _skipBtn.onClick.AddListener(SkipTutorial);

            if (_tutorialPanel != null) _tutorialPanel.SetActive(false);
        }

        public void ShowTutorial()
        {
            _currentStep = 0;
            if (_tutorialPanel != null) _tutorialPanel.SetActive(true);
            UpdateStepDisplay();
        }

        public void NextStep()
        {
            _currentStep++;
            if (_currentStep >= _tutorialSteps.Length)
            {
                OnTutorialComplete();
                return;
            }
            UpdateStepDisplay();

            if (AudioManager.Instance != null)
            {
                AudioManager.Instance.PlaySFX("button_click");
            }
        }

        public void SkipTutorial()
        {
            if (AudioManager.Instance != null)
            {
                AudioManager.Instance.PlaySFX("button_click");
            }

            if (SaveManager.Instance != null && SaveManager.Instance.CurrentSave != null)
            {
                SaveManager.Instance.CurrentSave.playerProfile.tutorialCompleted = true;
                SaveManager.Instance.RecordTutorialSkip();
                SaveManager.Instance.Save();
            }

            if (_tutorialPanel != null) _tutorialPanel.SetActive(false);
            OnTutorialFinished?.Invoke();
        }

        public void OnTutorialComplete()
        {
            if (SaveManager.Instance != null && SaveManager.Instance.CurrentSave != null)
            {
                SaveManager.Instance.CurrentSave.playerProfile.tutorialCompleted = true;
                SaveManager.Instance.Save();
            }

            if (_tutorialPanel != null) _tutorialPanel.SetActive(false);
            OnTutorialFinished?.Invoke();

            if (AudioManager.Instance != null)
            {
                AudioManager.Instance.PlaySFX("tutorial_complete");
            }
        }

        private void UpdateStepDisplay()
        {
            if (_tutorialText != null && _currentStep < _tutorialSteps.Length)
            {
                _tutorialText.text = _tutorialSteps[_currentStep];
            }
        }
    }
}
