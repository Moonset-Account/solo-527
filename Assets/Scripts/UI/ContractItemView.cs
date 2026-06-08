using System;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using SpaceCourier.Data;

namespace SpaceCourier.UI
{
    public class ContractItemView : MonoBehaviour
    {
        public enum ContractDisplayType { Available, Active, Completed }

        [Header("References")]
        public Image backgroundImage;
        public Image statusIndicator;
        public TextMeshProUGUI titleText;
        public TextMeshProUGUI destinationText;
        public TextMeshProUGUI timerText;
        public TextMeshProUGUI rewardText;
        public TextMeshProUGUI cargoTypeText;
        public Image riskIndicator;
        public Image mainContractBadge;
        public Button itemButton;

        [Header("Colors")]
        public Color availableColor = new Color(0.15f, 0.25f, 0.35f, 0.9f);
        public Color activeColor = new Color(0.15f, 0.35f, 0.25f, 0.9f);
        public Color completedSuccessColor = new Color(0.1f, 0.4f, 0.2f, 0.9f);
        public Color completedFailedColor = new Color(0.4f, 0.15f, 0.15f, 0.9f);

        private ContractData contractData;
        private ContractState contractState;
        private ContractDisplayType displayType;

        public event Action<ContractData, ContractState> OnClicked;

        private void Awake()
        {
            EnsureComponents();
        }

