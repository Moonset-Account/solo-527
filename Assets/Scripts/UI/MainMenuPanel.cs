using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using SpaceCourier.Core;
using DataDiff = SpaceCourier.Data.Difficulty;

namespace SpaceCourier.UI
{
    public class MainMenuPanel : UIPanelBase
    {
        [Header("Main Menu Buttons")]
        public Button startButton;
        public Button continueButton;
        public Button settingsButton;
        public Button quitButton;

        [Header("Level Selection")]
        public GameObject levelSelectContainer;
        public Transform levelButtonContainer;
        public Button levelSelectBackButton;
        public LevelButtonItem levelButtonPrefab;

        [Header("References")]
        public TextMeshProUGUI titleText;
        public TextMeshProUGUI subtitleText;
        public Image backgroundImage;

        [Header("Animation")]
        public RectTransform logoTransform;
        public float logoPulseSpeed = 2f;
        public float logoPulseAmount = 0.05f;

        public event Action<int> OnStartLevelSelected;
        public event Action OnContinueClicked;
        public event Action OnSettingsClicked;
        public event Action OnQuitClicked;

        private List<LevelButtonItem> levelButtons = new List<LevelButtonItem>();

        protected override void Awake()
        {
            base.Awake();
        }

        public override void BindEvents()
        {
            base.BindEvents();

            if (startButton != null) startButton.onClick.AddListener(OnStartButtonClicked);
            if (continueButton != null) continueButton.onClick.AddListener(OnContinueButtonClicked);
            if (settingsButton != null) settingsButton.onClick.AddListener(OnSettingsButtonClicked);
            if (quitButton != null) quitButton.onClick.AddListener(OnQuitButtonClicked);
            if (levelSelectBackButton != null) levelSelectBackButton.onClick.AddListener(OnLevelSelectBack);
        }

        protected override void OnOpened()
        {
            base.OnOpened();
            UpdateContinueButtonState();
        }

        private void Update()
        {
            if (!IsOpen) return;
            AnimateLogo();
        }

        private void AnimateLogo()
        {
            if (logoTransform == null) return;
            float t = Time.time * logoPulseSpeed;
            float scale = 1f + Mathf.Sin(t) * logoPulseAmount;
            logoTransform.localScale = new Vector3(scale, scale, 1f);
        }

        private void OnStartButtonClicked()
        {
            ShowLevelSelection();
            PlayClickSound();
        }

        private void OnContinueButtonClicked()
        {
            OnContinueClicked?.Invoke();
            PlayClickSound();
        }

        private void OnSettingsButtonClicked()
        {
            OnSettingsClicked?.Invoke();
            PlayClickSound();
        }

        private void OnQuitButtonClicked()
        {
            OnQuitClicked?.Invoke();
            PlayClickSound();
#if UNITY_EDITOR
            UnityEditor.EditorApplication.isPlaying = false;
#else
            Application.Quit();
#endif
        }

        public void ShowLevelSelection()
        {
            if (levelSelectContainer != null) levelSelectContainer.SetActive(true);
            PopulateLevelButtons();
        }

        public void HideLevelSelection()
        {
            if (levelSelectContainer != null) levelSelectContainer.SetActive(false);
        }

        private void OnLevelSelectBack()
        {
            HideLevelSelection();
            PlayClickSound();
        }

        private void PopulateLevelButtons()
        {
            foreach (var btn in levelButtons)
            {
                if (btn != null) Destroy(btn.gameObject);
            }
            levelButtons.Clear();

            var dataManager = GameManager.Instance?.GetModule<DataModule.DataManager>(ModuleType.DataManager);
            if (dataManager == null || dataManager.CurrentLevel == null)
            {
                CreateDefaultLevelButtons();
                return;
            }

            var levelData = dataManager.CurrentLevel;
            CreateLevelButton(levelData);
        }

        private void CreateDefaultLevelButtons()
        {
            CreateLevelButton(1, "贸易走廊", "新手教程任务：完成主要医疗物资的运输", DataDiff.Tutorial);
        }

        private void CreateLevelButton(int id, string name, string desc, DataDiff diff)
        {
            if (levelButtonContainer == null || levelButtonPrefab == null) return;

            var btnObj = Instantiate(levelButtonPrefab, levelButtonContainer);
            btnObj.Initialize(id, name, desc, diff);
            btnObj.OnClicked += HandleLevelSelected;
            levelButtons.Add(btnObj);
        }

        private void CreateLevelButton(Data.LevelData level)
        {
            CreateLevelButton(level.LevelId, level.LevelName, level.Description, (DataDiff)level.Difficulty);
        }

        private void HandleLevelSelected(int levelId)
        {
            OnStartLevelSelected?.Invoke(levelId);
            PlayClickSound();
        }

        private void UpdateContinueButtonState()
        {
            if (continueButton == null) return;

            var saveManager = GameManager.Instance?.GetModule<SaveSystem.SaveManager>(ModuleType.SaveManager);
            bool hasSave = saveManager != null && saveManager.HasSavedGame();
            continueButton.interactable = hasSave;
        }

        private void PlayClickSound()
        {
            var audioManager = GameManager.Instance?.GetModule<Audio.AudioManager>(ModuleType.AudioManager);
            audioManager?.PlaySfx(Audio.SfxType.UI_ButtonClick);
        }

        protected override void OnDestroy()
        {
            base.OnDestroy();

            if (startButton != null) startButton.onClick.RemoveListener(OnStartButtonClicked);
            if (continueButton != null) continueButton.onClick.RemoveListener(OnContinueButtonClicked);
            if (settingsButton != null) settingsButton.onClick.RemoveListener(OnSettingsButtonClicked);
            if (quitButton != null) quitButton.onClick.RemoveListener(OnQuitButtonClicked);
            if (levelSelectBackButton != null) levelSelectBackButton.onClick.RemoveListener(OnLevelSelectBack);
        }
    }
}
