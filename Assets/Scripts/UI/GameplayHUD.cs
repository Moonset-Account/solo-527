using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class GameplayHUD : MonoBehaviour
{
    public TMPro.TextMeshProUGUI scoreText;
    public TMPro.TextMeshProUGUI timerText;
    public TMPro.TextMeshProUGUI comboText;
    public Transform orderQueueContainer;
    public GameObject orderItemPrefab;

    private List<GameObject> orderItems = new List<GameObject>();

    private void OnEnable()
    {
        if (ScoringManager.Instance != null)
        {
            ScoringManager.Instance.OnScoreChanged += OnScoreChanged;
            ScoringManager.Instance.OnComboChanged += OnComboChanged;
        }

        EventBus.Subscribe<GameEvents.OrderSpawnedEvent>(OnOrderSpawned);
        EventBus.Subscribe<GameEvents.OrderCompletedEvent>(OnOrderCompleted);
        EventBus.Subscribe<GameEvents.OrderFailedEvent>(OnOrderFailed);
    }

    private void OnDisable()
    {
        if (ScoringManager.Instance != null)
        {
            ScoringManager.Instance.OnScoreChanged -= OnScoreChanged;
            ScoringManager.Instance.OnComboChanged -= OnComboChanged;
        }

        EventBus.Unsubscribe<GameEvents.OrderSpawnedEvent>(OnOrderSpawned);
        EventBus.Unsubscribe<GameEvents.OrderCompletedEvent>(OnOrderCompleted);
        EventBus.Unsubscribe<GameEvents.OrderFailedEvent>(OnOrderFailed);
    }

    private void Update()
    {
        UpdateTimer();
        UpdateOrderUrgency();
    }

    private void UpdateTimer()
    {
        if (LevelManager.Instance == null || LevelManager.Instance.levelTimer == null) return;

        float remaining = LevelManager.Instance.levelTimer.RemainingTime;
        int minutes = Mathf.FloorToInt(remaining / 60f);
        int seconds = Mathf.FloorToInt(remaining % 60f);
        timerText.text = $"{minutes}:{seconds:D2}";

        timerText.color = remaining < 30f ? Color.red : Color.white;
    }

    private void UpdateOrderUrgency()
    {
        if (OrderManager.Instance == null) return;

        for (int i = 0; i < orderItems.Count && i < OrderManager.Instance.activeOrders.Count; i++)
        {
            Order order = OrderManager.Instance.activeOrders[i];
            float urgency = order.Urgency;

            var text = orderItems[i].GetComponent<TMPro.TextMeshProUGUI>();
            if (text != null)
            {
                if (urgency > 0.6f)
                    text.color = Color.green;
                else if (urgency > 0.3f)
                    text.color = Color.yellow;
                else
                    text.color = Color.red;
            }
        }
    }

    private void OnScoreChanged(int score)
    {
        scoreText.text = score.ToString();
    }

    private void OnComboChanged(int combo)
    {
        comboText.text = combo > 1 ? $"x{combo}" : "";
        comboText.gameObject.SetActive(combo > 1);

        if (combo > 1)
        {
            StopAllCoroutines();
            StartCoroutine(ComboPulseRoutine());
        }
    }

    private System.Collections.IEnumerator ComboPulseRoutine()
    {
        float duration = 0.3f;
        float elapsed = 0f;
        Vector3 originalScale = comboText.transform.localScale;
        Vector3 targetScale = originalScale * 1.5f;

        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            float t = elapsed / duration;
            comboText.transform.localScale = Vector3.Lerp(targetScale, originalScale, t);
            yield return null;
        }

        comboText.transform.localScale = originalScale;
    }

    private void OnOrderSpawned(GameEvents.OrderSpawnedEvent evt)
    {
        if (orderItemPrefab == null || orderQueueContainer == null) return;

        GameObject item = Instantiate(orderItemPrefab, orderQueueContainer);
        var text = item.GetComponent<TMPro.TextMeshProUGUI>();
        if (text != null && evt.Order.recipe != null)
            text.text = evt.Order.recipe.recipeName;

        orderItems.Add(item);
    }

    private void OnOrderCompleted(GameEvents.OrderCompletedEvent evt)
    {
        RemoveOrderItem(evt.Order);
    }

    private void OnOrderFailed(GameEvents.OrderFailedEvent evt)
    {
        RemoveOrderItem(evt.Order);
    }

    private void RemoveOrderItem(Order order)
    {
        int index = -1;
        if (OrderManager.Instance != null)
        {
            for (int i = 0; i < orderItems.Count; i++)
            {
                if (i < OrderManager.Instance.activeOrders.Count &&
                    OrderManager.Instance.activeOrders[i].orderID == order.orderID)
                {
                    index = i;
                    break;
                }
            }
        }

        if (index >= 0 && index < orderItems.Count)
        {
            Destroy(orderItems[index]);
            orderItems.RemoveAt(index);
        }
    }
}
