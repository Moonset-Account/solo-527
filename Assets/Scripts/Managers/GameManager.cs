using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace PixelPlantLab
{
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [Header("核心组件引用 - 由Inspector绑定")]
        public ParameterPanel ParameterPanel;
        public SampleDisplay SampleDisplay;
        public DexPanel DexPanel;
        public ExperimentLogPanel ExperimentLogPanel;
        public QuestAndChallengePanel QuestAndChallengePanel;

        [Header("HUD资源显示")]
        public Text HudSeedsText;
        public Text HudNutrientsText;
        public Text HudCreditsText;
        public Text HudDexProgressText;
        public Text HudQuestHintText;

        [Header("全局提示")]
        public GameObject ToastRoot;
        public Text ToastText;
        public Image ToastBg;
        public float ToastDuration = 2.5f;

        [Header("实验设置")]
        public float ExperimentRealSeconds = 8f;
        public Color ToastNormalColor = new Color(0.15f, 0.15f, 0.15f, 0.95f);
        public Color ToastSuccessColor = new Color(0.15f, 0.4f, 0.15f, 0.95f);
        public Color ToastWarnColor = new Color(0.4f, 0.25f, 0.15f, 0.95f);
        public Color ToastErrorColor = new Color(0.4f, 0.15f, 0.15f, 0.95f);

        private ExperimentParams _activeParams;
        private ResourceData _activeExperimentCost;
        private DateTime _experimentStartTime;
        private bool _experimentInProgress;

        public event Action OnExperimentStarted;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void Start()
        {
            EnsureManagersExist();
            RegisterCallbacks();
            UpdateHudAll();
            ShowToast("欢迎来到像素植物实验室！调整参数开始第一次实验吧！", ToastType.Normal);
            CheckShowTutorialHint();
        }

        private void EnsureManagersExist()
        {
            if (DexManager.Instance == null)
            {
                var go = new GameObject("DexManager");
                go.AddComponent<DexManager>();
            }
            if (ExperimentLogManager.Instance == null)
            {
                var go = new GameObject("ExperimentLogManager");
                go.AddComponent<ExperimentLogManager>();
            }
            if (ResourceManager.Instance == null)
            {
                var go = new GameObject("ResourceManager");
                go.AddComponent<ResourceManager>();
            }
            if (QuestManager.Instance == null)
            {
                var go = new GameObject("QuestManager");
                go.AddComponent<QuestManager>();
            }
            if (DailyChallengeManager.Instance == null)
            {
                var go = new GameObject("DailyChallengeManager");
                go.AddComponent<DailyChallengeManager>();
            }
        }

        private void RegisterCallbacks()
        {
            if (ParameterPanel != null)
            {
                ParameterPanel.OnStartExperiment += HandleStartExperiment;
                ParameterPanel.OnAbortExperiment += HandleAbortExperiment;
            }
            if (SampleDisplay != null)
            {
                SampleDisplay.OnExperimentCompleted += HandleExperimentCompleted;
            }
            if (DexPanel != null)
            {
                DexPanel.OnLoadRecipeRequested += HandleLoadRecipe;
            }
            if (ExperimentLogPanel != null)
            {
                ExperimentLogPanel.OnLoadRecipeFromLog += HandleLoadRecipe;
            }
            if (DexManager.Instance != null)
            {
                DexManager.Instance.OnPlantDiscovered += HandlePlantDiscovered;
                DexManager.Instance.OnDexUpdated += _ => UpdateHudDexProgress();
            }
            if (ResourceManager.Instance != null)
            {
                ResourceManager.Instance.OnResourcesChanged += (_, __) => UpdateHudResources();
            }
            if (QuestManager.Instance != null)
            {
                QuestManager.Instance.OnQuestProgressUpdated += _ => CheckShowTutorialHint();
                QuestManager.Instance.OnQuestCompleted += q => ShowToast($"任务完成：{q.Title}！前往奖励面板领取。", ToastType.Success);
                QuestManager.Instance.OnQuestRewardsClaimed += (q, r) => ShowToast($"领取奖励：种子+{r.Seeds} 营养+{r.Nutrients} 积分+{r.Credits}", ToastType.Success);
            }
        }

        private void HandleStartExperiment(ExperimentParams parameters)
        {
            if (_experimentInProgress) return;

            if (!ResourceManager.Instance.CanAffordExperiment(parameters, out var cost))
            {
                ShowToast($"资源不足！需要 种子×{cost.Seeds} 营养×{cost.Nutrients} 积分×{cost.Credits}", ToastType.Error);
                ParameterPanel?.EndExperimentUI();
                return;
            }

            _activeParams = parameters.Clone();
            _activeExperimentCost = cost;
            _experimentStartTime = DateTime.Now;
            _experimentInProgress = true;

            ResourceManager.Instance.DeductExperimentCost(parameters, out _, out _);

            if (QuestManager.Instance != null)
            {
                var stats = MutationEngine.GetOrCreateStats(parameters);
                QuestManager.Instance.NotifySameRecipeExperimentRun(parameters, stats.TotalRuns + 1);
            }

            SampleDisplay?.StartExperiment(parameters, ExperimentRealSeconds);
            OnExperimentStarted?.Invoke();

            ShowToast($"实验开始！消耗 种子×{cost.Seeds} 营养×{cost.Nutrients} 积分×{cost.Credits}", ToastType.Normal);
            UpdateHudResources();
        }

        private void HandleAbortExperiment()
        {
            if (!_experimentInProgress) return;

            float progressRatio = SampleDisplay != null && SampleDisplay.ProgressBar != null
                ? SampleDisplay.ProgressBar.value
                : Mathf.Clamp01((float)(DateTime.Now - _experimentStartTime).TotalSeconds / ExperimentRealSeconds);

            SampleDisplay?.AbortExperiment();
            ParameterPanel?.EndExperimentUI();

            var refund = ResourceManager.Instance.RefundResources(ExperimentStatus.Aborted, _activeExperimentCost, progressRatio);

            int totalSpent = ResourceManager.Instance.GetTotalCostValue(_activeExperimentCost);
            int totalRefund = ResourceManager.Instance.GetTotalCostValue(refund);

            ExperimentLogManager.Instance?.AddLog(_activeParams, null, ExperimentStatus.Aborted,
                false, totalSpent, totalRefund, $"提前终止，返还比例 {((float)totalRefund / Math.Max(1, totalSpent) * 100f):F0}%");

            _experimentInProgress = false;
            ShowToast($"实验已终止，部分资源已返还。", ToastType.Warn);
        }

        private void HandleExperimentCompleted(PlantMutation resultPlant)
        {
            if (!_experimentInProgress) return;

            var status = resultPlant.Rarity == Rarity.Failure ? ExperimentStatus.Failed : ExperimentStatus.Completed;

            bool isFirstDiscovery = false;
            DexManager.Instance?.RecordDiscovery(resultPlant, _activeParams, out isFirstDiscovery);

            var refund = ResourceManager.Instance.RefundResources(status, _activeExperimentCost, 1f);
            var bonus = ResourceManager.Instance.GrantDiscoveryBonus(resultPlant, isFirstDiscovery);

            int totalSpent = ResourceManager.Instance.GetTotalCostValue(_activeExperimentCost);
            int totalRefund = ResourceManager.Instance.GetTotalCostValue(refund) + ResourceManager.Instance.GetTotalCostValue(bonus);

            string notes = isFirstDiscovery ? "首次发现！" : "";
            ExperimentLogManager.Instance?.AddLog(_activeParams, resultPlant, status,
                isFirstDiscovery, totalSpent, totalRefund, notes);

            if (QuestManager.Instance != null)
            {
                QuestManager.Instance.NotifyExperimentCompleted(resultPlant, isFirstDiscovery, _activeParams);
                if (isFirstDiscovery) QuestManager.Instance.NotifyDexViewed(resultPlant.Id);
            }

            DailyChallengeManager.Instance?.NotifyExperimentCompleted(resultPlant, isFirstDiscovery);

            _experimentInProgress = false;
            ParameterPanel?.EndExperimentUI();

            if (resultPlant.Rarity >= Rarity.Rare)
            {
                string bonusStr = bonus.Credits > 0 || bonus.Seeds > 0 || bonus.Nutrients > 0
                    ? $" 奖励：种子+{bonus.Seeds} 营养+{bonus.Nutrients} 积分+{bonus.Credits}"
                    : "";
                ShowToast($"{RarityName(resultPlant.Rarity)}发现！{resultPlant.DisplayName}{bonusStr}",
                    resultPlant.Rarity == Rarity.Legendary ? ToastType.Success : ToastType.Normal);
            }
            else if (resultPlant.Rarity == Rarity.Failure)
            {
                ShowToast($"实验失败：{resultPlant.DisplayName}，已记录到图鉴！", ToastType.Warn);
            }

            UpdateHudAll();
        }

        private void HandlePlantDiscovered(string plantId, DexEntry entry)
        {
            var plant = PlantDatabase.GetPlant(plantId);
            if (plant != null && plant.Rarity == Rarity.Legendary)
            {
                ShowToast($"★★★ 传说发现：{plant.DisplayName}！★★★", ToastType.Success);
            }
        }

        private void HandleLoadRecipe(ExperimentParams parameters)
        {
            if (ParameterPanel == null) return;

            SetSliderValue(ParameterPanel.LightSlider, parameters.LightLevel);
            SetSliderValue(ParameterPanel.WaterSlider, parameters.WaterLevel);
            SetSliderValue(ParameterPanel.NitrogenSlider, parameters.SoilNitrogen);
            SetSliderValue(ParameterPanel.PhosphorusSlider, parameters.SoilPhosphorus);
            SetSliderValue(ParameterPanel.PotassiumSlider, parameters.SoilPotassium);
            SetSliderValue(ParameterPanel.TimeSlider, parameters.CultureTime);

            QuestManager.Instance?.NotifyRecipeLoadedFromDexOrLog();
            ShowToast("已载入配方参数！", ToastType.Normal);
        }

        private static void SetSliderValue(ParameterSlider slider, float value)
        {
            if (slider != null) slider.SetValue(value, true);
        }

        private void CheckShowTutorialHint()
        {
            if (HudQuestHintText == null || QuestManager.Instance == null) return;
            var current = QuestManager.Instance.GetCurrentTutorialQuest();
            if (current != null)
            {
                int nextObj = -1;
                for (int i = 0; i < current.Objectives.Count; i++)
                {
                    if (!current.Objectives[i].IsCompleted) { nextObj = i; break; }
                }
                if (nextObj >= 0)
                {
                    var obj = current.Objectives[nextObj];
                    HudQuestHintText.text = $"[教程 {current.OrderIndex}] {current.Title}: {obj.Description} ({obj.CurrentCount}/{obj.TargetCount})";
                }
            }
            else
            {
                HudQuestHintText.text = "所有教程任务已完成！继续探索新的突变体吧！";
            }
        }

        private void UpdateHudAll()
        {
            UpdateHudResources();
            UpdateHudDexProgress();
            CheckShowTutorialHint();
        }

        private void UpdateHudResources()
        {
            if (ResourceManager.Instance == null) return;
            if (HudSeedsText != null) HudSeedsText.text = $"种子: {ResourceManager.Instance.CurrentResources.Seeds}";
            if (HudNutrientsText != null) HudNutrientsText.text = $"营养: {ResourceManager.Instance.CurrentResources.Nutrients}";
            if (HudCreditsText != null) HudCreditsText.text = $"积分: {ResourceManager.Instance.CurrentResources.Credits}";
        }

        private void UpdateHudDexProgress()
        {
            if (DexManager.Instance != null && HudDexProgressText != null)
                HudDexProgressText.text = DexManager.Instance.GetDiscoveryProgressString();
        }

        public enum ToastType { Normal, Success, Warn, Error }

        public void ShowToast(string message, ToastType type = ToastType.Normal)
        {
            if (ToastRoot == null || ToastText == null)
            {
                Debug.Log($"[Toast:{type}] {message}");
                return;
            }
            StopAllCoroutines();
            ToastText.text = message;
            if (ToastBg != null)
            {
                ToastBg.color = type switch
                {
                    ToastType.Success => ToastSuccessColor,
                    ToastType.Warn => ToastWarnColor,
                    ToastType.Error => ToastErrorColor,
                    _ => ToastNormalColor
                };
            }
            ToastRoot.SetActive(true);
            StartCoroutine(ToastFadeRoutine());
        }

        private IEnumerator ToastFadeRoutine()
        {
            yield return new WaitForSeconds(ToastDuration);
            if (ToastRoot != null) ToastRoot.SetActive(false);
        }

        private static string RarityName(Rarity rarity)
        {
            return rarity switch
            {
                Rarity.Common => "普通",
                Rarity.Rare => "稀有",
                Rarity.Legendary => "★传说★",
                Rarity.Failure => "",
                _ => ""
            };
        }
    }
}
