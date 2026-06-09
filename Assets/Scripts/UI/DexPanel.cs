using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace PixelPlantLab
{
    public class DexPanel : MonoBehaviour
    {
        [Header("主面板")]
        public GameObject PanelRoot;
        public Button CloseButton;
        public Button OpenButton;

        [Header("进度显示")]
        public Text ProgressText;

        [Header("筛选器")]
        public Dropdown RarityFilterDropdown;
        public Dropdown TraitFilterDropdown;
        public Button ClearFilterButton;

        [Header("列表区域")]
        public RectTransform EntryListContainer;
        public GameObject DexEntryItemPrefab;

        [Header("详情区域")]
        public GameObject DetailPanel;
        public Image DetailPlantImage;
        public Text DetailNameText;
        public Text DetailDescText;
        public Text DetailRarityText;
        public Text DetailTraitsText;
        public Text DetailDiscoveryCountText;
        public Text DetailFirstDiscoveredText;
        public Text DetailFirstParamsText;
        public Text DetailHistoryText;
        public Button LoadRecipeButton;

        private readonly List<GameObject> _entryObjects = new List<GameObject>();
        private Rarity _currentRarityFilter = (Rarity)(-99);
        private MutationTrait _currentTraitFilter = MutationTrait.None;
        private DexEntry _selectedEntry;

        public event System.Action<ExperimentParams> OnLoadRecipeRequested;

        private void Start()
        {
            RegisterEvents();
            InitFilters();
            if (PanelRoot != null) PanelRoot.SetActive(false);
            RefreshList();
        }

        private void RegisterEvents()
        {
            if (OpenButton != null) OpenButton.onClick.AddListener(Open);
            if (CloseButton != null) CloseButton.onClick.AddListener(Close);
            if (ClearFilterButton != null) ClearFilterButton.onClick.AddListener(ClearFilters);
            if (RarityFilterDropdown != null) RarityFilterDropdown.onValueChanged.AddListener(_ => RefreshList());
            if (TraitFilterDropdown != null) TraitFilterDropdown.onValueChanged.AddListener(_ => RefreshList());
            if (LoadRecipeButton != null) LoadRecipeButton.onClick.AddListener(HandleLoadRecipe);

            if (DexManager.Instance != null)
            {
                DexManager.Instance.OnDexUpdated += _ => RefreshList();
            }
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
                RarityFilterDropdown.value = 0;
            }

            if (TraitFilterDropdown != null)
            {
                TraitFilterDropdown.options.Clear();
                TraitFilterDropdown.options.Add(new Dropdown.OptionData("全部特征"));
                foreach (MutationTrait t in System.Enum.GetValues(typeof(MutationTrait)))
                {
                    if (t == MutationTrait.None) continue;
                    TraitFilterDropdown.options.Add(new Dropdown.OptionData(TraitDisplayName(t)));
                }
                TraitFilterDropdown.value = 0;
            }
        }

        public void Open()
        {
            if (PanelRoot != null) PanelRoot.SetActive(true);
            RefreshList();
            UpdateProgress();
        }

        public void Close()
        {
            if (PanelRoot != null) PanelRoot.SetActive(false);
        }

        private void ClearFilters()
        {
            _currentRarityFilter = (Rarity)(-99);
            _currentTraitFilter = MutationTrait.None;
            if (RarityFilterDropdown != null) RarityFilterDropdown.value = 0;
            if (TraitFilterDropdown != null) TraitFilterDropdown.value = 0;
            RefreshList();
        }

        private void ReadFilters()
        {
            if (RarityFilterDropdown != null)
            {
                switch (RarityFilterDropdown.value)
                {
                    case 1: _currentRarityFilter = Rarity.Failure; break;
                    case 2: _currentRarityFilter = Rarity.Common; break;
                    case 3: _currentRarityFilter = Rarity.Rare; break;
                    case 4: _currentRarityFilter = Rarity.Legendary; break;
                    default: _currentRarityFilter = (Rarity)(-99); break;
                }
            }
            if (TraitFilterDropdown != null)
            {
                if (TraitFilterDropdown.value == 0)
                {
                    _currentTraitFilter = MutationTrait.None;
                }
                else
                {
                    var values = (MutationTrait[])System.Enum.GetValues(typeof(MutationTrait));
                    int idx = 0;
                    foreach (var v in values)
                    {
                        if (v == MutationTrait.None) continue;
                        idx++;
                        if (idx == TraitFilterDropdown.value)
                        {
                            _currentTraitFilter = v;
                            break;
                        }
                    }
                }
            }
        }

        public void RefreshList()
        {
            if (DexManager.Instance == null) return;
            ReadFilters();
            ClearEntryObjects();

            var entries = DexManager.Instance.GetAllEntries();
            entries.Sort((a, b) =>
            {
                var pa = PlantDatabase.GetPlant(a.PlantId);
                var pb = PlantDatabase.GetPlant(b.PlantId);
                if (pa == null || pb == null) return 0;
                int r = pa.Rarity.CompareTo(pb.Rarity);
                if (r != 0) return r;
                return string.Compare(pa.DisplayName, pb.DisplayName, System.StringComparison.Ordinal);
            });

            if (EntryListContainer == null || DexEntryItemPrefab == null) return;

            foreach (var entry in entries)
            {
                var plant = PlantDatabase.GetPlant(entry.PlantId);
                if (plant == null) continue;
                if ((int)_currentRarityFilter != -99 && plant.Rarity != _currentRarityFilter) continue;
                if (_currentTraitFilter != MutationTrait.None && !plant.HasTrait(_currentTraitFilter)) continue;

                var go = Instantiate(DexEntryItemPrefab, EntryListContainer);
                _entryObjects.Add(go);
                SetupEntryItem(go, entry, plant);
            }

            UpdateProgress();
        }

        private void SetupEntryItem(GameObject go, DexEntry entry, PlantMutation plant)
        {
            var texts = go.GetComponentsInChildren<Text>();
            string displayName = entry.IsDiscovered ? plant.DisplayName : "???";
            Rarity displayRarity = entry.IsDiscovered ? plant.Rarity : Rarity.Common;

            foreach (var t in texts)
            {
                if (t.name.Contains("Name")) t.text = ColorByRarity(displayName, displayRarity);
                if (t.name.Contains("Rarity"))
                {
                    string rarityStr = displayRarity switch
                    {
                        Rarity.Failure => "失败",
                        Rarity.Common => "普通",
                        Rarity.Rare => "稀有",
                        Rarity.Legendary => "传说",
                        _ => ""
                    };
                    t.text = ColorByRarity(rarityStr, displayRarity);
                }
                if (t.name.Contains("Count"))
                    t.text = entry.IsDiscovered ? $"发现×{entry.DiscoveryCount}" : "未发现";
            }

            var btn = go.GetComponentInChildren<Button>();
            if (btn != null) btn.onClick.AddListener(() => SelectEntry(entry));
        }

        private void SelectEntry(DexEntry entry)
        {
            _selectedEntry = entry;
            UpdateDetailPanel();
        }

        private void UpdateDetailPanel()
        {
            if (DetailPanel != null) DetailPanel.SetActive(_selectedEntry != null);
            if (_selectedEntry == null) return;

            var plant = PlantDatabase.GetPlant(_selectedEntry.PlantId);
            if (plant == null) return;

            if (DetailNameText != null)
            {
                DetailNameText.text = _selectedEntry.IsDiscovered
                    ? ColorByRarity(plant.DisplayName, plant.Rarity)
                    : "未发现：需要继续实验！";
            }
            if (DetailDescText != null)
            {
                DetailDescText.text = _selectedEntry.IsDiscovered ? plant.Description : "完成一次实验并得到该结果即可解锁。";
            }
            if (DetailRarityText != null)
            {
                string rarityStr = plant.Rarity switch
                {
                    Rarity.Failure => "失败样本",
                    Rarity.Common => "普通",
                    Rarity.Rare => "稀有",
                    Rarity.Legendary => "传说",
                    _ => ""
                };
                DetailRarityText.text = ColorByRarity($"稀有度: {rarityStr}", plant.Rarity);
            }
            if (DetailTraitsText != null)
            {
                DetailTraitsText.text = _selectedEntry.IsDiscovered
                    ? FormatTraits(plant.Traits)
                    : "特征: ???";
            }
            if (DetailDiscoveryCountText != null)
                DetailDiscoveryCountText.text = _selectedEntry.IsDiscovered
                    ? $"累计发现次数: {_selectedEntry.DiscoveryCount}"
                    : "尚未发现";
            if (DetailFirstDiscoveredText != null)
            {
                DetailFirstDiscoveredText.text = _selectedEntry.IsDiscovered
                    ? $"首次发现: {_selectedEntry.FirstDiscoveredAt:yyyy-MM-dd HH:mm}"
                    : "";
            }
            if (DetailFirstParamsText != null)
            {
                DetailFirstParamsText.text = _selectedEntry.IsDiscovered && _selectedEntry.FirstDiscoveryParams != null
                    ? $"首次配方: {_selectedEntry.FirstDiscoveryParams.ToParamString()}"
                    : "";
            }
            if (DetailHistoryText != null)
            {
                if (_selectedEntry.IsDiscovered && _selectedEntry.DiscoveryParamHistory.Count > 0)
                {
                    int showCount = Mathf.Min(5, _selectedEntry.DiscoveryParamHistory.Count);
                    string history = "最近配方:\n";
                    for (int i = _selectedEntry.DiscoveryParamHistory.Count - showCount; i < _selectedEntry.DiscoveryParamHistory.Count; i++)
                    {
                        history += $"  · {_selectedEntry.DiscoveryParamHistory[i]}\n";
                    }
                    DetailHistoryText.text = history;
                }
                else DetailHistoryText.text = "";
            }
            if (LoadRecipeButton != null)
            {
                LoadRecipeButton.gameObject.SetActive(_selectedEntry.IsDiscovered && _selectedEntry.FirstDiscoveryParams != null);
            }
        }

        private void HandleLoadRecipe()
        {
            if (_selectedEntry?.FirstDiscoveryParams != null)
                OnLoadRecipeRequested?.Invoke(_selectedEntry.FirstDiscoveryParams);
        }

        private void UpdateProgress()
        {
            if (ProgressText != null && DexManager.Instance != null)
                ProgressText.text = DexManager.Instance.GetDiscoveryProgressString();
        }

        private void ClearEntryObjects()
        {
            foreach (var go in _entryObjects) if (go != null) Destroy(go);
            _entryObjects.Clear();
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
            if (traits == MutationTrait.None) return "特征: 无特殊特征";
            var parts = new List<string>();
            foreach (MutationTrait t in System.Enum.GetValues(typeof(MutationTrait)))
            {
                if (t != MutationTrait.None && (traits & t) != 0)
                    parts.Add(TraitDisplayName(t));
            }
            return "特征: " + string.Join(", ", parts);
        }
    }
}
