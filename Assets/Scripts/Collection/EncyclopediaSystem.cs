using System;
using System.Collections.Generic;
using UnityEngine;

namespace LakeNavigation
{
    [Serializable]
    public class CollectibleEntry
    {
        public string Id;
        public string DisplayName;
        public string Description;
        public CollectionCategory Category;
        public Sprite Icon;
        public bool IsDiscovered;
        public int DiscoveryCount;
        public string FunFact;
    }

    public class EncyclopediaSystem : MonoBehaviour
    {
        public List<CollectibleEntry> allEntries;

        public event Action<CollectibleEntry> OnEntryDiscovered;
        public event Action OnEncyclopediaUpdated;

        public void Initialize(List<CollectibleEntry> entries)
        {
            allEntries = entries;
            LoadProgress();
        }

        public void Discover(string entryId)
        {
            var entry = GetEntry(entryId);
            if (entry == null) return;

            if (!entry.IsDiscovered)
            {
                entry.IsDiscovered = true;
                OnEntryDiscovered?.Invoke(entry);
            }

            entry.DiscoveryCount++;
            OnEncyclopediaUpdated?.Invoke();
        }

        public CollectibleEntry GetEntry(string id)
        {
            return allEntries.Find(e => e.Id == id);
        }

        public List<CollectibleEntry> GetDiscoveredEntries()
        {
            return allEntries.FindAll(e => e.IsDiscovered);
        }

        public List<CollectibleEntry> GetEntriesByCategory(CollectionCategory cat)
        {
            return allEntries.FindAll(e => e.Category == cat);
        }

        public float GetDiscoveryProgress()
        {
            if (allEntries.Count == 0) return 0f;
            return (float)GetTotalDiscovered() / allEntries.Count;
        }

        public int GetTotalDiscovered()
        {
            return allEntries.FindAll(e => e.IsDiscovered).Count;
        }

        public int GetTotalEntries()
        {
            return allEntries.Count;
        }

        public void SaveProgress()
        {
            var discoveredIds = new List<string>();
            foreach (var entry in allEntries)
            {
                if (entry.IsDiscovered)
                    discoveredIds.Add(entry.Id);
            }
            PlayerPrefs.SetString("EncyclopediaDiscovered", string.Join(",", discoveredIds));
            PlayerPrefs.Save();
        }

        public void LoadProgress()
        {
            var saved = PlayerPrefs.GetString("EncyclopediaDiscovered", "");
            if (string.IsNullOrEmpty(saved)) return;

            var ids = saved.Split(',');
            foreach (var id in ids)
            {
                var entry = GetEntry(id.Trim());
                if (entry != null)
                {
                    entry.IsDiscovered = true;
                }
            }
        }

        public void Reset()
        {
            foreach (var entry in allEntries)
            {
                entry.IsDiscovered = false;
                entry.DiscoveryCount = 0;
            }
            PlayerPrefs.DeleteKey("EncyclopediaDiscovered");
            OnEncyclopediaUpdated?.Invoke();
        }
    }
}
