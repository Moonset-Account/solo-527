using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using SpaceCourier.Core;
using SpaceCourier.Data;
using SpaceCourier.DataModule;
using SpaceCourier.Gameplay;

namespace SpaceCourier.UI
{
    public class EventCardPanel : UIPanelBase
    {
        [Header("Card Header")]
        public Image cardBackground;
        public Image eventCategoryIcon;
        public TextMeshProUGUI eventTitleText;
        public TextMeshProUGUI eventCategoryText;
        public TextMeshProUGUI eventSeverityText;
        public Image severityBadgeImage;

        [Header("Card Content")]
        public TextMeshProUGUI eventDescriptionText;
        public Image eventImage;

        [Header("Choices Container")]
        public Transform choicesContainer;
        public EventChoiceButton choiceButtonPrefab;

        [Header("Outcome Panel")]
        public GameObject outcomePanel;
        public TextMeshProUGUI outcomeTitleText;
        public TextMeshProUGUI outcomeDescriptionText;
        public TextMeshProUGUI outcomeEffectsText;
        public Image outcomeIcon;
        public Button continueButton;

        [Header("Colors")]
        public Color trivialColor = new Color(0.6f, 0.8f, 1f);
        public Color minorColor = new Color(0.5f, 0.9f, 0.5f);
        public Color moderateColor = new Color(1f, 0.8f, 0.3f);
        public Color severeColor = new Color(1f, 0.5f, 0.3f);
        public Color catastrophicColor = new Color(1f, 0.2f, 0.2f);

        private EventManager eventManager;
        private DataManager dataManager;
        private FuelManager fuelManager;
        private ReputationManager reputationManager;
        private EventCardData currentEvent;
        private EventChoice selectedChoice;
        private EventOutcome lastOutcome;
        private List<EventChoiceButton> choiceButtons = new List<EventChoiceButton>();

        public event Action<int> OnChoiceSelected;
        public event Action OnContinueClicked;

        protected override void Awake()
        {
            base.Awake();
        }

        public override void BindEvents()
        {
            base.BindEvents();

            if (continueButton != null) continueButton.onClick.AddListener(OnContinue);
        }

        protected override void OnOpened()
        {
            base.OnOpened();
            eventManager = GameManager.Instance?.GetModule<EventManager>(ModuleType.EventManager);
            dataManager = GameManager.Instance?.GetModule<DataManager>(ModuleType.DataManager);
            fuelManager = GameManager.Instance?.GetModule<FuelManager>(ModuleType.FuelManager);
            reputationManager = GameManager.Instance?.GetModule<ReputationManager>(ModuleType.ReputationManager);

            if (outcomePanel != null) outcomePanel.SetActive(false);

            if (eventManager != null && eventManager.CurrentEvent != null)
            {
                DisplayEvent(eventManager.CurrentEvent);
            }
        }

        public void DisplayEvent(EventCardData eventData)
        {
            if (eventData == null) return;

            currentEvent = eventData;
            if (outcomePanel != null) outcomePanel.SetActive(false);

            if (eventTitleText != null) eventTitleText.text = eventData.Title;
            if (eventCategoryText != null) eventCategoryText.text = GetCategoryString(eventData.Category);
            if (eventSeverityText != null) eventSeverityText.text = GetSeverityString(eventData.Severity);
            if (severityBadgeImage != null) severityBadgeImage.color = GetSeverityColor(eventData.Severity);
            if (cardBackground != null) cardBackground.color = Color.Lerp(GetSeverityColor(eventData.Severity), Color.black, 0.85f);
            if (eventDescriptionText != null) eventDescriptionText.text = eventData.Description;

            PopulateChoices(eventData);
        }