        private void EnsureComponents()
        {
            var rt = GetComponent<RectTransform>();
            if (rt == null)
            {
                rt = gameObject.AddComponent<RectTransform>();
            }
            if (rt.sizeDelta == Vector2.zero)
            {
                rt.sizeDelta = new Vector2(560, 100);
            }

            if (backgroundImage == null)
            {
                backgroundImage = GetComponent<Image>();
                if (backgroundImage == null)
                {
                    backgroundImage = gameObject.AddComponent<Image>();
                    backgroundImage.color = availableColor;
                }
            }
            if (itemButton == null)
            {
                itemButton = GetComponent<Button>();
                if (itemButton == null)
                {
                    itemButton = gameObject.AddComponent<Button>();
                    itemButton.targetGraphic = backgroundImage;
                }
            }

            if (statusIndicator == null)
            {
                var obj = new GameObject("StatusIndicator");
                obj.transform.SetParent(transform, false);
                var iRT = obj.AddComponent<RectTransform>();
                iRT.anchorMin = new Vector2(0, 0);
                iRT.anchorMax = new Vector2(0, 1);
                iRT.offsetMin = new Vector2(0, 4);
                iRT.offsetMax = new Vector2(6, -4);
                var img = obj.AddComponent<Image>();
                img.color = Color.gray;
                statusIndicator = img;
            }

            var fonts = Resources.FindObjectsOfTypeAll<TMP_FontAsset>();
            TMP_FontAsset font = fonts.Length > 0 ? fonts[0] : null;

            if (titleText == null)
            {
                var obj = new GameObject("TitleText");
                obj.transform.SetParent(transform, false);
                var iRT = obj.AddComponent<RectTransform>();
                iRT.anchorMin = new Vector2(0.1f, 0.58f);
                iRT.anchorMax = new Vector2(0.75f, 0.58f);
                iRT.offsetMin = new Vector2(8, -12);
                iRT.offsetMax = new Vector2(-4, 12);
                var txt = obj.AddComponent<TextMeshProUGUI>();
                txt.fontSize = 20;
                txt.color = Color.white;
                txt.alignment = TextAlignmentOptions.Left;
                txt.font = font;
                titleText = txt;
            }

            if (destinationText == null)
            {
                var obj = new GameObject("DestinationText");
                obj.transform.SetParent(transform, false);
                var iRT = obj.AddComponent<RectTransform>();
                iRT.anchorMin = new Vector2(0.1f, 0.28f);
                iRT.anchorMax = new Vector2(0.5f, 0.28f);
                iRT.offsetMin = new Vector2(8, -8);
                iRT.offsetMax = new Vector2(-4, 8);
                var txt = obj.AddComponent<TextMeshProUGUI>();
                txt.fontSize = 15;
                txt.color = new Color(0.75f, 0.85f, 1f);
                txt.alignment = TextAlignmentOptions.Left;
                txt.font = font;
                destinationText = txt;
            }

            if (timerText == null)
            {
                var obj = new GameObject("TimerText");
                obj.transform.SetParent(transform, false);
                var iRT = obj.AddComponent<RectTransform>();
                iRT.anchorMin = new Vector2(0.1f, 0.08f);
                iRT.anchorMax = new Vector2(0.5f, 0.08f);
                iRT.offsetMin = new Vector2(8, -8);
                iRT.offsetMax = new Vector2(-4, 8);
                var txt = obj.AddComponent<TextMeshProUGUI>();
                txt.fontSize = 14;
                txt.color = Color.white;
                txt.alignment = TextAlignmentOptions.Left;
                txt.font = font;
                timerText = txt;
            }

            if (rewardText == null)
            {
                var obj = new GameObject("RewardText");
                obj.transform.SetParent(transform, false);
                var iRT = obj.AddComponent<RectTransform>();
                iRT.anchorMin = new Vector2(0.75f, 0.6f);
                iRT.anchorMax = new Vector2(1f, 0.6f);
                iRT.offsetMin = new Vector2(4, -10);
                iRT.offsetMax = new Vector2(-8, 10);
                var txt = obj.AddComponent<TextMeshProUGUI>();
                txt.fontSize = 15;
                txt.color = new Color(0.4f, 0.9f, 0.5f);
                txt.alignment = TextAlignmentOptions.Right;
                txt.font = font;
                rewardText = txt;
            }

            if (cargoTypeText == null)
            {
                var obj = new GameObject("CargoTypeText");
                obj.transform.SetParent(transform, false);
                var iRT = obj.AddComponent<RectTransform>();
                iRT.anchorMin = new Vector2(0.5f, 0.08f);
                iRT.anchorMax = new Vector2(0.75f, 0.08f);
                iRT.offsetMin = new Vector2(4, -8);
                iRT.offsetMax = new Vector2(-4, 8);
                var txt = obj.AddComponent<TextMeshProUGUI>();
                txt.fontSize = 13;
                txt.color = new Color(1f, 0.8f, 0.3f);
                txt.alignment = TextAlignmentOptions.Left;
                txt.font = font;
                cargoTypeText = txt;
            }

            if (riskIndicator == null)
            {
                var obj = new GameObject("RiskIndicator");
                obj.transform.SetParent(transform, false);
                var iRT = obj.AddComponent<RectTransform>();
                iRT.anchorMin = new Vector2(0.88f, 0.25f);
                iRT.anchorMax = new Vector2(0.88f, 0.25f);
                iRT.sizeDelta = new Vector2(18, 18);
                var img = obj.AddComponent<Image>();
                img.color = Color.gray;
                riskIndicator = img;
            }

            if (mainContractBadge == null)
            {
                var obj = new GameObject("MainContractBadge");
                obj.transform.SetParent(transform, false);
                var iRT = obj.AddComponent<RectTransform>();
                iRT.anchorMin = new Vector2(0.92f, 0.72f);
                iRT.anchorMax = new Vector2(0.92f, 0.72f);
                iRT.sizeDelta = new Vector2(20, 20);
                var img = obj.AddComponent<Image>();
                img.color = new Color(1f, 0.82f, 0.25f);
                img.enabled = false;
                mainContractBadge = img;
            }
        }

        public void Initialize(ContractData data, ContractDisplayType type)
        {
            contractData = data;
            contractState = null;
            displayType = type;
            ConfigureVisuals();

            if (titleText != null) titleText.text = data.Title + (data.IsMainContract ? " ★" : "");
            if (destinationText != null) destinationText.text = $"→ {GetNodeName(data.EndNodeId)}";
            if (timerText != null) timerText.text = $"⏱ {data.TimeLimit}";
            if (rewardText != null) rewardText.text = $"{data.RewardCredits}💰 {data.RewardReputation}⭐";
            if (cargoTypeText != null) cargoTypeText.text = GetCargoString(data.Cargo);
            if (riskIndicator != null) riskIndicator.color = GetRiskColor(data.RiskLevel);
            if (mainContractBadge != null) mainContractBadge.enabled = data.IsMainContract;
            if (statusIndicator != null) statusIndicator.color = GetStatusColor();
            if (backgroundImage != null) backgroundImage.color = GetBackgroundColor();
        }

