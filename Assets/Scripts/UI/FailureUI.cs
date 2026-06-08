using UnityEngine;
using UnityEngine.UI;

public class FailureUI : MonoBehaviour
{
    public TMPro.TextMeshProUGUI failureReasonText;
    public Button retryButton;
    public Button menuButton;

    private void OnEnable()
    {
        retryButton.onClick.AddListener(OnRetryClicked);
        menuButton.onClick.AddListener(OnMenuClicked);

        int failedCount = OrderManager.Instance != null ? OrderManager.Instance.failedOrders.Count : 0;
        float timeRemaining = 0f;
        if (LevelManager.Instance != null && LevelManager.Instance.levelTimer != null)
            timeRemaining = LevelManager.Instance.levelTimer.RemainingTime;

        if (timeRemaining <= 0f)
            failureReasonText.text = "Time's Up!";
        else if (failedCount > 0)
            failureReasonText.text = "Too Many Failed Orders!";
        else
            failureReasonText.text = "Level Failed!";
    }

    private void OnDisable()
    {
        retryButton.onClick.RemoveListener(OnRetryClicked);
        menuButton.onClick.RemoveListener(OnMenuClicked);
    }

    private void OnRetryClicked()
    {
        GameManager.Instance.StartLevel(GameManager.Instance.CurrentLevelIndex);
    }

    private void OnMenuClicked()
    {
        GameManager.Instance.ReturnToMenu();
    }
}
