using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using DecorMatch3.Core;
using DecorMatch3.Data;
using DecorMatch3.Audio;

namespace DecorMatch3.UI
{
    public class LevelFailedView : UIViewBase
    {
        [Header("Info")]
        [SerializeField] private TextMeshProUGUI reasonText;
        [SerializeField] private TextMeshProUGUI scoreText;
        [SerializeField] private TextMeshProUGUI targetScoreText;
        [SerializeField] private TextMeshProUGUI objectivesFailedText;

        [Header("Buttons")]
        [SerializeField] private Button retryButton;
        [SerializeField] private Button useBoostButton;
        [SerializeField] private Button mainMenuButton;

        [Header("Fail Animation")]
        [SerializeField] private RectTransform failIconTransform;
        [SerializeField] private CanvasGroup shakeCanvasGroup;

        private LevelFailedEvent _lastEvent;

        protected override void Awake()
        {
            base.Awake();
            viewType = UIView.LevelFailed;
        }

        public override void Initialize()
        {
            base.Initialize();

            if (retryButton != null)
                retryButton.onClick.AddListener(OnRetryClicked);
            if (useBoostButton != null)
                useBoostButton.onClick.AddListener(OnUseBoostClicked);
            if (mainMenuButton != null)
                mainMenuButton.onClick.AddListener(OnMainMenuClicked);

            EventBus.Subscribe<LevelFailedEvent>(OnLevelFailed);
        }

        private void OnLevelFailed(LevelFailedEvent e)
        {
            _lastEvent = e;
            UpdateDisplay(e);
            UIManager.Instance.OpenView(UIView.LevelFailed, true, false);
            StartCoroutine(PlayFailAnimation());
        }

        private void UpdateDisplay(LevelFailedEvent e)
        {
            if (reasonText != null)
                reasonText.text = e.Reason;
            if (scoreText != null)
                scoreText.text = e.FinalScore.ToString();
            if (targetScoreText != null)
                targetScoreText.text = $"目标: {e.LevelData.TargetScore}";

            if (objectivesFailedText != null)
            {
                int failedCount = 0;
                foreach (var obj in e.LevelData.Objectives)
                {
                    if (obj.CurrentCount < obj.RequiredCount)
                        failedCount++;
                }
                objectivesFailedText.text = failedCount > 0
                    ? $"还有 {failedCount} 个目标未完成"
                    : "目标已完成但分数不足";
            }
        }

        private IEnumerator PlayFailAnimation()
        {
            if (shakeCanvasGroup != null)
            {
                shakeCanvasGroup.alpha = 0;
            }

            yield return new WaitForSeconds(0.1f);

            float timer = 0f;
            while (timer < 0.4f)
            {
                timer += Time.deltaTime;
                if (shakeCanvasGroup != null)
                {
                    shakeCanvasGroup.alpha = Mathf.Clamp01(timer / 0.2f);
                    shakeCanvasGroup.transform.localPosition = new Vector3(
                        Mathf.Sin(timer * 60f) * (1 - timer / 0.4f) * 15f,
                        0, 0
                    );
                }
                yield return null;
            }

            if (shakeCanvasGroup != null)
            {
                shakeCanvasGroup.transform.localPosition = Vector3.zero;
            }
        }

        private void OnRetryClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            Close();
            Gameplay.Match3.Match3GameManager.Instance.RestartLevel();
        }

        private void OnUseBoostClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            Gameplay.Match3.Match3GameManager.Instance.AddBonusMoves(10);
            Close();
            GameStateManager.Instance.ChangeState(GameState.PlayingMatch3);
        }

        private void OnMainMenuClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            Close();
            Gameplay.Match3.Match3GameManager.Instance.ExitToMainMenu();
        }

        private void OnDestroy()
        {
            if (retryButton != null)
                retryButton.onClick.RemoveListener(OnRetryClicked);
            if (useBoostButton != null)
                useBoostButton.onClick.RemoveListener(OnUseBoostClicked);
            if (mainMenuButton != null)
                mainMenuButton.onClick.RemoveListener(OnMainMenuClicked);
            EventBus.Unsubscribe<LevelFailedEvent>(OnLevelFailed);
        }
    }
}
