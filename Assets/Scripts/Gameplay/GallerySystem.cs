using UnityEngine;
using System;
using System.Collections.Generic;
using LakeSailing.Core;
using LakeSailing.Data;

namespace LakeSailing.Gameplay
{
    public class GallerySystem : PersistentSingleton<GallerySystem>
    {
        [SerializeField] private List<GalleryItemData> allGalleryItems = new List<GalleryItemData>();
        [SerializeField] private List<string> unlockedItemIds = new List<string>();
        [SerializeField] private bool isLoaded;

        public event Action<GalleryItemData> OnItemUnlocked;
        public event Action OnGalleryLoaded;

        public List<GalleryItemData> AllItems => allGalleryItems;
        public List<string> UnlockedIds => unlockedItemIds;
        public bool IsLoaded => isLoaded;

        public void Initialize(IEnumerable<GalleryItemData> items)
        {
            allGalleryItems = new List<GalleryItemData>(items);
            if (SaveSystem.Instance.CurrentSave != null)
            {
                unlockedItemIds = new List<string>(SaveSystem.Instance.CurrentSave.unlockedGalleryItemIds);
            }
            isLoaded = true;
            OnGalleryLoaded?.Invoke();
        }

        public GalleryItemData GetItem(string itemId)
        {
            return allGalleryItems.Find(i => i.itemId == itemId);
        }

        public bool IsUnlocked(string itemId)
        {
            return unlockedItemIds.Contains(itemId);
        }

        public List<GalleryItemData> GetUnlockedItems()
        {
            var result = new List<GalleryItemData>();
            foreach (var id in unlockedItemIds)
            {
                var item = GetItem(id);
                if (item != null) result.Add(item);
            }
            return result;
        }

        public List<GalleryItemData> GetLockedItems()
        {
            var result = new List<GalleryItemData>();
            foreach (var item in allGalleryItems)
            {
                if (!unlockedItemIds.Contains(item.itemId))
                {
                    result.Add(item);
                }
            }
            return result;
        }

        public List<GalleryItemData> GetItemsByRarity(int rarity)
        {
            var result = new List<GalleryItemData>();
            foreach (var item in allGalleryItems)
            {
                if (item.rarity == rarity) result.Add(item);
            }
            return result;
        }

        public int GetTotalItemCount()
        {
            return allGalleryItems.Count;
        }

        public int GetUnlockedCount()
        {
            return unlockedItemIds.Count;
        }

        public float GetCompletionPercent()
        {
            if (allGalleryItems.Count == 0) return 0f;
            return (float)unlockedItemIds.Count / allGalleryItems.Count * 100f;
        }

        public async void UnlockItem(string itemId)
        {
            if (IsUnlocked(itemId)) return;
            var item = GetItem(itemId);
            if (item == null) return;

            unlockedItemIds.Add(itemId);
            await SaveSystem.Instance.UnlockGalleryItem(itemId);
            OnItemUnlocked?.Invoke(item);
            EventBus.Trigger(new GalleryItemUnlockedEvent(item));
        }

        public string GetRarityName(int rarity)
        {
            switch (rarity)
            {
                case 1: return "普通";
                case 2: return "稀有";
                case 3: return "珍贵";
                case 4: return "史诗";
                case 5: return "传说";
                default: return "未知";
            }
        }

        public Color GetRarityColor(int rarity)
        {
            switch (rarity)
            {
                case 1: return new Color(0.7f, 0.7f, 0.7f);
                case 2: return new Color(0.2f, 0.8f, 0.4f);
                case 3: return new Color(0.2f, 0.5f, 1f);
                case 4: return new Color(0.8f, 0.3f, 0.9f);
                case 5: return new Color(1f, 0.7f, 0.1f);
                default: return Color.white;
            }
        }
    }

    public struct GalleryItemUnlockedEvent : IEvent
    {
        public readonly GalleryItemData Item;

        public GalleryItemUnlockedEvent(GalleryItemData item)
        {
            Item = item;
        }
    }
}