        private void PopulateChoices(EventCardData eventData)
        {
            foreach (var btn in choiceButtons)
            {
                if (btn != null) Destroy(btn.gameObject);
            }
            choiceButtons.Clear();

            var availableChoices = eventManager != null
                ? eventManager.GetAvailableChoices()
                : eventData.Choices;

            foreach (var choice in availableChoices)
            {
                if (choice == null || choiceButtonPrefab == null || choicesContainer == null) continue;

                var btn = Instantiate(choiceButtonPrefab, choicesContainer);
                btn.Initialize(choice, CanAffordChoice(choice), choice.IsRemediationChoice);
                btn.OnChoiceClicked += HandleChoiceClicked;
                choiceButtons.Add(btn);
            }

            if (choiceButtons.Count == 0 && eventData.AllowSkip)
            {
                CreateSkipButton();
            }
        }

        private bool CanAffordChoice(EventChoice choice)
        {
            if (choice == null || choice.Requirement == null || dataManager?.RuntimeData == null) return true;

            var req = choice.Requirement;
            var runtime = dataManager.RuntimeData;

            if (req.FuelCost > 0 && (fuelManager?.CurrentFuel ?? 0) < req.FuelCost) return false;
            if (req.MinFuel > 0 && (fuelManager?.CurrentFuel ?? 0) < req.MinFuel) return false;
            if (req.CreditCost > 0 && runtime.Player.Credits < req.CreditCost) return false;
            if (req.ReputationCost > 0 && (reputationManager?.CurrentReputation ?? 0) < req.ReputationCost) return false;
            if (req.MinReputation > 0 && (reputationManager?.CurrentReputation ?? 0) < req.MinReputation) return false;

            return true;
        }

        private void CreateSkipButton()
        {
            if (choiceButtonPrefab == null || choicesContainer == null) return;

            var skipChoice = new EventChoice
            {
                ChoiceId = -1,
                Text = "跳过此事件",
                Requirement = new ChoiceRequirement(),
                Outcomes = { new EventOutcome { Weight = 100, OutcomeType = OutcomeType.Neutral, ResultText = "你选择无视这个情况。" } }
            };

            var btn = Instantiate(choiceButtonPrefab, choicesContainer);
            btn.Initialize(skipChoice, true, true);
            btn.OnChoiceClicked += HandleChoiceClicked;
            choiceButtons.Add(btn);
        }

        private void HandleChoiceClicked(EventChoice choice)
        {
            if (choice == null || eventManager == null) return;

            selectedChoice = choice;
            var result = eventManager.ResolveChoice(choice.ChoiceId);

            if (result.Success)
            {
                lastOutcome = result.Outcome;
                ShowOutcome(result);
                PlayChoiceSound(result.Outcome?.OutcomeType ?? OutcomeType.Neutral);
            }
            else
            {
                // Option not available
                var hud = GameManager.Instance?.GetModule<UIManager>(ModuleType.UIManager);
                hud?.ShowNotification(result.Message, false);
            }

            OnChoiceSelected?.Invoke(choice.ChoiceId);
        }

        private void ShowOutcome(EventResolveResult result)
        {
            if (outcomePanel == null) return;
            outcomePanel.SetActive(true);

            var outcome = result.Outcome;
            if (outcome == null) return;

            if (outcomeTitleText != null)
            {
                outcomeTitleText.text = GetOutcomeTitle(outcome.OutcomeType);
                outcomeTitleText.color = GetOutcomeColor(outcome.OutcomeType);
            }

            if (outcomeDescriptionText != null)
            {
                outcomeDescriptionText.text = outcome.ResultText;
            }

            if (outcomeEffectsText != null)
            {
                outcomeEffectsText.text = BuildEffectsString(outcome);
            }

            if (outcomeIcon != null)
            {
                outcomeIcon.color = GetOutcomeColor(outcome.OutcomeType);
            }
        }

