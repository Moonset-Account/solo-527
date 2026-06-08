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
    public class HUDPanel : UIPanelBase
    {
        [Header("Top Bar - Resources")]
        public Slider fuelSlider;
        public TextMeshProUGUI fuelText;
        public TextMeshProUGUI fuelWarningText;
        public Image fuelFillImage;
        public Color fuelSafeColor = new Color(0.2f, 0.9f, 0.4f);
        public Color fuelWarningColor = new Color(1f, 0.8f, 0.2f);
        public Color fuelDangerColor = new Color(1f, 0.3f, 0.3f);

        public TextMeshProUGUI creditsText;
        public TextMeshProUGUI reputationText;
        public Image reputationBarImage;
        public TextMeshProUGUI reputationTierText;

        [Header("Top Bar - Turn")]
        public TextMeshProUGUI turnCounterText;
        public TextMeshProUGUI turnsRemainingText;
        public Slider turnProgressSlider;
        public Color turnSafeColor = new Color(0.2f, 0.7f, 1f);
        public Color turnWarningColor = new Color(1f, 0.7f, 0.2f);
        public Color turnDangerColor = new Color(1f, 0.3f, 0.3f);

        [Header("Main Contract Display")]
        public GameObject mainContractPanel;
        public TextMeshProUGUI mainContractTitle;
        public TextMeshProUGUI mainContractDestination;
        public Slider mainContractTimerSlider;
        public TextMeshProUGUI mainContractTimeText;
        public TextMeshProUGUI mainContractCargoText;
        public TextMeshProUGUI mainContractRewardText;

        [Header("Action Buttons")]
        public Button confirmRouteButton;
        public Button refuelButton;
        public Button contractsButton;
        public Button pauseButton;
        public Button menuButton;
        public TextMeshProUGUI confirmRouteButtonText;

        [Header("Feedback")]
        public TextMeshProUGUI feedbackText;
        public CanvasGroup feedbackCanvasGroup;
        public Image feedbackBackground;

        [Header("Ship Info")]
        public TextMeshProUGUI currentNodeText;
        public TextMeshProUGUI currentNodeTypeText;
        public TextMeshProUGUI routePreviewText;

        public event Action OnConfirmRouteClicked;
        public event Action OnRefuelClicked;
        public event Action OnContractsClicked;
        public event Action OnPauseClicked;
        public event Action OnMenuClicked;

        private DataManager dataManager;
        private TurnManager turnManager;
        private FuelManager fuelManager;
        private ReputationManager reputationManager;

        private bool isFeedbackShowing = false;
        private Coroutine feedbackCoroutine;

        protected override void Awake()
        {
            base.Awake();

            if (confirmRouteButton != null) confirmRouteButton.onClick.AddListener(OnConfirmRoute);
            if (refuelButton != null) refuelButton.onClick.AddListener(OnRefuel);
            if (contractsButton != null) contractsButton.onClick.AddListener(OnContracts);
            if (pauseButton != null) pauseButton.onClick.AddListener(OnPause);
            if (menuButton != null) menuButton.onClick.AddListener(OnMenu);
        }

        protected override void OnOpened()
        {
            base.OnOpened();

            dataManager = GameManager.Instance?.GetModule<DataManager>(ModuleType.DataManager);
            turnManager = GameManager.Instance?.GetModule<TurnManager>(ModuleType.TurnManager);
            fuelManager = GameManager.Instance?.GetModule<FuelManager>(ModuleType.FuelManager);
            reputationManager = GameManager.Instance?.GetModule<ReputationManager>(ModuleType.ReputationManager);

            SubscribeEvents();
            RefreshAll();
        }

        private void SubscribeEvents()
        {
            if (fuelManager != null)
            {
                fuelManager.OnFuelChanged += HandleFuelChanged;
                fuelManager.OnFuelLow += HandleFuelLow;
            }
            if (reputationManager != null)
            {
                reputationManager.OnReputationChanged += HandleReputationChanged;
            }
            if (turnManager != null)
            {
                turnManager.OnTurnStarted += HandleTurnStarted;
                turnManager.OnTurnsLowWarning += HandleTurnsLow;
            }
            if (dataManager != null)
            {
                dataManager.OnRuntimeDataChanged += RefreshAll;
            }
        }

        protected override void OnClosed()
        {
            base.OnClosed();
            UnsubscribeEvents();
        }

        private void UnsubscribeEvents()
        {
            if (fuelManager != null)
            {
                fuelManager.OnFuelChanged -= HandleFuelChanged;
                fuelManager.OnFuelLow -= HandleFuelLow;
            }
            if (reputationManager != null)
            {
                reputationManager.OnReputationChanged -= HandleReputationChanged;
            }
            if (turnManager != null)
            {
                turnManager.OnTurnStarted -= HandleTurnStarted;
                turnManager.OnTurnsLowWarning -= HandleTurnsLow;
            }
            if (dataManager != null)
            {
                dataManager.OnRuntimeDataChanged -= RefreshAll;
            }
        }

        private void HandleFuelChanged(int current, int max, int delta, string reason)
        {
            RefreshFuel();
            if (delta != 0)
            {
                ShowFeedback($"{reason}: {delta:+#;-#} 燃料", delta > 0);
            }
        }

        private void HandleFuelLow()
        {
            ShowFeedback("警告：燃料不足！", false);
        }

        private void HandleReputationChanged(int current, int delta, string reason)
        {
            RefreshReputation();
            if (delta != 0)
            {
                ShowFeedback($"{reason}: {delta:+#;-#} 声望", delta > 0);
            }
        }

        private void HandleTurnStarted(int turnNumber)
        {
            RefreshTurn();
            ShowFeedback($"第 {turnNumber} 回合开始", true);
        }

        private void HandleTurnsLow(int remaining)
        {
            ShowFeedback($"警告：只剩 {remaining} 回合！", false);
        }

        public void RefreshAll()
        {
            RefreshFuel();
            RefreshCredits();
            RefreshReputation();
            RefreshTurn();
            RefreshMainContract();
            RefreshCurrentNode();
            RefreshButtons();
        }

        private void RefreshFuel()
        {
            if (fuelManager == null) return;

            if (fuelSlider != null)
            {
                fuelSlider.maxValue = fuelManager.MaxFuel;
                fuelSlider.value = fuelManager.CurrentFuel;
            }
            if (fuelText != null)
            {
                fuelText.text = $"⛽ {fuelManager.CurrentFuel} / {fuelManager.MaxFuel}";
            }
            if (fuelFillImage != null)
            {
                float pct = fuelManager.FuelPercentage;
                if (pct <= 0.15f) fuelFillImage.color = fuelDangerColor;
                else if (pct <= 0.35f) fuelFillImage.color = fuelWarningColor;
                else fuelFillImage.color = fuelSafeColor;
            }
            if (fuelWarningText != null)
            {
                fuelWarningText.gameObject.SetActive(fuelManager.IsFuelLow);
            }
        }

        private void RefreshCredits()
        {
            if (dataManager?.RuntimeData?.Player == null) return;
            if (creditsText != null)
            {
                creditsText.text = $"💰 {dataManager.RuntimeData.Player.Credits}";
            }
        }

        private void RefreshReputation()
        {
            if (reputationManager == null) return;

            if (reputationText != null)
            {
                reputationText.text = $"⭐ {reputationManager.CurrentReputation}";
            }
            if (reputationBarImage != null)
            {
                float pct = reputationManager.CurrentReputation / 100f;
                reputationBarImage.transform.localScale = new Vector3(pct, 1f, 1f);
                reputationBarImage.color = reputationManager.GetReputationColor(reputationManager.CurrentTier);
            }
            if (reputationTierText != null)
            {
                reputationTierText.text = reputationManager.GetReputationDescription(reputationManager.CurrentTier);
            }
        }

        private void RefreshTurn()
        {
            if (turnManager == null) return;

            if (turnCounterText != null)
            {
                turnCounterText.text = $"回合 {turnManager.CurrentTurn} / {turnManager.MaxTurns}";
            }
            if (turnsRemainingText != null)
            {
                turnsRemainingText.text = $"剩余 {turnManager.TurnsRemaining}";
            }
            if (turnProgressSlider != null)
            {
                turnProgressSlider.maxValue = turnManager.MaxTurns;
                turnProgressSlider.value = turnManager.CurrentTurn;

                var sliderFill = turnProgressSlider.fillRect?.GetComponent<Image>();
                if (sliderFill != null)
                {
                    float pct = turnManager.TurnProgress;
                    if (pct >= 0.9f) sliderFill.color = turnDangerColor;
                    else if (pct >= 0.7f) sliderFill.color = turnWarningColor;
                    else sliderFill.color = turnSafeColor;
                }
            }
        }

        private void RefreshMainContract()
        {
            if (turnManager == null || mainContractPanel == null) return;

            var main = turnManager.GetMainContract();
            if (main == null)
            {
                mainContractPanel.SetActive(false);
                return;
            }

            mainContractPanel.SetActive(true);

            if (mainContractTitle != null)
            {
                mainContractTitle.text = $"<b>{main.Title}</b>" + (main.IsMainContract ? "  ★主线" : "");
            }

            if (dataManager != null)
            {
                var endNode = dataManager.GetNode(main.EndNodeId);
                if (mainContractDestination != null)
                {
                    mainContractDestination.text = $"目的地: {endNode?.NodeName ?? "未知"}";
                }
            }

            if (mainContractTimeText != null)
            {
                mainContractTimeText.text = $"⏱ 剩余 {Mathf.Max(0, main.TimeRemaining)} 回合";
            }

            var contractData = dataManager?.GetContract(main.ContractId);
            if (mainContractTimerSlider != null && contractData != null)
            {
                mainContractTimerSlider.maxValue = contractData.TimeLimit;
                mainContractTimerSlider.value = Mathf.Max(0, main.TimeRemaining);
            }

            if (mainContractCargoText != null)
            {
                mainContractCargoText.text = $"📦 {main.Cargo} (完整度 {main.CargoIntegrity}%)";
            }

            if (mainContractRewardText != null)
            {
                mainContractRewardText.text = $"奖励: {main.RewardCredits}💰 {main.RewardReputation}⭐";
            }
        }

        private void RefreshCurrentNode()
        {
            if (dataManager?.RuntimeData == null) return;
            var node = dataManager.GetNode(dataManager.RuntimeData.Ship.CurrentNodeId);
            if (node == null) return;

            if (currentNodeText != null)
            {
                currentNodeText.text = $"📍 {node.NodeName}";
            }
            if (currentNodeTypeText != null)
            {
                currentNodeTypeText.text = GetNodeTypeString(node.Type) +
                    (node.HasFuelStation ? "  ⛽" : "") +
                    GetDangerString(node.DangerLevel);
            }
        }

        public void UpdateRoutePreview(int targetNodeId, int fuelCost, bool canAfford)
        {
            if (routePreviewText == null) return;

            if (targetNodeId <= 0)
            {
                routePreviewText.text = string.Empty;
                confirmRouteButton.gameObject.SetActive(false);
                return;
            }

            var targetNode = dataManager?.GetNode(targetNodeId);
            if (targetNode == null) return;

            routePreviewText.text = $"→ {targetNode.NodeName}\n燃料消耗: {fuelCost}";

            confirmRouteButton.gameObject.SetActive(true);
            if (confirmRouteButtonText != null)
            {
                confirmRouteButtonText.text = canAfford ? "确认航线" : "燃料不足";
                confirmRouteButton.interactable = canAfford;
            }
        }

        private void RefreshButtons()
        {
            if (dataManager?.RuntimeData == null || refuelButton == null) return;
            var node = dataManager.GetNode(dataManager.RuntimeData.Ship.CurrentNodeId);
            refuelButton.interactable = node != null && node.HasFuelStation &&
                dataManager.RuntimeData.Player.Credits >= (node?.RefuelCost ?? 999);
        }

        public void ShowFeedback(string message, bool isPositive)
        {
            if (feedbackText == null || feedbackCanvasGroup == null) return;

            if (feedbackCoroutine != null) StopCoroutine(feedbackCoroutine);
            feedbackCoroutine = StartCoroutine(ShowFeedbackCoroutine(message, isPositive));
        }

        private System.Collections.IEnumerator ShowFeedbackCoroutine(string message, bool isPositive)
        {
            feedbackText.text = message;
            feedbackBackground.color = isPositive
                ? new Color(0.1f, 0.4f, 0.2f, 0.8f)
                : new Color(0.5f, 0.1f, 0.1f, 0.8f);

            isFeedbackShowing = true;
            float fadeIn = 0.15f;
            float elapsed = 0f;

            while (elapsed < fadeIn)
            {
                elapsed += Time.unscaledDeltaTime;
                feedbackCanvasGroup.alpha = elapsed / fadeIn;
                yield return null;
            }
            feedbackCanvasGroup.alpha = 1f;

            yield return new WaitForSecondsRealtime(1.5f);

            float fadeOut = 0.4f;
            elapsed = 0f;
            while (elapsed < fadeOut)
            {
                elapsed += Time.unscaledDeltaTime;
                feedbackCanvasGroup.alpha = 1f - (elapsed / fadeOut);
                yield return null;
            }
            feedbackCanvasGroup.alpha = 0f;
            isFeedbackShowing = false;
        }

        private void OnConfirmRoute()
        {
            OnConfirmRouteClicked?.Invoke();
            PlayClick();
        }

        private void OnRefuel()
        {
            OnRefuelClicked?.Invoke();
            PlayClick();
        }

        private void OnContracts()
        {
            OnContractsClicked?.Invoke();
            PlayClick();
        }

        private void OnPause()
        {
            OnPauseClicked?.Invoke();
            PlayClick();
        }

        private void OnMenu()
        {
            OnMenuClicked?.Invoke();
            PlayClick();
        }

        private void PlayClick()
        {
            var audioManager = GameManager.Instance?.GetModule<Audio.AudioManager>(ModuleType.AudioManager);
            audioManager?.PlaySfx(Audio.SfxType.UI_ButtonClick);
        }

        private string GetNodeTypeString(NodeType type)
        {
            switch (type)
            {
                case NodeType.Station: return "空间站";
                case NodeType.Planet: return "行星";
                case NodeType.Outpost: return "前哨站";
                case NodeType.Wormhole: return "虫洞";
                case NodeType.Asteroid: return "小行星";
                case NodeType.Derelict: return "废弃船";
                default: return "";
            }
        }

        private string GetDangerString(NodeDangerLevel danger)
        {
            switch (danger)
            {
                case NodeDangerLevel.Safe: return " <color=#4CAF50>安全</color>";
                case NodeDangerLevel.Low: return " <color=#8BC34A>低危</color>";
                case NodeDangerLevel.Medium: return " <color=#FFC107>中危</color>";
                case NodeDangerLevel.High: return " <color=#FF9800>高危</color>";
                case NodeDangerLevel.Extreme: return " <color=#F44336>极危</color>";
                default: return "";
            }
        }

        protected override void OnDestroy()
        {
            base.OnDestroy();
            UnsubscribeEvents();

            if (confirmRouteButton != null) confirmRouteButton.onClick.RemoveListener(OnConfirmRoute);
            if (refuelButton != null) refuelButton.onClick.RemoveListener(OnRefuel);
            if (contractsButton != null) contractsButton.onClick.RemoveListener(OnContracts);
            if (pauseButton != null) pauseButton.onClick.RemoveListener(OnPause);
            if (menuButton != null) menuButton.onClick.RemoveListener(OnMenu);
        }
    }
}
