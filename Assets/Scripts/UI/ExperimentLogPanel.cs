using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace PixelPlantLab
{
    public class ExperimentLogPanel : MonoBehaviour
    {
        [Header("主面板")]
        public GameObject PanelRoot;
        public Button CloseButton;
        public Button OpenButton;

        [Header("统计显示")]
        public Text StatsSummaryText;
        public Text LogCountText;

        [Header("筛选器")]
        public Dropdown RarityFilterDropdown;
        public Dropdown TraitFilterDropdown;
        public Dropdown StatusFilterDropdown;
        public Toggle FirstDiscoveryOnlyToggle;
        public Button ClearFilterButton;

        [Header("列表区域")]
        public RectTransform LogListContainer;
        public GameObject LogItemPrefab;
        public int MaxItemsShown = 50;

        [Header("详情区域")]
        public GameObject DetailPanel;
        public Text DetailTimestampText;
        public Text DetailPlantNameText;
        public Text DetailRarityText;
        public Text DetailTraitsText;
        public Text DetailStatusText;
        public Text DetailParamsText;
        public Text DetailResourcesText;
        public Text DetailNotesText;
        public Button LoadRecipeFromLogButton;

        private readonly List<GameObject> _logObjects = new List<GameObject>();
        private ExperimentLogEntry _selectedEntry;
        private Rarity _rarityFilter = (Rarity)(-99);
        private MutationTrait _traitFilter = MutationTrait.None;
        private ExperimentStatus _statusFilter = (ExperimentStatus)(-1);
        private bool _firstDiscoveryOnly;

        public event Action<ExperimentParams> OnLoadRecipeFromLog;

        private void Start()
        {
            RegisterEvents();
            InitFilters();
            if (PanelRoot != null) PanelRoot.SetActive(false);
            RefreshLogs();
        }

        private void RegisterEvents()
        {
            if (OpenButton != null) OpenButton.onClick.AddListener(Open);
            if (CloseButton != null) CloseButton.onClick.AddListener(Close);
            if (ClearFilterButton != null) ClearFilterButton.onClick.AddListener(ClearFilters);
            if (RarityFilterDropdown != null) RarityFilterDropdown.onValueChanged.AddListener(_ => RefreshLogs());
            if (TraitFilterDropdown != null) TraitFilterDropdown.onValueChanged.AddListener(_ => RefreshLogs());
            if (StatusFilterDropdown != null) StatusFilterDropdown.onValueChanged.AddListener(_ => RefreshLogs());
            if (FirstDiscoveryOnlyToggle != null) FirstDiscoveryOnlyToggle.onValueChanged.AddListener(_ => RefreshLogs());
            if (LoadRecipeFromLogButton != null) LoadRecipeFromLogButton.onClick.AddListener(HandleLoadRecipe);

            if (ExperimentLogManager.Instance != null)
                ExperimentLogManager.Instance.OnLogUpdated += RefreshLogs;
        }

        private void InitFilters()
        {
            if (RarityFilterDropdown != null)
            {
                RarityFilterDropdown.options.Clear();
                RarityFilterDropdown.options.Add(new Dropdown.OptionData("全部稀有度"));
                RarityFilterDropdown.options.Add(new Dropdown.OptionData("失败"));
                RarityFilterDropdown.options.Add(new Dropdown.OptionData("普通"));
                RarityFilterDropdown.options.Add(new Dropdown.OptionData("稀有"));
                RarityFilterDropdown.options.Add(new Dropdown.OptionData("传说"));
            }
            if (TraitFilterDropdown != null)
            {
                TraitFilterDropdown.options.Clear();
                TraitFilterDropdown.options.Add(new Dropdown.OptionData("全部特征"));
                foreach (MutationTrait t in Enum.GetValues(typeof(MutationTrait)))
                {
                    if (t == MutationTrait.None) continue;
                    TraitFilterDropdown.options.Add(new Dropdown.OptionData(TraitDisplayName(t)));
                }
            }
            if (StatusFilterDropdown != null)
            {
                StatusFilterDropdown.options.Clear();
                StatusFilterDropdown.options.Add(new Dropdown.OptionData("全部状态"));
                StatusFilterDropdown.options.Add(new Dropdown.OptionData("成功"));
                StatusFilterDropdown.options.Add(new Dropdown.OptionData("失败"));
                StatusFilterDropdown.options.Add(new Dropdown.OptionData("已终止"));
            }
        }

        public void Open()
        {
            if (PanelRoot != null) PanelRoot.SetActive(true);
            RefreshLogs();
            UpdateStats();
        }

        public void Close()
        {
            if (PanelRoot != null) PanelRoot.SetActive(false);
        }

        private void ClearFilters()
        {
            _rarityFilter = (Rarity)(-99);
            _traitFilter = MutationTrait.None;
            _statusFilter = (ExperimentStatus)(-1);
            _firstDiscoveryOnly = false;
            if (RarityFilterDropdown != null) RarityFilterDropdown.value = 0;
            if (TraitFilterDropdown != null) TraitFilterDropdown.value = 0;
            if (StatusFilterDropdown != null) StatusFilterDropdown.value = 0;
            if (FirstDiscoveryOnlyToggle != null) FirstDiscoveryOnlyToggle.isOn = false;
            RefreshLogs();
        }

        private void ReadFilters()
        {
            if (RarityFilterDropdown != null)
            {
                switch (RarityFilterDropdown.value)
                {
                    case 1: _rarityFilter = Rarity.Failure; break;
                    case 2: _rarityFilter = Rarity.Common; break;
                    case 3: _rarityFilter = Rarity.Rare; break;
                    case 4: _rarityFilter = Rarity.Legendary; break;
                    default: _rarityFilter = (Rarity)(-99); break;
                }
            }
            if (TraitFilterDropdown != null)
            {
                if (TraitFilterDropdown.value == 0)
                {
                    _traitFilter = MutationTrait.None;
                }
                else
                {
                    var values = (MutationTrait[])Enum.GetValues(typeof(MutationTrait));
                    int idx = 0;
                    foreach (var v in values)
                    {
                        if (v == MutationTrait.None) continue;
                        idx++;
                        if (idx == TraitFilterDropdown.value) { _traitFilter = v; break; }
                    }
                }
            }
            if (StatusFilterDropdown != null)
            {
                switch (StatusFilterDropdown.value)
                {
                    case 1: _statusFilter = ExperimentStatus.Completed; break;
                    case 2: _statusFilter = ExperimentStatus.Failed; break;
                    case 3: _statusFilter = ExperimentStatus.Aborted; break;
                    default: _statusFilter = (ExperimentStatus)(-1); break;
                }
            }
            if (FirstDiscoveryOnlyToggle != null) _firstDiscoveryOnly = FirstDiscoveryOnlyToggle.isOn;
        }

        public void RefreshLogs()
        {
            if (ExperimentLogManager.Instance == null) return;
            ReadFilters();
            ClearLogObjects();

            var allLogs = ExperimentLogManager.Instance.Logs;
            var filtered = new List<ExperimentLogEntry>();

            foreach (var log in allLogs)
            {
                if ((int)_rarityFilter != -99 && log.ResultRarity != _rarityFilter) continue;
                if (_traitFilter != MutationTrait.None && !log.HasTrait(_traitFilter)) continue;
                if ((int)_statusFilter != -1 && log.Status != _statusFilter) continue;
                if (_firstDiscoveryOnly && !log.IsFirstDiscovery) continue;
                filtered.Add(log);
                if (filtered.Count >= MaxItemsShown) break;
            }

            if (LogCountText != null) LogCountText.text = $"显示 {filtered.Count}/{allLogs.Count} 条记录";

            if (LogListContainer == null || LogItemPrefab == null) return;

            foreach (var entry in filtered)
            {
                var go = Instantiate(LogItemPrefab, LogListContainer);
                _logObjects.Add(go);
                SetupLogItem(go, entry);
            }
        }

        private void SetupLogItem(GameObject go, ExperimentLogEntry entry)
        {
            var plant = PlantDatabase.GetPlant(entry.ResultPlantId);
            string plantName = plant != null ? plant.DisplayName : $"未知({entry.ResultPlantId})";
            Rarity rarity = plant != null ? plant.Rarity : entry.ResultRarity;

            var texts = go.GetComponentsInChildren<Text>();
            foreach (var t in texts)
            {
                if (t.name.Contains("Time"))
                    t.text = entry.Timestamp.ToString("MM-dd HH:mm");
                if (t.name.Contains("Name"))
                    t.text = ColorByRarity(plantName, rarity) + (entry.IsFirstDiscovery ? " ★" : "");
                if (t.name.Contains("Status"))
                {
                    string statusStr = entry.Status switch
                    {
                        ExperimentStatus.Completed => "成功",
                        ExperimentStatus.Failed => "失败",
                        ExperimentStatus.Aborted => "终止",
                        _ => entry.Status.ToString()
                    };
                    t.text = statusStr;
                }
                if (t.name.Contains("Params"))
                    t.text = entry.Parameters.ToParamString();
            }

            var btn = go.GetComponentInChildren<Button>();
            if (btn != null) btn.onClick.AddListener(() => SelectEntry(entry));
        }

        private void SelectEntry(ExperimentLogEntry entry)
        {
            _selectedEntry = entry;
            UpdateDetailPanel();
        }

        private void UpdateDetailPanel()
        {
            if (DetailPanel != null) DetailPanel.SetActive(_selectedEntry != null);
            if (_selectedEntry == null) return;

            var plant = PlantDatabase.GetPlant(_selectedEntry.ResultPlantId);

            if (DetailTimestampText != null)
                DetailTimestampText.text = $"时间: {_selectedEntry.Timestamp:yyyy-MM-dd HH:mm:ss}";
            if (DetailPlantNameText != null)
            {
                string name = plant != null ? plant.DisplayName : _selectedEntry.ResultPlantId;
                Rarity rarity = plant != null ? plant.Rarity : _selectedEntry.ResultRarity;
                DetailPlantNameText.text = ColorByRarity(name, rarity) + (_selectedEntry.IsFirstDiscovery ? " ★首次发现★" : "");
            }
            if (DetailRarityText != null)
            {
                string rarityStr = _selectedEntry.ResultRarity switch
                {
                    Rarity.Failure => "失败",
                    Rarity.Common => "普通",
                    Rarity.Rare => "稀有",
                    Rarity.Legendary => "传说",
                    _ => ""
                };
                DetailRarityText.text = $"稀有度: {rarityStr}";
            }
            if (DetailTraitsText != null)
                DetailTraitsText.text = FormatTraits(_selectedEntry.ResultTraits);
            if (DetailStatusText != null)
            {
                string statusStr = _selectedEntry.Status switch
                {
                    ExperimentStatus.Completed => "实验成功",
                    ExperimentStatus.Failed => "实验失败（已记录到图鉴）",
                    ExperimentStatus.Aborted => "实验被提前终止",
                    _ => _selectedEntry.Status.ToString()
                };
                DetailStatusText.text = statusStr;
            }
            if (DetailParamsText != null)
                DetailParamsText.text = $"实验参数: {_selectedEntry.Parameters.ToParamString()}";
            if (DetailResourcesText != null)
                DetailResourcesText.text = $"消耗: {_selectedEntry.ResourcesSpent} | 返还: {_selectedEntry.ResourcesRefunded}";
            if (DetailNotesText != null && !string.IsNullOrEmpty(_selectedEntry.Notes))
                DetailNotesText.text = $"备注: {_selectedEntry.Notes}";

            if (LoadRecipeFromLogButton != null)
                LoadRecipeFromLogButton.gameObject.SetActive(_selectedEntry.Parameters != null);
        }

        private void HandleLoadRecipe()
        {
            if (_selectedEntry?.Parameters != null)
                OnLoadRecipeFromLog?.Invoke(_selectedEntry.Parameters);
        }

        private void UpdateStats()
        {
            if (StatsSummaryText != null && ExperimentLogManager.Instance != null)
                StatsSummaryText.text = ExperimentLogManager.Instance.GetStatisticsSummary();
        }

        private void ClearLogObjects()
        {
            foreach (var go in _logObjects) if (go != null) Destroy(go);
            _logObjects.Clear();
        }

        private static string ColorByRarity(string text, Rarity rarity)
        {
            return rarity switch
            {
                Rarity.Failure => $"<color=#888888>{text}</color>",
                Rarity.Common => $"<color=#BBBBBB>{text}</color>",
                Rarity.Rare => $"<color=#66AAFF>{text}</color>",
                Rarity.Legendary => $"<color=#FFD700>{text}</color>",
                _ => text
            };
        }

        private static string TraitDisplayName(MutationTrait trait)
        {
            return trait switch
            {
                MutationTrait.Glowing => "发光",
                MutationTrait.Crystalline => "结晶",
                MutationTrait.Poisonous => "有毒",
                MutationTrait.Giant => "巨型",
                MutationTrait.Miniature => "迷你",
                MutationTrait.Spiky => "带刺",
                MutationTrait.Fruity => "果味",
                MutationTrait.Burning => "火焰",
                MutationTrait.Frozen => "冰霜",
                MutationTrait.Electric => "带电",
                MutationTrait.Invisible => "隐形",
                MutationTrait.MultiHead => "多头",
                MutationTrait.Winged => "有翼",
                MutationTrait.Metallic => "金属",
                MutationTrait.Rainbow => "彩虹",
                MutationTrait.Withered => "枯萎",
                MutationTrait.Moldy => "发霉",
                MutationTrait.Stunted => "发育不良",
                _ => trait.ToString()
            };
        }

        private static string FormatTraits(MutationTrait traits)
        {
            if (traits == MutationTrait.None) return "特征: 无";
            var parts = new List<string>();
            foreach (MutationTrait t in Enum.GetValues(typeof(MutationTrait)))
            {
                if (t != MutationTrait.None && (traits & t) != 0)
                    parts.Add(TraitDisplayName(t));
            }
            return "特征: " + string.Join(", ", parts);
        }
    }
}
