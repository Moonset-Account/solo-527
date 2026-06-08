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
    public class ContractPanel : UIPanelBase
    {
        [Header("Tabs")]
        public Button availableTabButton;
        public Button activeTabButton;
        public Button completedTabButton;
        public Image availableTabIndicator;
        public Image activeTabIndicator;
        public Image completedTabIndicator;

        [Header("Content Containers")]
        public Transform availableContainer;
        public Transform activeContainer;
        public Transform completedContainer;

        [Header("Prefabs")]
        public ContractItemView contractItemPrefab;

        [Header("Detail Panel")]
        public GameObject detailPanel;
        public TextMeshProUGUI detailTitle;
        public TextMeshProUGUI detailDescription;
        public TextMeshProUGUI detailCargoType;
        public TextMeshProUGUI detailFromTo;
        public TextMeshProUGUI detailTimeLimit;
        public TextMeshProUGUI detailReward;
        public TextMeshProUGUI detailRisk;
        public TextMeshProUGUI detailCargoIntegrity;
        public Image detailRiskColor;
        public Button acceptButton;
        public Button closeDetailButton;

        private enum TabType { Available, Active, Completed }
        private TabType currentTab = TabType.Available;

        private DataManager dataManager;
        private TurnManager turnManager;
        private ContractState selectedContract;
        private ContractData selectedContractData;

        private List<ContractItemView> itemViews = new List<ContractItemView>();

        public event Action<int> OnContractAccepted;
        public event Action<int> OnContractDetailRequested;

        protected override void Awake()
        {
            base.Awake();
        }

        public override void BindEvents()
        {
            base.BindEvents();

            if (availableTabButton != null) availableTabButton.onClick.AddListener(() => SwitchTab(TabType.Available));
            if (activeTabButton != null) activeTabButton.onClick.AddListener(() => SwitchTab(TabType.Active));
            if (completedTabButton != null) completedTabButton.onClick.AddListener(() => SwitchTab(TabType.Completed));
            if (acceptButton != null) acceptButton.onClick.AddListener(OnAcceptClicked);
            if (closeDetailButton != null) closeDetailButton.onClick.AddListener(CloseDetail);
        }

        protected override void OnOpened()
        {
            base.OnOpened();
            dataManager = GameManager.Instance?.GetModule<DataManager>(ModuleType.DataManager);
            turnManager = GameManager.Instance?.GetModule<TurnManager>(ModuleType.TurnManager);
            SwitchTab(TabType.Available);
        }

        private void SwitchTab(TabType tab)
        {
            currentTab = tab;
            UpdateTabIndicators();
            PopulateCurrentTab();
            PlayClick();
        }

        private void UpdateTabIndicators()
        {
            if (availableTabIndicator != null) availableTabIndicator.enabled = currentTab == TabType.Available;
            if (activeTabIndicator != null) activeTabIndicator.enabled = currentTab == TabType.Active;
            if (completedTabIndicator != null) completedTabIndicator.enabled = currentTab == TabType.Completed;

            if (availableContainer != null) availableContainer.gameObject.SetActive(currentTab == TabType.Available);
            if (activeContainer != null) activeContainer.gameObject.SetActive(currentTab == TabType.Active);
            if (completedContainer != null) completedContainer.gameObject.SetActive(currentTab == TabType.Completed);
        }

        private void PopulateCurrentTab()
        {
            ClearItems();

            switch (currentTab)
            {
                case TabType.Available:
                    PopulateAvailable();
                    break;
                case TabType.Active:
                    PopulateActive();
                    break;
                case TabType.Completed:
                    PopulateCompleted();
                    break;
            }
        }

        private void ClearItems()
        {
            foreach (var item in itemViews)
            {
                if (item != null && item.gameObject != null)
                    Destroy(item.gameObject);
            }
            itemViews.Clear();
        }

        private void PopulateAvailable()
        {
            if (dataManager == null || availableContainer == null || contractItemPrefab == null) return;

            var currentNodeId = dataManager.RuntimeData.Ship.CurrentNodeId;
            var contracts = dataManager.GetAvailableContractsAtNode(currentNodeId);

            if (contracts.Count == 0)
            {
                CreateEmptyNotice(availableContainer, "当前节点没有可接合同");
                return;
            }

            foreach (var contract in contracts)
            {
                CreateContractItem(contract, availableContainer, ContractItemView.ContractDisplayType.Available);
            }
        }

        private void PopulateActive()
        {
            if (dataManager == null || activeContainer == null || contractItemPrefab == null) return;

            var active = dataManager.RuntimeData.ActiveContracts;
            if (active.Count == 0)
            {
                CreateEmptyNotice(activeContainer, "没有进行中的合同");
                return;
            }

            foreach (var contract in active)
            {
                CreateContractItem(contract, activeContainer, ContractItemView.ContractDisplayType.Active);
            }
        }

        private void PopulateCompleted()
        {
            if (dataManager == null || completedContainer == null || contractItemPrefab == null) return;

            var completed = dataManager.RuntimeData.CompletedContracts;
            if (completed.Count == 0)
            {
                CreateEmptyNotice(completedContainer, "暂无完成记录");
                return;
            }

            foreach (var contract in completed)
            {
                CreateContractItem(contract, completedContainer, ContractItemView.ContractDisplayType.Completed);
            }
        }

        private void CreateEmptyNotice(Transform parent, string text)
        {
            if (parent == null) return;
            var obj = new GameObject("EmptyNotice", typeof(RectTransform));
            obj.transform.SetParent(parent, false);
            var tmp = obj.AddComponent<TextMeshProUGUI>();
            tmp.text = text;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = new Color(0.7f, 0.7f, 0.7f, 0.8f);
            tmp.fontSize = 18;
            var rt = obj.GetComponent<RectTransform>();
            rt.anchorMin = new Vector2(0, 0.5f);
            rt.anchorMax = new Vector2(1, 0.5f);
            rt.sizeDelta = new Vector2(0, 40);
        }

        private void CreateContractItem(ContractData data, Transform parent, ContractItemView.ContractDisplayType type)
        {
            var item = Instantiate(contractItemPrefab, parent);
            item.Initialize(data, type);
            item.OnClicked += HandleItemClicked;
            itemViews.Add(item);
        }

        private void CreateContractItem(ContractState state, Transform parent, ContractItemView.ContractDisplayType type)
        {
            var item = Instantiate(contractItemPrefab, parent);
            item.Initialize(state, type);
            item.OnClicked += HandleItemClicked;
            itemViews.Add(item);
        }

        private void HandleItemClicked(ContractData data, ContractState state)
        {
            selectedContractData = data;
            selectedContract = state;
            ShowDetail();
            PlayClick();
        }

        private void ShowDetail()
        {
            if (detailPanel != null) detailPanel.SetActive(true);

            var contractData = selectedContractData;
            var contractState = selectedContract;

            if (contractData == null && contractState != null)
            {
                contractData = dataManager?.GetContract(contractState.ContractId);
            }
            if (contractData == null) return;

            if (detailTitle != null)
            {
                detailTitle.text = contractData.Title + (contractData.IsMainContract ? " ★主线" : "");
            }
            if (detailDescription != null)
            {
                detailDescription.text = contractData.Description;
            }
            if (detailCargoType != null)
            {
                detailCargoType.text = $"货物类型: {GetCargoTypeString(contractData.Cargo)}";
            }

            var fromNode = dataManager?.GetNode(contractData.StartNodeId);
            var toNode = dataManager?.GetNode(contractData.EndNodeId);
            if (detailFromTo != null)
            {
                detailFromTo.text = $"路线: {fromNode?.NodeName ?? "?"} → {toNode?.NodeName ?? "?"}";
            }

            int timeLeft = contractState != null ? contractState.TimeRemaining : contractData.TimeLimit;
            if (detailTimeLimit != null)
            {
                detailTimeLimit.text = $"时限: {timeLeft} / {contractData.TimeLimit} 回合";
            }

            if (detailReward != null)
            {
                detailReward.text = $"报酬: {contractData.RewardCredits} 💰   {contractData.RewardReputation} ⭐";
            }

            if (detailRisk != null)
            {
                detailRisk.text = $"风险: {GetRiskString(contractData.RiskLevel)}";
            }
            if (detailRiskColor != null)
            {
                detailRiskColor.color = GetRiskColor(contractData.RiskLevel);
            }

            if (detailCargoIntegrity != null)
            {
                detailCargoIntegrity.gameObject.SetActive(contractState != null);
                if (contractState != null)
                {
                    detailCargoIntegrity.text = $"货物完整度: {contractState.CargoIntegrity}%";
                }
            }

            if (acceptButton != null)
            {
                bool canAccept = currentTab == TabType.Available && contractData != null;
                acceptButton.gameObject.SetActive(canAccept);
            }

            OnContractDetailRequested?.Invoke(contractData.ContractId);
        }

        private void CloseDetail()
        {
            if (detailPanel != null) detailPanel.SetActive(false);
            PlayClick();
        }

        private void OnAcceptClicked()
        {
            if (selectedContractData == null) return;
            OnContractAccepted?.Invoke(selectedContractData.ContractId);
            CloseDetail();
            PopulateCurrentTab();
            PlayClick();
        }

        private string GetCargoTypeString(CargoType type)
        {
            switch (type)
            {
                case CargoType.GeneralGoods: return "普通货物";
                case CargoType.MedicalSupplies: return "医疗物资";
                case CargoType.HighValueTech: return "高科技产品";
                case CargoType.PerishableFood: return "易腐食品";
                case CargoType.Hazardous: return "危险物品";
                case CargoType.LiveAnimals: return "活体动物";
                case CargoType.Mail: return "邮件包裹";
                case CargoType.Passenger: return "乘客";
                default: return "未知";
            }
        }

        private string GetRiskString(CargoRiskLevel risk)
        {
            switch (risk)
            {
                case CargoRiskLevel.Low: return "低";
                case CargoRiskLevel.Medium: return "中";
                case CargoRiskLevel.High: return "高";
                case CargoRiskLevel.Critical: return "极高";
                default: return "未知";
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

        private void PlayClick()
        {
            var audioManager = GameManager.Instance?.GetModule<Audio.AudioManager>(ModuleType.AudioManager);
            audioManager?.PlaySfx(Audio.SfxType.UI_ButtonClick);
        }

        protected override void OnDestroy()
        {
            base.OnDestroy();

            if (availableTabButton != null) availableTabButton.onClick.RemoveAllListeners();
            if (activeTabButton != null) activeTabButton.onClick.RemoveAllListeners();
            if (completedTabButton != null) completedTabButton.onClick.RemoveAllListeners();
            if (acceptButton != null) acceptButton.onClick.RemoveListener(OnAcceptClicked);
            if (closeDetailButton != null) closeDetailButton.onClick.RemoveListener(CloseDetail);
        }
    }
}
