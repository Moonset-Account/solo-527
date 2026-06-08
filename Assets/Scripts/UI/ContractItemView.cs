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