        private string BuildEffectsString(EventOutcome outcome)
        {
            var effects = new List<string>();
            if (outcome.FuelDelta != 0)
                effects.Add($"燃料 {outcome.FuelDelta:+#;-#}");
            if (outcome.CreditsDelta != 0)
                effects.Add($"星币 {outcome.CreditsDelta:+#;-#}");
            if (outcome.ReputationDelta != 0)
                effects.Add($"声望 {outcome.ReputationDelta:+#;-#}");
            if (outcome.TurnDelta != 0)
                effects.Add($"时间 {outcome.TurnDelta:+#;-#} 回合");
            if (outcome.CargoDamagePercent > 0)
                effects.Add($"货物 -{outcome.CargoDamagePercent}%");

            return effects.Count > 0 ? string.Join("   ", effects) : "无明显影响";
        }

        private void OnContinue()
        {
            if (eventManager != null)
            {
                eventManager.DismissEvent();
            }
            ClosePanel();
            OnContinueClicked?.Invoke();
            PlayClick();
        }

        private string GetCategoryString(EventCategory cat)
        {
            switch (cat)
            {
                case EventCategory.SpaceWeather: return "太空天气";
                case EventCategory.Piracy: return "海盗袭击";
                case EventCategory.Mechanical: return "机械故障";
                case EventCategory.Trade: return "贸易机会";
                case EventCategory.Discovery: return "意外发现";
                case EventCategory.NPCEncounter: return "随机遭遇";
                case EventCategory.Emergency: return "紧急事件";
                case EventCategory.Government: return "官方检查";
                default: return "未知事件";
            }
        }

        private string GetSeverityString(EventSeverity sev)
        {
            switch (sev)
            {
                case EventSeverity.Trivial: return "微小";
                case EventSeverity.Minor: return "轻微";
                case EventSeverity.Moderate: return "中等";
                case EventSeverity.Severe: return "严重";
                case EventSeverity.Catastrophic: return "灾难性";
                default: return "未知";
            }
        }

        private Color GetSeverityColor(EventSeverity sev)
        {
            switch (sev)
            {
                case EventSeverity.Trivial: return trivialColor;
                case EventSeverity.Minor: return minorColor;
                case EventSeverity.Moderate: return moderateColor;
                case EventSeverity.Severe: return severeColor;
                case EventSeverity.Catastrophic: return catastrophicColor;
                default: return Color.gray;
            }
        }

        private string GetOutcomeTitle(OutcomeType type)
        {
            switch (type)
            {
                case OutcomeType.Positive: return "✨ 好事发生！";
                case OutcomeType.Negative: return "💥 出问题了...";
                case OutcomeType.Critical: return "⚠️ 重大影响！";
                default: return "📋 结果";
            }
        }

        private Color GetOutcomeColor(OutcomeType type)
        {
            switch (type)
            {
                case OutcomeType.Positive: return new Color(0.3f, 0.95f, 0.5f);
                case OutcomeType.Negative: return new Color(1f, 0.4f, 0.3f);
                case OutcomeType.Critical: return new Color(1f, 0.8f, 0.2f);
                default: return Color.white;
            }
        }

        private void PlayChoiceSound(OutcomeType type)
        {
            var audio = GameManager.Instance?.GetModule<Audio.AudioManager>(ModuleType.AudioManager);
            if (audio == null) return;

            switch (type)
            {
                case OutcomeType.Positive:
                    audio.PlaySfx(Audio.SfxType.Event_Positive);
                    break;
                case OutcomeType.Negative:
                    audio.PlaySfx(Audio.SfxType.Event_Negative);
                    break;
                case OutcomeType.Critical:
                    audio.PlaySfx(Audio.SfxType.Event_Critical);
                    break;
                default:
                    audio.PlaySfx(Audio.SfxType.UI_ButtonClick);
                    break;
            }
        }

        private void PlayClick()
        {
            var audioManager = GameManager.Instance?.GetModule<Audio.AudioManager>(ModuleType.AudioManager);
            audioManager?.PlaySfx(Audio.SfxType.UI_ButtonClick);
        }

        protected override void OnDestroy()
        {
            base.OnDestroy();
            if (continueButton != null) continueButton.onClick.RemoveListener(OnContinue);
        }
    }
}
