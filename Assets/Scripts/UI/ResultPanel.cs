using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using SpaceCourier.Core;
using SpaceCourier.Data;
using SpaceCourier.DataModule;
using SpaceCourier.Gameplay;
using SpaceCourier.SaveSystem;

namespace SpaceCourier.UI
{
    public class ResultPanel : UIPanelBase
    {
        [Header("Result Header")]
        public TextMeshProUGUI resultTitleText;
        public TextMeshProUGUI resultReasonText;
        public Image resultIcon;
        public Color victoryColor = new Color(0.3f, 0.9f, 0.5f);
        public Color defeatColor = new Color(1f, 0.3f, 0.3f);

        [Header("Score Display")]
        public TextMeshProUGUI totalScoreText;
        public TextMeshProUGUI scoreRankText;
        public Image scoreRankIcon;

        [Header("Breakdown")]
        public Transform breakdownContainer;
        public GameObject breakdownItemPrefab;

        [Header("Statistics")]
        public TextMeshProUGUI deliveriesText;
        public TextMeshProUGUI failuresText;
        public TextMeshProUGUI turnsUsedText;
        public TextMeshProUGUI fuelUsedText;
        public TextMeshProUGUI eventsTriggeredText;
        public TextMeshProUGUI playTimeText;
        public TextMeshProUGUI criticalChoicesText;

        [Header("Buttons")]
        public Button retryButton;
        public Button returnToMenuButton;
        public Button saveRecordButton;

        [Header("Stars Display")]
        public Image[] starRatingIcons;
        public Color starFilledColor = new Color(1f, 0.85f, 0.2f);
        public Color starEmptyColor = new Color(0.3f, 0.3f, 0.3f, 0.5f);

        public event Action OnRetryClicked;
        public event Action OnReturnToMenuClicked;

        private PlayRecorder playRecorder;
        private DataManager dataManager;
        private TurnManager turnManager;

        protected override void Awake()
        {
            base.Awake();
            if (retryButton != null) retryButton.onClick.AddListener(OnRetry);
            if (returnToMenuButton != null) returnToMenuButton.onClick.AddListener(OnReturnToMenu);
            if (saveRecordButton != null) saveRecordButton.onClick.AddListener(OnSaveRecord);
        }

        protected override void OnOpened()
        {
            base.OnOpened();
            dataManager = GameManager.Instance?.GetModule<DataManager>(ModuleType.DataManager);
            turnManager = GameManager.Instance?.GetModule<TurnManager>(ModuleType.TurnManager);
            playRecorder = GameManager.Instance?.GetModule<PlayRecorder>(ModuleType.PlayRecorder);
        }

        public void DisplayResult(bool isVictory, string reason, int score)
        {
            ConfigureHeader(isVictory, reason);
            ConfigureScore(isVictory, score);
            PopulateBreakdown(isVictory, score);
            PopulateStatistics();
            ConfigureStars(isVictory, score);
        }

        private void ConfigureHeader(bool isVictory, string reason)
        {
            if (resultTitleText != null)
            {
                resultTitleText.text = isVictory ? "🎉 任务成功！" : "💔 任务失败";
                resultTitleText.color = isVictory ? victoryColor : defeatColor;
            }
            if (resultReasonText != null)
            {
                resultReasonText.text = reason;
            }
            if (resultIcon != null)
            {
                resultIcon.color = isVictory ? victoryColor : defeatColor;
            }
        }

        private void ConfigureScore(bool isVictory, int score)
        {
            if (totalScoreText != null)
            {
                totalScoreText.text = $"{score:N0}";
            }

            string rank = "D";
            if (isVictory)
            {
                if (score >= 5000) rank = "S";
                else if (score >= 3500) rank = "A";
                else if (score >= 2500) rank = "B";
                else if (score >= 1500) rank = "C";
            }
            else
            {
                if (score >= 2000) rank = "C";
            }

            if (scoreRankText != null)
            {
                scoreRankText.text = rank;
                scoreRankText.color = GetRankColor(rank);
            }
            if (scoreRankIcon != null)
            {
                scoreRankIcon.color = GetRankColor(rank);
            }
        }

        private Color GetRankColor(string rank)
        {
            switch (rank)
            {
                case "S": return new Color(1f, 0.3f, 0.5f);
                case "A": return new Color(1f, 0.6f, 0.2f);
                case "B": return new Color(1f, 0.85f, 0.2f);
                case "C": return new Color(0.5f, 0.8f, 1f);
                default: return Color.gray;
            }
        }

        private void PopulateBreakdown(bool isVictory, int totalScore)
        {
            if (breakdownContainer == null || dataManager?.RuntimeData == null) return;

            foreach (Transform child in breakdownContainer)
            {
                if (child != null && child.gameObject != null) Destroy(child.gameObject);
            }

            var runtime = dataManager.RuntimeData;

            AddBreakdownItem("星币收益", runtime.Player.Credits, runtime.Player.Credits);
            AddBreakdownItem("声望价值", runtime.Player.Reputation * 15, runtime.Player.Reputation);
            if (turnManager != null)
            {
                AddBreakdownItem("剩余回合奖励", turnManager.TurnsRemaining * 50, turnManager.TurnsRemaining);
            }
            AddBreakdownItem("合同完成", runtime.TotalScore - runtime.Player.Credits, runtime.TotalScore);
            if (isVictory) AddBreakdownItem("主线完成奖励", 1000, 1);

            AddBreakdownItem("最终得分", totalScore, 1, true);
        }

