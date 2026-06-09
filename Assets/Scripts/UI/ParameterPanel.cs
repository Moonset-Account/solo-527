using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace PixelPlantLab
{
    public class ParameterPanel : MonoBehaviour
    {
        [Header("滑杆引用")]
        public ParameterSlider LightSlider;
        public ParameterSlider WaterSlider;
        public ParameterSlider NitrogenSlider;
        public ParameterSlider PhosphorusSlider;
        public ParameterSlider PotassiumSlider;
        public ParameterSlider TimeSlider;

        [Header("UI按钮")]
        public Button StartExperimentButton;
        public Button AbortExperimentButton;
        public Button RandomizeButton;
        public Button ResetButton;

        [Header("预计风险显示")]
        public Text FailureRiskText;
        public Text RareChanceText;
        public Text RecipeRunCountText;

        [Header("配方历史概率显示")]
        public RectTransform ProbabilityPanel;
        public GameObject ProbabilityItemPrefab;

        public ExperimentParams CurrentParams { get; private set; } = new ExperimentParams();
        public event Action<ExperimentParams> OnStartExperiment;
        public event Action OnAbortExperiment;

        private bool _isExperimentRunning;
        private readonly List<GameObject> _probabilityItems = new List<GameObject>();

        private void Start()
        {
            RegisterSliderEvents();
            RegisterButtonEvents();
            UpdateCurrentParams();
            RecalculateStats();
        }

        private void RegisterSliderEvents()
        {
            if (LightSlider != null) LightSlider.OnValueChangedEvent += _ => { UpdateCurrentParams(); RecalculateStats(); };
            if (WaterSlider != null) WaterSlider.OnValueChangedEvent += _ => { UpdateCurrentParams(); RecalculateStats(); };
            if (NitrogenSlider != null) NitrogenSlider.OnValueChangedEvent += _ => { UpdateCurrentParams(); RecalculateStats(); };
            if (PhosphorusSlider != null) PhosphorusSlider.OnValueChangedEvent += _ => { UpdateCurrentParams(); RecalculateStats(); };
            if (PotassiumSlider != null) PotassiumSlider.OnValueChangedEvent += _ => { UpdateCurrentParams(); RecalculateStats(); };
            if (TimeSlider != null) TimeSlider.OnValueChangedEvent += _ => { UpdateCurrentParams(); RecalculateStats(); };
        }

        private void RegisterButtonEvents()
        {
            if (StartExperimentButton != null)
                StartExperimentButton.onClick.AddListener(HandleStart);
            if (AbortExperimentButton != null)
                AbortExperimentButton.onClick.AddListener(HandleAbort);
            if (RandomizeButton != null)
                RandomizeButton.onClick.AddListener(HandleRandomize);
            if (ResetButton != null)
                ResetButton.onClick.AddListener(HandleReset);
        }

        private void UpdateCurrentParams()
        {
            if (CurrentParams == null) CurrentParams = new ExperimentParams();
            CurrentParams.LightLevel = LightSlider != null ? LightSlider.CurrentValue : 0.5f;
            CurrentParams.WaterLevel = WaterSlider != null ? WaterSlider.CurrentValue : 0.5f;
            CurrentParams.SoilNitrogen = NitrogenSlider != null ? NitrogenSlider.CurrentValue : 0.5f;
            CurrentParams.SoilPhosphorus = PhosphorusSlider != null ? PhosphorusSlider.CurrentValue : 0.5f;
            CurrentParams.SoilPotassium = PotassiumSlider != null ? PotassiumSlider.CurrentValue : 0.5f;
            CurrentParams.CultureTime = TimeSlider != null ? TimeSlider.CurrentValue : 0.5f;
        }

        private void RecalculateStats()
        {
            if (_isExperimentRunning) return;

            float failureThresh = EstimateFailureThreshold(CurrentParams);
            float rareBoost = EstimateRareBoost(CurrentParams);
            float rareChance = (1f - failureThresh) * (0.15f + rareBoost);

            if (FailureRiskText != null)
                FailureRiskText.text = $"失败风险: {(failureThresh * 100f):F0}%";
            if (RareChanceText != null)
                RareChanceText.text = $"稀有几率: {(rareChance * 100f):F1}%";

            UpdateRecipeHistoryDisplay();
        }

        private void UpdateRecipeHistoryDisplay()
        {
            var stats = MutationEngine.GetOrCreateStats(CurrentParams);
            if (RecipeRunCountText != null)
                RecipeRunCountText.text = $"同配方实验次数: {stats.TotalRuns}";

            ClearProbabilityItems();

            if (ProbabilityPanel == null || ProbabilityItemPrefab == null || stats.TotalRuns < 2)
                return;

            foreach (var kv in stats.OutcomeCounts)
            {
                var plant = PlantDatabase.GetPlant(kv.Key);
                if (plant == null) continue;

                var go = Instantiate(ProbabilityItemPrefab, ProbabilityPanel);
                _probabilityItems.Add(go);

                float prob = stats.GetOutcomeProbability(kv.Key);
                var texts = go.GetComponentsInChildren<Text>();
                foreach (var t in texts)
                {
                    if (t.name.Contains("Name")) t.text = $"{RarityColor(plant.Rarity)}{plant.DisplayName}</color>";
                    if (t.name.Contains("Prob")) t.text = $"{(prob * 100f):F1}% ({kv.Value}次)";
                }
            }
        }

        private void ClearProbabilityItems()
        {
            foreach (var go in _probabilityItems) if (go != null) Destroy(go);
            _probabilityItems.Clear();
        }

        private static string RarityColor(Rarity r)
        {
            switch (r)
            {
                case Rarity.Failure: return "<color=#888888>";
                case Rarity.Common: return "<color=#AAAAAA>";
                case Rarity.Rare: return "<color=#5599FF>";
                case Rarity.Legendary: return "<color=#FFCC33>";
                default: return "<color=#FFFFFF>";
            }
        }

        private void HandleStart()
        {
            if (_isExperimentRunning) return;
            _isExperimentRunning = true;
            SetInteractableSliders(false);
            if (StartExperimentButton != null) StartExperimentButton.gameObject.SetActive(false);
            if (AbortExperimentButton != null) AbortExperimentButton.gameObject.SetActive(true);
            OnStartExperiment?.Invoke(CurrentParams.Clone());
        }

        private void HandleAbort()
        {
            if (!_isExperimentRunning) return;
            OnAbortExperiment?.Invoke();
        }

        public void EndExperimentUI()
        {
            _isExperimentRunning = false;
            SetInteractableSliders(true);
            if (StartExperimentButton != null) StartExperimentButton.gameObject.SetActive(true);
            if (AbortExperimentButton != null) AbortExperimentButton.gameObject.SetActive(false);
            RecalculateStats();
        }

        private void HandleRandomize()
        {
            if (_isExperimentRunning) return;
            System.Random rng = new System.Random();
            SetSliderValue(LightSlider, (float)rng.NextDouble());
            SetSliderValue(WaterSlider, (float)rng.NextDouble());
            SetSliderValue(NitrogenSlider, (float)rng.NextDouble());
            SetSliderValue(PhosphorusSlider, (float)rng.NextDouble());
            SetSliderValue(PotassiumSlider, (float)rng.NextDouble());
            SetSliderValue(TimeSlider, (float)rng.NextDouble());
            UpdateCurrentParams();
            RecalculateStats();
        }

        private void HandleReset()
        {
            if (_isExperimentRunning) return;
            SetSliderValue(LightSlider, 0.5f);
            SetSliderValue(WaterSlider, 0.5f);
            SetSliderValue(NitrogenSlider, 0.33f);
            SetSliderValue(PhosphorusSlider, 0.33f);
            SetSliderValue(PotassiumSlider, 0.34f);
            SetSliderValue(TimeSlider, 0.5f);
            UpdateCurrentParams();
            RecalculateStats();
        }

        private static void SetSliderValue(ParameterSlider slider, float value)
        {
            if (slider != null) slider.SetValue(value);
        }

        private void SetInteractableSliders(bool interactable)
        {
            if (LightSlider?.SliderComponent != null) LightSlider.SliderComponent.interactable = interactable;
            if (WaterSlider?.SliderComponent != null) WaterSlider.SliderComponent.interactable = interactable;
            if (NitrogenSlider?.SliderComponent != null) NitrogenSlider.SliderComponent.interactable = interactable;
            if (PhosphorusSlider?.SliderComponent != null) PhosphorusSlider.SliderComponent.interactable = interactable;
            if (PotassiumSlider?.SliderComponent != null) PotassiumSlider.SliderComponent.interactable = interactable;
            if (TimeSlider?.SliderComponent != null) TimeSlider.SliderComponent.interactable = interactable;
            if (RandomizeButton != null) RandomizeButton.interactable = interactable;
            if (ResetButton != null) ResetButton.interactable = interactable;
        }

        private static float EstimateFailureThreshold(ExperimentParams p)
        {
            float threshold = 0.05f;
            if (p.LightLevel < 0.1f) threshold += 0.15f + (0.1f - p.LightLevel);
            if (p.LightLevel > 0.95f) threshold += 0.2f + (p.LightLevel - 0.95f);
            if (p.WaterLevel < 0.05f) threshold += 0.3f + (0.05f - p.WaterLevel) * 2f;
            if (p.WaterLevel > 0.95f) threshold += 0.25f + (p.WaterLevel - 0.95f) * 2f;
            float nutrientTotal = p.SoilNitrogen + p.SoilPhosphorus + p.SoilPotassium;
            if (nutrientTotal < 0.3f) threshold += 0.2f;
            if (nutrientTotal > 2.7f) threshold += 0.1f;
            if (p.SoilNitrogen > 0.9f || p.SoilPhosphorus > 0.9f || p.SoilPotassium > 0.9f) threshold += 0.1f;
            if (p.CultureTime < 0.2f) threshold += 0.15f;
            if (p.CultureTime > 0.98f) threshold += 0.05f;
            return Mathf.Clamp01(threshold);
        }

        private static float EstimateRareBoost(ExperimentParams p)
        {
            float boost = 0f;
            float nutrientBalance = 1f - (Mathf.Abs(p.SoilNitrogen - p.SoilPhosphorus) +
                                          Mathf.Abs(p.SoilPhosphorus - p.SoilPotassium) +
                                          Mathf.Abs(p.SoilPotassium - p.SoilNitrogen)) / 2f;
            boost += nutrientBalance * 0.2f;
            if (p.LightLevel > 0.4f && p.LightLevel < 0.7f) boost += 0.05f;
            if (p.WaterLevel > 0.3f && p.WaterLevel < 0.7f) boost += 0.05f;
            if (p.CultureTime > 0.5f) boost += Mathf.Min(p.CultureTime, 1f) * 0.05f;
            return boost;
        }
    }
}
