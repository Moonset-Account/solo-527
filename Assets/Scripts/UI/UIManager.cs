using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class UIManager : Singleton<UIManager>
{
    public Dictionary<GameState, GameObject> panels = new Dictionary<GameState, GameObject>();
    public GameObject currentPanel;
    public Canvas canvas;

    private GameObject toastPrefab;
    private GameObject confirmationPrefab;

    protected override void Awake()
    {
        base.Awake();
        if (GameManager.HasInstance)
            GameManager.Instance.OnGameStateChanged += OnGameStateChanged;
    }

    private void OnDestroy()
    {
        if (GameManager.HasInstance)
            GameManager.Instance.OnGameStateChanged -= OnGameStateChanged;
    }

    public void ShowPanel(GameState state)
    {
        HideCurrentPanel();

        if (panels.TryGetValue(state, out GameObject panel))
        {
            panel.SetActive(true);
            currentPanel = panel;
        }
    }

    public void HideCurrentPanel()
    {
        if (currentPanel != null)
        {
            currentPanel.SetActive(false);
            currentPanel = null;
        }
    }

    public void ShowPanelAsync(GameState state)
    {
        StartCoroutine(ShowPanelAsyncRoutine(state));
    }

    private IEnumerator ShowPanelAsyncRoutine(GameState state)
    {
        yield return null;
        ShowPanel(state);
    }

    public void ShowToast(string message, float duration = 2f)
    {
        StartCoroutine(ShowToastRoutine(message, duration));
    }

    private IEnumerator ShowToastRoutine(string message, float duration)
    {
        GameObject toastObj = new GameObject("Toast");
        toastObj.transform.SetParent(canvas.transform, false);

        RectTransform rect = toastObj.AddComponent<RectTransform>();
        rect.anchorMin = new Vector2(0.5f, 0.8f);
        rect.anchorMax = new Vector2(0.5f, 0.8f);
        rect.sizeDelta = new Vector2(400f, 60f);

        var text = toastObj.AddComponent<TMPro.TextMeshProUGUI>();
        text.text = message;
        text.alignment = TMPro.TextAlignmentOptions.Center;
        text.fontSize = 24f;

        yield return new WaitForSeconds(duration);

        Destroy(toastObj);
    }

    public void ShowConfirmation(string title, string message, Action onConfirm, Action onCancel)
    {
        GameObject confirmObj = new GameObject("ConfirmationDialog");
        confirmObj.transform.SetParent(canvas.transform, false);

        RectTransform rect = confirmObj.AddComponent<RectTransform>();
        rect.anchorMin = Vector2.zero;
        rect.anchorMax = Vector2.one;
        rect.offsetMin = Vector2.zero;
        rect.offsetMax = Vector2.zero;

        var titleText = new GameObject("Title");
        titleText.transform.SetParent(confirmObj.transform, false);
        var titleTMPro = titleText.AddComponent<TMPro.TextMeshProUGUI>();
        titleTMPro.text = title;
        titleTMPro.alignment = TMPro.TextAlignmentOptions.Center;
        titleTMPro.fontSize = 32f;

        var msgText = new GameObject("Message");
        msgText.transform.SetParent(confirmObj.transform, false);
        var msgTMPro = msgText.AddComponent<TMPro.TextMeshProUGUI>();
        msgTMPro.text = message;
        msgTMPro.alignment = TMPro.TextAlignmentOptions.Center;
        msgTMPro.fontSize = 20f;

        var confirmBtn = new GameObject("ConfirmButton");
        confirmBtn.transform.SetParent(confirmObj.transform, false);
        var confirmButton = confirmBtn.AddComponent<Button>();
        confirmButton.onClick.AddListener(() =>
        {
            onConfirm?.Invoke();
            Destroy(confirmObj);
        });

        var cancelBtn = new GameObject("CancelButton");
        cancelBtn.transform.SetParent(confirmObj.transform, false);
        var cancelButton = cancelBtn.AddComponent<Button>();
        cancelButton.onClick.AddListener(() =>
        {
            onCancel?.Invoke();
            Destroy(confirmObj);
        });
    }

    private void OnGameStateChanged(GameState previousState, GameState newState)
    {
        ShowPanel(newState);
    }
}
