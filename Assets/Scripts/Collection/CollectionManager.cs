using System.Collections.Generic;
using UnityEngine;

public class CollectionManager : MonoBehaviour
{
    public static CollectionManager Instance { get; private set; }

    private Dictionary<string, CollectionItemData> _allItems = new Dictionary<string, CollectionItemData>();
    private HashSet<string> _unlockedItems = new HashSet<string>();
    private Dictionary<string, int> _viewCounts = new Dictionary<string, int>();

    public System.Action<CollectionItemData> OnItemUnlocked;
    public System.Action<string> OnItemViewed;
    public int TotalItemCount => _allItems.Count;
    public int UnlockedCount => _unlockedItems.Count;

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
        LoadAllCollectionItems();
    }

    private void OnEnable()
    {
        GameEvents.CollectionItemUnlocked += HandleItemUnlocked;
    }

    private void OnDisable()
    {
        GameEvents.CollectionItemUnlocked -= HandleItemUnlocked;
    }

    private void LoadAllCollectionItems()
    {
        _allItems.Clear();
        var items = ResLoader.Instance.LoadAll<CollectionItemData>("Collection");
        if (items != null)
        {
            foreach (var item in items)
            {
                if (item != null && !_allItems.ContainsKey(item.itemId))
                {
                    _allItems[item.itemId] = item;
                }
            }
        }
    }

    private void HandleItemUnlocked(string itemId)
    {
        UnlockItem(itemId);
    }

    public void UnlockItem(string itemId)
    {
        if (_unlockedItems.Contains(itemId)) return;

        _unlockedItems.Add(itemId);

        if (!_viewCounts.ContainsKey(itemId))
            _viewCounts[itemId] = 0;

        if (_allItems.ContainsKey(itemId))
        {
            var itemData = _allItems[itemId];
            if (!string.IsNullOrEmpty(itemData.unlockAudioId))
            {
                GameEvents.TriggerAudioTriggerRequested(itemData.unlockAudioId, 0.8f);
            }
            else
            {
                GameEvents.TriggerAudioTriggerRequested("collection_unlock", 0.7f);
            }

            OnItemUnlocked?.Invoke(itemData);
        }

        if (SaveSystem.Instance != null)
        {
            SaveSystem.Instance.UnlockCollectionItem(itemId);
        }
    }

    public bool IsUnlocked(string itemId)
    {
        return _unlockedItems.Contains(itemId);
    }

    public void RecordView(string itemId)
    {
        if (!_unlockedItems.Contains(itemId)) return;

        if (!_viewCounts.ContainsKey(itemId))
            _viewCounts[itemId] = 0;
        _viewCounts[itemId]++;

        if (SaveSystem.Instance != null)
        {
            SaveSystem.Instance.IncrementCollectionViewCount(itemId);
        }

        OnItemViewed?.Invoke(itemId);
    }

    public int GetViewCount(string itemId)
    {
        return _viewCounts.ContainsKey(itemId) ? _viewCounts[itemId] : 0;
    }

    public CollectionItemData GetItemData(string itemId)
    {
        return _allItems.ContainsKey(itemId) ? _allItems[itemId] : null;
    }

    public List<CollectionItemData> GetAllItemData()
    {
        return new List<CollectionItemData>(_allItems.Values);
    }

    public List<CollectionItemData> GetItemsByCategory(CollectionCategory category)
    {
        var result = new List<CollectionItemData>();
        foreach (var kvp in _allItems)
        {
            if (kvp.Value.category == category)
                result.Add(kvp.Value);
        }
        return result;
    }

    public List<CollectionItemData> GetUnlockedItems()
    {
        var result = new List<CollectionItemData>();
        foreach (var id in _unlockedItems)
        {
            if (_allItems.ContainsKey(id))
                result.Add(_allItems[id]);
        }
        return result;
    }

    public void RestoreFromSave(HashSet<string> unlockedIds, Dictionary<string, int> viewCounts)
    {
        _unlockedItems.Clear();
        _viewCounts.Clear();

        if (unlockedIds != null)
        {
            foreach (var id in unlockedIds)
                _unlockedItems.Add(id);
        }

        if (viewCounts != null)
        {
            foreach (var kvp in viewCounts)
                _viewCounts[kvp.Key] = kvp.Value;
        }
    }

    public float GetCompletionPercentage()
    {
        if (_allItems.Count == 0) return 0f;
        return (float)_unlockedItems.Count / _allItems.Count;
    }
}
