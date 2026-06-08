using System;
using System.Collections.Generic;
using Kitchen.Core;
using Kitchen.Gameplay;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Kitchen.UI
{
    public class HUDController : MonoBehaviour
    {
        [Header("Top Bar")]
        public TextMeshProUGUI timerText;
        public TextMeshProUGUI scoreText;
        public TextMeshProUGUI multiplierText;
        public Image timerFillImage;
        public Image comboIndicator;

        [Header("Orders Panel")]
        public Transform ordersContainer;
        public GameObject orderCardPrefab;

        [Header("Player HUD")]
        public Transform playerIndicatorsContainer;
        public GameObject playerIndicatorPrefab;
        public TextMeshProUGUI activePlayerText;

        [Header("Messages")]
        public TextMeshProUGUI gameMessageText;
        public float messageFadeTime = 2f;

        [Header("Countdown")]
        public GameObject countdownPanel;
        public TextMeshProUGUI countdownText;

        private Dictionary<int, GameObject> playerIndicators = new Dictionary<int, GameObject>();
        private Dictionary<int, GameObject> orderCards = new Dictionary<int, GameObject>();
        private float messageTimer;

        private void OnEnable()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnTimerTick += HandleTimerTick;
                GameManager.Instance.OnScoreChanged += HandleScoreChanged;
                GameManager.Instance.OnStateChanged += HandleStateChanged;
                GameManager.Instance.OnGameMessage += HandleGameMessage;
            }
            if (OrderManager.Instance != null)
            {
                OrderManager.Instance.OnOrderAdded += HandleOrderAdded;
                OrderManager.Instance.OnOrderRemoved += HandleOrderRemoved;
                OrderManager.Instance.OnOrderFailed += HandleOrderFailed;
            }
        }

        private void OnDisable()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnTimerTick -= HandleTimerTick;
                GameManager.Instance.OnScoreChanged -= HandleScoreChanged;
                GameManager.Instance.OnStateChanged -= HandleStateChanged;
                GameManager.Instance.OnGameMessage -= HandleGameMessage;
            }
            if (OrderManager.Instance != null)
            {
                OrderManager.Instance.OnOrderAdded -= HandleOrderAdded;
                OrderManager.Instance.OnOrderRemoved -= HandleOrderRemoved;
                OrderManager.Instance.OnOrderFailed -= HandleOrderFailed;
            }
        }

        private void Update()
        {
            if (messageTimer > 0)
            {
                messageTimer -= Time.deltaTime;
                if (gameMessageText != null)
                {
                    float a = Mathf.Clamp01(messageTimer / messageFadeTime);
                    Color c = gameMessageText.color;
                    c.a = a;
                    gameMessageText.color = c;
                }
            }
            UpdatePlayerIndicators();
            UpdateOrderCards();
        }

        private void HandleTimerTick(float remaining)
        {
            if (timerText != null)
            {
                TimeSpan t = TimeSpan.FromSeconds(Mathf.Max(0, remaining));
                timerText.text = $"{t.Minutes:00}:{t.Seconds:00}";
            }
            if (timerFillImage != null && GameManager.Instance.currentLevelConfig != null)
            {
                float p = remaining / GameManager.Instance.currentLevelConfig.levelDurationSeconds;
                timerFillImage.fillAmount = Mathf.Clamp01(p);
                timerFillImage.color = p < 0.15f ? Color.red : p < 0.4f ? Color.yellow : Color.green;
            }
        }

        private void HandleScoreChanged(int newScore)
        {
            if (scoreText != null) scoreText.text = newScore.ToString("N0");
            if (multiplierText != null)
            {
                float mult = GameManager.Instance.ScoreMultiplier;
                multiplierText.text = mult > 1f ? $"x{mult:F1}" : "";
            }
            if (comboIndicator != null)
            {
                comboIndicator.enabled = GameManager.Instance.ScoreMultiplier > 1.2f;
            }
        }

        private void HandleStateChanged(GameManager.GameState oldS, GameManager.GameState newS)
        {
            if (newS == GameManager.GameState.Countdown)
            {
                StartCoroutine(CountdownRoutine(3));
            }
        }

        private System.Collections.IEnumerator CountdownRoutine(int from)
        {
            if (countdownPanel != null) countdownPanel.SetActive(true);
            for (int i = from; i > 0; i--)
            {
                if (countdownText != null) countdownText.text = i.ToString();
                yield return new WaitForSeconds(1f);
            }
            if (countdownText != null) countdownText.text = "开始！";
            yield return new WaitForSeconds(0.8f);
            if (countdownPanel != null) countdownPanel.SetActive(false);
            GameManager.Instance.StartCountdownComplete();
        }

        private void HandleGameMessage(string msg)
        {
            if (gameMessageText != null)
            {
                gameMessageText.text = msg;
                Color c = gameMessageText.color;
                c.a = 1f;
                gameMessageText.color = c;
                messageTimer = messageFadeTime;
            }
        }

        private void HandleOrderAdded(Order order)
        {
            if (ordersContainer == null || orderCardPrefab == null) return;
            GameObject card = Instantiate(orderCardPrefab, ordersContainer);
            orderCards[order.orderId] = card;
            RefreshOrderCard(order, card);
        }

        private void HandleOrderRemoved(Order order)
        {
            if (orderCards.TryGetValue(order.orderId, out var card))
            {
                Destroy(card);
                orderCards.Remove(order.orderId);
            }
        }

        private void HandleOrderFailed(Order order)
        {
        }

        private void UpdateOrderCards()
        {
            if (OrderManager.Instance == null) return;
            foreach (var order in OrderManager.Instance.ActiveOrders)
            {
                if (orderCards.TryGetValue(order.orderId, out var card))
                {
                    RefreshOrderCard(order, card);
                }
            }
        }

        private void RefreshOrderCard(Order order, GameObject card)
        {
            var nameTxt = card.transform.Find("RecipeName")?.GetComponent<TextMeshProUGUI>();
            var timerBar = card.transform.Find("TimerBar/Progress")?.GetComponent<Image>();
            var iconImg = card.transform.Find("Icon")?.GetComponent<Image>();

            if (nameTxt != null) nameTxt.text = order.recipe.displayName;
            if (order.recipe.icon != null && iconImg != null)
            {
                iconImg.sprite = order.recipe.icon;
                iconImg.enabled = true;
            }
            if (timerBar != null)
            {
                float p = order.timeRemaining / order.maxTime;
                timerBar.fillAmount = Mathf.Clamp01(p);
                timerBar.color = p < 0.25f ? Color.red : p < 0.5f ? Color.yellow : Color.green;
            }
        }

        private void UpdatePlayerIndicators()
        {
            if (PlayerManager.Instance == null) return;
            foreach (var pc in PlayerManager.Instance.Players)
            {
                if (!playerIndicators.ContainsKey(pc.PlayerId) && playerIndicatorPrefab != null && playerIndicatorsContainer != null)
                {
                    GameObject indicator = Instantiate(playerIndicatorPrefab, playerIndicatorsContainer);
                    playerIndicators[pc.PlayerId] = indicator;
                }
            }

            if (activePlayerText != null && GameManager.Instance?.IsSinglePlayerMode == true)
            {
                var active = PlayerManager.Instance.GetActivePlayer();
                if (active != null) activePlayerText.text = $"角色 P{active.PlayerId + 1}";
            }
        }
    }
}
