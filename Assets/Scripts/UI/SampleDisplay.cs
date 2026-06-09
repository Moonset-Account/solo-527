using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace PixelPlantLab
{
    public class SampleDisplay : MonoBehaviour
    {
        [Header("状态文本")]
        public Text StatusTitleText;
        public Text StatusDetailText;
        public Text TimerText;
        public Text ProgressText;

        [Header("进度条")]
        public Slider ProgressBar;

        [Header("结果显示")]
        public Image ResultPlantImage;
        public Text ResultPlantNameText;
        public Text ResultPlantDescText;
        public Text ResultRarityText;
        public Text ResultTraitsText;
        public GameObject ResultPanel;
        public GameObject SampleIconRoot;
        public ParticleSystem SparkleParticles;
        public ParticleSystem FailParticles;

        [Header("动画参数")]
        public float GrowthAnimationSpeed = 1f;

        public ExperimentStatus CurrentStatus { get; private set; } = ExperimentStatus.Idle;
        public PlantMutation CurrentResult { get; private set; }
        public ExperimentParams CurrentExperimentParams { get; private set; }

        private Coroutine _experimentCoroutine;
        private float _elapsedTime;
        private float _totalTime;

        public event Action<PlantMutation> OnExperimentCompleted;

        public void StartExperiment(ExperimentParams parameters, float realTimeSeconds = 10f)
        {
            if (_experimentCoroutine != null) StopCoroutine(_experimentCoroutine);

            CurrentExperimentParams = parameters;
            CurrentStatus = ExperimentStatus.Running;
            CurrentResult = null;
            _elapsedTime = 0f;
            _totalTime = Mathf.Max(3f, realTimeSeconds * Mathf.Lerp(0.5f, 1.5f, parameters.CultureTime));

            UpdateStatusUI();
            if (ResultPanel != null) ResultPanel.SetActive(false);
            if (SampleIconRoot != null) SampleIconRoot.SetActive(true);

            _experimentCoroutine = StartCoroutine(ExperimentCoroutine());
        }

        public void AbortExperiment()
        {
            if (CurrentStatus != ExperimentStatus.Running) return;
            if (_experimentCoroutine != null) StopCoroutine(_experimentCoroutine);

            CurrentStatus = ExperimentStatus.Aborted;
            UpdateStatusUI();
        }

        private IEnumerator ExperimentCoroutine()
        {
            while (_elapsedTime < _totalTime)
            {
                _elapsedTime += Time.deltaTime * GrowthAnimationSpeed;
                float progress = Mathf.Clamp01(_elapsedTime / _totalTime);

                if (ProgressBar != null) ProgressBar.value = progress;
                if (ProgressText != null) ProgressText.text = $"{(progress * 100f):F0}%";
                if (TimerText != null)
                {
                    float remaining = Mathf.Max(0f, _totalTime - _elapsedTime);
                    TimerText.text = $"剩余时间: {remaining:F1}s";
                }

                UpdateGrowthStageVisuals(progress);

                yield return null;
            }

            CompleteExperiment();
        }

        private void UpdateGrowthStageVisuals(float progress)
        {
            if (SampleIconRoot == null) return;

            float scale = Mathf.Lerp(0.5f, 1f, progress);
            SampleIconRoot.transform.localScale = new Vector3(scale, scale, 1f);

            if (CurrentExperimentParams != null)
            {
                float wobble = Mathf.Sin(Time.time * 3f) * 0.02f;
                SampleIconRoot.transform.Rotate(0f, 0f, wobble);
            }
        }

        private void CompleteExperiment()
        {
            var rng = new System.Random(Guid.NewGuid().GetHashCode());
            var result = MutationEngine.GenerateMutation(CurrentExperimentParams, rng);

            CurrentResult = result.Plant;
            CurrentStatus = result.Plant.Rarity == Rarity.Failure ? ExperimentStatus.Failed : ExperimentStatus.Completed;

            ShowResult(result);

            OnExperimentCompleted?.Invoke(CurrentResult);
        }

        private void ShowResult(MutationEngine.MutationResult result)
        {
            if (ResultPanel != null) ResultPanel.SetActive(true);
            if (SampleIconRoot != null) SampleIconRoot.SetActive(false);

            if (ResultPlantNameText != null)
            {
                ResultPlantNameText.text = ColorByRarity(result.Plant.DisplayName, result.Plant.Rarity);
            }
            if (ResultPlantDescText != null)
                ResultPlantDescText.text = result.Plant.Description;
            if (ResultRarityText != null)
            {
                string rarityStr = result.Plant.Rarity switch
                {
                    Rarity.Failure => "失败样本",
                    Rarity.Common => "普通",
                    Rarity.Rare => "稀有",
                    Rarity.Legendary => "传说",
                    _ => ""
                };
                ResultRarityText.text = ColorByRarity($"[{rarityStr}] 匹配度: {(result.MatchScore * 100f):F0}%", result.Plant.Rarity);
            }
            if (ResultTraitsText != null)
                ResultTraitsText.text = FormatTraits(result.Plant.Traits);

            if (SparkleParticles != null && result.Plant.Rarity >= Rarity.Rare)
                SparkleParticles.Play();
            if (FailParticles != null && result.Plant.Rarity == Rarity.Failure)
                FailParticles.Play();

            UpdateStatusUI();
        }

        private void UpdateStatusUI()
        {
            if (StatusTitleText == null) return;

            string title = CurrentStatus switch
            {
                ExperimentStatus.Idle => "等待开始实验",
                ExperimentStatus.Running => "实验进行中...",
                ExperimentStatus.Completed => "实验成功！",
                ExperimentStatus.Aborted => "实验已终止",
                ExperimentStatus.Failed => "实验失败",
                _ => ""
            };
            StatusTitleText.text = title;

            if (StatusDetailText != null)
            {
                string detail = CurrentStatus switch
                {
                    ExperimentStatus.Idle => "调整参数后点击开始实验",
                    ExperimentStatus.Running => "请耐心等待培养完成",
                    ExperimentStatus.Completed => $"获得了 {CurrentResult?.DisplayName ?? "未知植物"}！",
                    ExperimentStatus.Aborted => "实验已提前终止，只返还了部分资源",
                    ExperimentStatus.Failed => $"失败：{CurrentResult?.DisplayName ?? "未知原因"}，已记录到图鉴",
                    _ => ""
                };
                StatusDetailText.text = detail;
            }
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

        private static string FormatTraits(MutationTrait traits)
        {
            if (traits == MutationTrait.None) return "特征: 无特殊特征";
            var parts = new System.Collections.Generic.List<string>();
            foreach (MutationTrait t in Enum.GetValues(typeof(MutationTrait)))
            {
                if (t != MutationTrait.None && (traits & t) != 0)
                    parts.Add(TraitDisplayName(t));
            }
            return "特征: " + string.Join(", ", parts);
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
    }
}
