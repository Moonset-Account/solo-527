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

    private void Start()
    {
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
        RefreshSlots();
    }

    private void RefreshSlots()
    {
        if (slotContainer == null || slotButtonPrefab == null) return;

        foreach (Transform child in slotContainer)
            Destroy(child.gameObject);

        for (int i = 0; i < SaveSystem.SlotCount; i++)
        {
            var slotObj = Instantiate(slotButtonPrefab, slotContainer);
            var btn = slotObj.GetComponent<Button>();
            var texts = slotObj.GetComponentsInChildren<TMP_Text>();

            bool hasSave = SaveSystem.Instance != null && SaveSystem.Instance.HasSave(i);
            var preview = SaveSystem.Instance != null ? SaveSystem.Instance.GetSaveInfo(i) : null;

            if (texts.Length >= 3)
            {
                texts[0].text = $"存档 {i + 1}";

                if (hasSave && preview != null)
                {
                    texts[1].text = preview.playerName;
                    texts[2].text = $"★ {preview.totalScore} | {preview.GetSaveTime():yyyy/MM/dd HH:mm}";
                }
                else
                {
                    texts[1].text = "空";
                    texts[2].text = "点击开始新游戏";
                }
            }

            var deleteBtn = slotObj.transform.Find("DeleteButton");
            if (deleteBtn != null)
            {
                deleteBtn.gameObject.SetActive(hasSave);
                var delBtnComp = deleteBtn.GetComponent<Button>();
                if (delBtnComp != null)
                {
                    int slotIdx = i;
                    delBtnComp.onClick.AddListener(() => OnDeleteSlot(slotIdx));
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

        if (GameFlowManager.Instance != null)
            GameFlowManager.Instance.OpenSettings();
    }

    private void OnCollectionClicked()
    {
        GameEvents.TriggerAudioTriggerRequested("ui_click", 0.5f);

        if (GameFlowManager.Instance != null)
            GameFlowManager.Instance.OpenCollection();
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
