using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class CollectionPanel : MonoBehaviour
{
    [SerializeField] private Transform categoryTabContainer;
    [SerializeField] private Transform itemGridContainer;
    [SerializeField] private GameObject categoryTabPrefab;
    [SerializeField] private GameObject itemCardPrefab;
    [SerializeField] private TMP_Text detailNameText;
    [SerializeField] private TMP_Text detailDescriptionText;
    [SerializeField] private TMP_Text detailLoreText;
    [SerializeField] private Image detailIcon;
    [SerializeField] private TMP_Text completionText;
    [SerializeField] private Button backButton;
    [SerializeField] private GameObject detailPanel;
    [SerializeField] private Sprite lockedIcon;

    private CollectionCategory _currentCategory = CollectionCategory.Wildlife;
    private List<CollectionItemData> _allItems = new List<CollectionItemData>();
    private string _selectedItemId;

    private static readonly string[] CategoryLabels = new string[]
    {
        "野生动物", "地标", "天气", "植物", "船型", "特殊"
    };

    private void Start()
    {
        if (backButton != null)
            backButton.onClick.AddListener(OnBackClicked);

        if (detailPanel != null)
            detailPanel.SetActive(false);

        LoadAllItems();
        PopulateCategoryTabs();
        ShowCategory(CollectionCategory.Wildlife);
    }

    private void OnEnable()
    {
        RefreshDisplay();
    }

    private void LoadAllItems()
    {
        _allItems.Clear();
        if (CollectionManager.Instance != null)
            _allItems = CollectionManager.Instance.GetAllItemData();
    }

    private void PopulateCategoryTabs()
    {
        if (categoryTabContainer == null || categoryTabPrefab == null) return;

        foreach (Transform child in categoryTabContainer)
            Destroy(child.gameObject);

        for (int i = 0; i < CategoryLabels.Length; i++)
        {
            var tab = Instantiate(categoryTabPrefab, categoryTabContainer);
            var btn = tab.GetComponent<Button>();
            var txt = tab.GetComponentInChildren<TMP_Text>();

            CollectionCategory cat = (CollectionCategory)i;
            if (txt != null)
                txt.text = CategoryLabels[i];

            if (btn != null)
            {
                btn.onClick.AddListener(() => ShowCategory(cat));
            }
        }
    }

    private void ShowCategory(CollectionCategory category)
    {
        _currentCategory = category;

        if (itemGridContainer == null) return;

        foreach (Transform child in itemGridContainer)
            Destroy(child.gameObject);

        var items = CollectionManager.Instance != null
            ? CollectionManager.Instance.GetItemsByCategory(category)
            : new List<CollectionItemData>();

        foreach (var item in items)
        {
            if (itemCardPrefab == null) continue;

            var card = Instantiate(itemCardPrefab, itemGridContainer);
            var btn = card.GetComponent<Button>();
            var images = card.GetComponentsInChildren<Image>();
            var texts = card.GetComponentsInChildren<TMP_Text>();

            bool unlocked = CollectionManager.Instance != null && CollectionManager.Instance.IsUnlocked(item.itemId);

            if (texts.Length >= 2)
            {
                texts[0].text = unlocked ? item.displayName : "???";
                texts[1].text = unlocked ? GetRarityLabel(item.rarity) : "";
            }

            if (images.Length >= 2)
            {
                if (unlocked && !string.IsNullOrEmpty(item.iconPath))
                {
                    var sprite = ResLoader.Instance.Load<Sprite>(item.iconPath);
                    if (sprite != null)
                        images[1].sprite = sprite;
                }
                else if (!unlocked && lockedIcon != null)
                {
                    images[1].sprite = lockedIcon;
                    images[1].color = new Color(0.3f, 0.3f, 0.3f, 1f);
                }
            }

            if (btn != null && unlocked)
            {
                string id = item.itemId;
                btn.onClick.AddListener(() => ShowItemDetail(id));
            }
            else if (btn != null)
            {
                btn.interactable = false;
            }
        }

        UpdateCompletionText();
    }

    private void ShowItemDetail(string itemId)
    {
        _selectedItemId = itemId;

        if (CollectionManager.Instance != null)
            CollectionManager.Instance.RecordView(itemId);

        var itemData = CollectionManager.Instance != null
            ? CollectionManager.Instance.GetItemData(itemId)
            : null;

        if (itemData == null) return;

        if (detailPanel != null)
            detailPanel.SetActive(true);

        if (detailNameText != null)
            detailNameText.text = itemData.displayName;

        if (detailDescriptionText != null)
            detailDescriptionText.text = itemData.description;

        if (detailLoreText != null)
            detailLoreText.text = itemData.loreText;

        if (detailIcon != null && !string.IsNullOrEmpty(itemData.iconPath))
        {
            var sprite = ResLoader.Instance.Load<Sprite>(itemData.iconPath);
            if (sprite != null)
                detailIcon.sprite = sprite;
        }

        GameEvents.TriggerAudioTriggerRequested("ui_click", 0.4f);
    }

    private void UpdateCompletionText()
    {
        if (completionText == null || CollectionManager.Instance == null) return;

        float pct = CollectionManager.Instance.GetCompletionPercentage() * 100f;
        completionText.text = $"图鉴完成: {CollectionManager.Instance.UnlockedCount}/{CollectionManager.Instance.TotalItemCount} ({pct:F0}%)";
    }

    private string GetRarityLabel(int rarity)
    {
        switch (rarity)
        {
            case 0: return "普通";
            case 1: return "稀有";
            case 2: return "史诗";
            case 3: return "传说";
            default: return "";
        }
    }

    private void RefreshDisplay()
    {
        LoadAllItems();
        ShowCategory(_currentCategory);
    }

    private void OnBackClicked()
    {
        GameEvents.TriggerAudioTriggerRequested("ui_back", 0.5f);

        if (UIStateManager.Instance != null)
            UIStateManager.Instance.PopState();
    }
}