        private void AddBreakdownItem(string label, int value, int rawValue, bool isTotal = false)
        {
            if (breakdownContainer == null || breakdownItemPrefab == null) return;

            var item = Instantiate(breakdownItemPrefab, breakdownContainer);
            var texts = item.GetComponentsInChildren<TextMeshProUGUI>();
            if (texts.Length >= 2)
            {
                texts[0].text = label;
                texts[1].text = value > 0 ? $"+{value:N0}" : $"{value:N0}";
                if (isTotal)
                {
                    texts[0].fontStyle = FontStyles.Bold;
                    texts[1].fontStyle = FontStyles.Bold;
                    texts[1].color = victoryColor;
                }
            }
        }

        private void PopulateStatistics()
        {
            if (dataManager?.RuntimeData == null) return;
            var runtime = dataManager.RuntimeData;

            if (deliveriesText != null)
                deliveriesText.text = runtime.Player.TotalDeliveries.ToString();
            if (failuresText != null)
                failuresText.text = runtime.Player.FailedDeliveries.ToString();
            if (turnsUsedText != null && turnManager != null)
                turnsUsedText.text = $"{turnManager.CurrentTurn} / {turnManager.MaxTurns}";
            if (fuelUsedText != null)
                fuelUsedText.text = runtime.Ship.MaxFuel - runtime.Ship.CurrentFuel >= 0
                    ? (runtime.Ship.MaxFuel - runtime.Ship.CurrentFuel).ToString()
                    : runtime.Ship.MaxFuel.ToString();
            if (eventsTriggeredText != null)
                eventsTriggeredText.text = runtime.EventHistory.Count.ToString();
            if (criticalChoicesText != null)
                criticalChoicesText.text = runtime.CriticalChoices.Count.ToString();
            if (playTimeText != null && playRecorder != null)
                playTimeText.text = playRecorder.FormatPlayTime();
        }

        private void ConfigureStars(bool isVictory, int score)
        {
            if (starRatingIcons == null) return;

            int stars = 0;
            if (isVictory)
            {
                if (score >= 5000) stars = 3;
                else if (score >= 3000) stars = 2;
                else stars = 1;
            }
            else
            {
                if (score >= 2500) stars = 1;
            }

            for (int i = 0; i < starRatingIcons.Length; i++)
            {
                if (starRatingIcons[i] == null) continue;
                starRatingIcons[i].color = i < stars ? starFilledColor : starEmptyColor;

                if (Application.isPlaying)
                {
                    int index = i;
                    StartCoroutine(AnimateStarCoroutine(index, index < stars, 0.15f * i));
                }
            }
        }

        private System.Collections.IEnumerator AnimateStarCoroutine(int index, bool filled, float delay)
        {
            yield return new WaitForSecondsRealtime(delay);
            if (starRatingIcons == null || index >= starRatingIcons.Length || starRatingIcons[index] == null) yield break;

            var rect = starRatingIcons[index].GetComponent<RectTransform>();
            if (rect == null) yield break;

            float elapsed = 0f;
            float duration = 0.25f;
            Vector3 start = Vector3.zero;
            Vector3 target = Vector3.one;

            if (filled)
            {
                start = new Vector3(0.2f, 0.2f, 1f);
                while (elapsed < duration)
                {
                    elapsed += Time.unscaledDeltaTime;
                    float t = elapsed / duration;
                    t = 1f - Mathf.Pow(1f - t, 3f);
                    rect.localScale = Vector3.Lerp(start, target, t);
                    yield return null;
                }
            }
            rect.localScale = target;
        }

        private void OnRetry()
        {
            OnRetryClicked?.Invoke();
            PlayClick();
        }

        private void OnReturnToMenu()
        {
            OnReturnToMenuClicked?.Invoke();
            PlayClick();
        }

        private void OnSaveRecord()
        {
            if (playRecorder != null)
            {
                playRecorder.SavePlayRecord();
                if (notificationToast != null)
                {
                    notificationToast.Show("试玩记录已保存！", true);
                }
            }
            PlayClick();
        }

        public NotificationToast notificationToast;

        private void PlayClick()
        {
            var audioManager = GameManager.Instance?.GetModule<Audio.AudioManager>(ModuleType.AudioManager);
            audioManager?.PlaySfx(Audio.SfxType.UI_ButtonClick);
        }

        protected override void OnDestroy()
        {
            base.OnDestroy();
            if (retryButton != null) retryButton.onClick.RemoveListener(OnRetry);
            if (returnToMenuButton != null) returnToMenuButton.onClick.RemoveListener(OnReturnToMenu);
            if (saveRecordButton != null) saveRecordButton.onClick.RemoveListener(OnSaveRecord);
        }
    }
}
