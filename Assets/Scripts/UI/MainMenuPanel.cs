using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class MainMenuPanel : MonoBehaviour
{
    [Header("Slot Selection")]
    [SerializeField] private Transform slotContainer;
    [SerializeField] private GameObject slotButtonPrefab;

    [Header("Navigation")]
    [SerializeField] private Button settingsButton;
    [SerializeField] private Button collectionButton;
    [SerializeField] private Button quitButton;

    [Header("Info")]
    [SerializeField] private TMP_Text titleText;
    [SerializeField] private TMP_Text versionText;

    private bool _uiBuilt;

    private void Start()
    {
        if (!_uiBuilt) BuildUI();
        RefreshSlots();

        if (settingsButton != null)
            settingsButton.onClick.AddListener(OnSettingsClicked);

        if (collectionButton != null)
            collectionButton.onClick.AddListener(OnCollectionClicked);

        if (quitButton != null)
            quitButton.onClick.AddListener(OnQuitClicked);

        if (versionText != null)
            versionText.text = $"v{SaveSystem.CurrentVersion}";
    }

    private void OnEnable()
    {
        if (_uiBuilt) RefreshSlots();
    }

    private void BuildUI()
    {
        _uiBuilt = true;

        var title = UIFactory.CreateLabel(transform, "Title", "湖面航行·天气挑战", 42, new Color(1f, 0.95f, 0.8f));
        var titleRt = title.GetComponent<RectTransform>();
        titleRt.anchorMin = new Vector2(0.5f, 0.85f);
        titleRt.anchorMax = new Vector2(0.5f, 0.85f);
        titleRt.sizeDelta = new Vector2(600f, 80f);
        title.alignment = TextAlignmentOptions.Center;
        titleText = title;

        var container = UIFactory.CreateContainer(transform, "SlotContainer");
        var containerRt = container.GetComponent<RectTransform>();
        containerRt.anchorMin = new Vector2(0.3f, 0.3f);
        containerRt.anchorMax = new Vector2(0.7f, 0.75f);
        containerRt.sizeDelta = Vector2.zero;
        slotContainer = container;

        settingsButton = UIFactory.CreateButton(transform, "SettingsBtn", "设置", 200f, 50f);
        var sRt = settingsButton.GetComponent<RectTransform>();
        sRt.anchorMin = new Vector2(0.02f, 0.02f);
        sRt.anchorMax = new Vector2(0.02f, 0.02f);
        sRt.anchoredPosition = new Vector2(0f, 0f);

        collectionButton = UIFactory.CreateButton(transform, "CollectionBtn", "图鉴", 200f, 50f);
        var cRt = collectionButton.GetComponent<RectTransform>();
        cRt.anchorMin = new Vector2(0.25f, 0.02f);
        cRt.anchorMax = new Vector2(0.25f, 0.02f);

        quitButton = UIFactory.CreateButton(transform, "QuitBtn", "退出", 200f, 50f);
        var qRt = quitButton.GetComponent<RectTransform>();
        qRt.anchorMin = new Vector2(0.98f, 0.02f);
        qRt.anchorMax = new Vector2(0.98f, 0.02f);

        var ver = UIFactory.CreateLabel(transform, "Version", $"v{SaveSystem.CurrentVersion}", 16, new Color(0.6f, 0.65f, 0.7f));
        var vRt = ver.GetComponent<RectTransform>();
        vRt.anchorMin = new Vector2(0.98f, 0.02f);
        vRt.anchorMax = new Vector2(0.98f, 0.02f);
        vRt.anchoredPosition = new Vector2(-80f, 60f);
        ver.alignment = TextAlignmentOptions.Right;
        versionText = ver;
    }

    private void RefreshSlots()
    {
        if (slotContainer == null) return;

        foreach (Transform child in slotContainer)
            Destroy(child.gameObject);

        for (int i = 0; i < SaveSystem.SlotCount; i++)
        {
            var slotObj = UIFactory.CreateSlotButton(slotContainer, $"Slot_{i}", i);
            var btn = slotObj.GetComponent<Button>();
            var texts = slotObj.GetComponentsInChildren<TMP_Text>();

            bool hasSave = SaveSystem.Instance != null && SaveSystem.Instance.HasSave(i);
            var preview = SaveSystem.Instance != null ? SaveSystem.Instance.GetSaveInfo(i) : null;

            if (texts.Length >= 2)
            {
                if (hasSave && preview != null)
                {
                    texts[0].text = $"存档 {i + 1} - {preview.playerName}";
                    texts[1].text = $"★ {preview.totalScore}";
                }
                else
                {
                    texts[0].text = $"存档 {i + 1}";
                    texts[1].text = "空 - 点击开始新游戏";
                }
            }

            if (btn != null)
            {
                int slotIdx = i;
                btn.onClick.AddListener(() => OnSlotClicked(slotIdx));
            }
        }
    }

    private void OnSlotClicked(int slotIndex)
    {
        GameEvents.TriggerAudioTriggerRequested("ui_click", 0.5f);

        if (GameFlowManager.Instance == null) return;

        if (SaveSystem.Instance != null && SaveSystem.Instance.HasSave(slotIndex))
        {
            GameFlowManager.Instance.ContinueGame(slotIndex);
        }
        else
        {
            GameFlowManager.Instance.StartNewGame(slotIndex);
        }
    }

    private void OnDeleteSlot(int slotIndex)
    {
        GameEvents.TriggerAudioTriggerRequested("ui_delete", 0.5f);

        if (SaveSystem.Instance != null)
        {
            SaveSystem.Instance.DeleteSave(slotIndex);
            RefreshSlots();
        }
    }

    private void OnSettingsClicked()
    {
        GameEvents.TriggerAudioTriggerRequested("ui_click", 0.5f);
        GameFlowManager.Instance?.OpenSettings();
    }

    private void OnCollectionClicked()
    {
        GameEvents.TriggerAudioTriggerRequested("ui_click", 0.5f);
        GameFlowManager.Instance?.OpenCollection();
    }

    private void OnQuitClicked()
    {
        GameEvents.TriggerAudioTriggerRequested("ui_back", 0.5f);

#if UNITY_EDITOR
        UnityEditor.EditorApplication.isPlaying = false;
#else
        Application.Quit();
#endif
    }
}
