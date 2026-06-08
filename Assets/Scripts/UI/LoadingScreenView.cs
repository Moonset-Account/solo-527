using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using DecorMatch3.Core;
using DecorMatch3.Audio;

namespace DecorMatch3.UI
{
    public class LoadingScreenView : UIViewBase
    {
        [Header("Loading Bar")]
        [SerializeField] private Image loadingBarFill;
        [SerializeField] private TextMeshProUGUI progressText;
        [SerializeField] private TextMeshProUGUI loadingTipText;

        [Header("Content")]
        [SerializeField] private TextMeshProUGUI titleText;
        [SerializeField] private Image logoImage;

        [Header("Tips")]
        [SerializeField] private string[] loadingTips = new string[]
        {
            "提示：连续消除可以触发连击，获得更高分数！",
            "提示：注意客户的配色偏好，评分会更高！",
            "提示：消除不同颜色的宝石可以获得对应的材料！",
            "提示：优先完成目标可以更快过关！",
            "提示：四星以上的家具品质更好，客户更喜欢！",
            "提示：合理使用预算，不要超出太多！"
        };

        private Coroutine _loadingCoroutine;

        protected override void Awake()
        {
            base.Awake();
            viewType = UIView.LoadingScreen;
        }

        public override void Initialize()
        {
            base.Initialize();
            if (SceneLoader.Instance != null)
            {
                SceneLoader.Instance.OnLoadProgress += HandleLoadProgress;
            }
        }

        public void StartLoading(string customTitle = null, string[] customTips = null)
        {
            Open();

            if (titleText != null && !string.IsNullOrEmpty(customTitle))
            {
                titleText.text = customTitle;
            }

            if (customTips != null && customTips.Length > 0)
            {
                loadingTips = customTips;
            }

            if (_loadingCoroutine != null)
            {
                StopCoroutine(_loadingCoroutine);
            }
            _loadingCoroutine = StartCoroutine(AnimateTips());
        }

        private IEnumerator AnimateTips()
        {
            int tipIndex = 0;
            while (true)
            {
                if (loadingTipText != null && loadingTips.Length > 0)
                {
                    float fadeTimer = 0f;
                    while (fadeTimer < 0.3f)
                    {
                        fadeTimer += Time.deltaTime;
                        loadingTipText.color = new Color(
                            loadingTipText.color.r,
                            loadingTipText.color.g,
                            loadingTipText.color.b,
                            1 - fadeTimer / 0.3f
                        );
                        yield return null;
                    }

                    loadingTipText.text = loadingTips[tipIndex % loadingTips.Length];
                    tipIndex++;

                    fadeTimer = 0f;
                    while (fadeTimer < 0.3f)
                    {
                        fadeTimer += Time.deltaTime;
                        loadingTipText.color = new Color(
                            loadingTipText.color.r,
                            loadingTipText.color.g,
                            loadingTipText.color.b,
                            fadeTimer / 0.3f
                        );
                        yield return null;
                    }
                }

                yield return new WaitForSeconds(2.5f);
            }
        }

        private void HandleLoadProgress(float progress)
        {
            UpdateProgress(progress);
        }

        public void UpdateProgress(float progress)
        {
            if (loadingBarFill != null)
            {
                loadingBarFill.fillAmount = Mathf.Clamp01(progress);
            }
            if (progressText != null)
            {
                progressText.text = $"{Mathf.RoundToInt(progress * 100)}%";
            }
        }

        public void FinishLoading()
        {
            UpdateProgress(1f);
            if (_loadingCoroutine != null)
            {
                StopCoroutine(_loadingCoroutine);
            }
            AudioManager.Instance?.PlaySFX(SFXType.Popup);
            Close();
        }

        private void OnDestroy()
        {
            if (SceneLoader.Instance != null)
            {
                SceneLoader.Instance.OnLoadProgress -= HandleLoadProgress;
            }
        }
    }
}