        public void Initialize(ContractState state, ContractDisplayType type)
        {
            contractData = null;
            contractState = state;
            displayType = type;
            ConfigureVisuals();

            if (titleText != null) titleText.text = state.Title + (state.IsMainContract ? " ★" : "");
            if (destinationText != null) destinationText.text = $"→ {GetNodeName(state.EndNodeId)}";

            if (timerText != null)
            {
                if (type == ContractDisplayType.Active)
                {
                    int timeLeft = Mathf.Max(0, state.TimeRemaining);
                    timerText.text = $"⏱ {timeLeft}";
                    timerText.color = timeLeft <= 3 ? new Color(1f, 0.4f, 0.3f) : Color.white;
                }
                else
                {
                    timerText.text = GetStatusString(state.Status);
                }
            }

            if (rewardText != null) rewardText.text = $"{state.RewardCredits}💰 {state.RewardReputation}⭐";
            if (cargoTypeText != null) cargoTypeText.text = GetCargoString(state.Cargo);
            if (riskIndicator != null) riskIndicator.color = GetRiskColor(state.RiskLevel);
            if (mainContractBadge != null) mainContractBadge.enabled = state.IsMainContract;
            if (statusIndicator != null) statusIndicator.color = GetStatusColor(state.Status);
            if (backgroundImage != null) backgroundImage.color = GetBackgroundColor(state.Status);
        }

        private void ConfigureVisuals()
        {
            if (itemButton != null)
            {
                itemButton.onClick.RemoveAllListeners();
                itemButton.onClick.AddListener(() => OnClicked?.Invoke(contractData, contractState));
            }
        }

        private string GetNodeName(int nodeId)
        {
            var dataManager = Core.GameManager.Instance?.GetModule<DataModule.DataManager>(Core.ModuleType.DataManager);
            var node = dataManager?.GetNode(nodeId);
            return node?.NodeName ?? "?";
        }

        private string GetCargoString(CargoType type)
        {
            switch (type)
            {
                case CargoType.MedicalSupplies: return "医疗";
                case CargoType.HighValueTech: return "高科技";
                case CargoType.PerishableFood: return "食品";
                case CargoType.Hazardous: return "危险品";
                case CargoType.LiveAnimals: return "活体";
                case CargoType.Mail: return "邮件";
                case CargoType.Passenger: return "乘客";
                default: return "货物";
            }
        }

        private Color GetRiskColor(CargoRiskLevel risk)
        {
            switch (risk)
            {
                case CargoRiskLevel.Low: return new Color(0.3f, 0.9f, 0.4f);
                case CargoRiskLevel.Medium: return new Color(1f, 0.8f, 0.2f);
                case CargoRiskLevel.High: return new Color(1f, 0.5f, 0.2f);
                case CargoRiskLevel.Critical: return new Color(1f, 0.2f, 0.2f);
                default: return Color.gray;
            }
        }

        private Color GetStatusColor()
        {
            switch (displayType)
            {
                case ContractDisplayType.Available: return new Color(0.5f, 0.7f, 1f);
                case ContractDisplayType.Active: return new Color(0.4f, 0.9f, 0.6f);
                default: return Color.gray;
            }
        }

        private Color GetStatusColor(ContractStatus status)
        {
            switch (status)
            {
                case ContractStatus.Completed: return new Color(0.3f, 0.9f, 0.5f);
                case ContractStatus.Failed: return new Color(1f, 0.3f, 0.3f);
                case ContractStatus.InTransit: return new Color(0.4f, 0.8f, 1f);
                case ContractStatus.CargoPickedUp: return new Color(1f, 0.8f, 0.3f);
                default: return Color.gray;
            }
        }

        private Color GetBackgroundColor()
        {
            switch (displayType)
            {
                case ContractDisplayType.Available: return availableColor;
                case ContractDisplayType.Active: return activeColor;
                default: return completedSuccessColor;
            }
        }

        private Color GetBackgroundColor(ContractStatus status)
        {
            switch (status)
            {
                case ContractStatus.Completed: return completedSuccessColor;
                case ContractStatus.Failed: return completedFailedColor;
                default: return activeColor;
            }
        }

        private string GetStatusString(ContractStatus status)
        {
            switch (status)
            {
                case ContractStatus.Completed: return "✓ 已完成";
                case ContractStatus.Failed: return "✗ 已失败";
                case ContractStatus.Expired: return "⏱ 已超时";
                default: return status.ToString();
            }
        }
    }
}
