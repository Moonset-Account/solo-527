using UnityEngine;
using System.Collections.Generic;
using System.Linq;

public class LevelProgression : MonoBehaviour
{
    public static LevelProgression Instance { get; private set; }

    private HashSet<int> unlockedLevels = new HashSet<int>();
    private Dictionary<int, int> bestStars = new Dictionary<int, int>();
    [SerializeField] private string saveKey = "LevelProgression";

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
        DontDestroyOnLoad(gameObject);
        LoadProgression();
    }

    public void UnlockLevel(int levelIndex)
    {
        unlockedLevels.Add(levelIndex);
        SaveProgression();
    }

    public bool IsLevelUnlocked(int levelIndex)
    {
        return unlockedLevels.Contains(levelIndex);
    }

    public int GetBestStars(int levelIndex)
    {
        return bestStars.TryGetValue(levelIndex, out int stars) ? stars : 0;
    }

    public void CompleteLevel(int levelIndex, int stars)
    {
        if (!unlockedLevels.Contains(levelIndex))
        {
            unlockedLevels.Add(levelIndex);
        }

        if (!bestStars.ContainsKey(levelIndex) || bestStars[levelIndex] < stars)
        {
            bestStars[levelIndex] = stars;
        }

        int nextLevel = levelIndex + 1;
        if (stars >= 1 && !unlockedLevels.Contains(nextLevel))
        {
            unlockedLevels.Add(nextLevel);
        }

        SaveProgression();
    }

    public void SaveProgression()
    {
        var data = new LevelProgressionData
        {
            unlockedLevelsList = unlockedLevels.ToList(),
            bestStarsKeys = bestStars.Keys.ToList(),
            bestStarsValues = bestStars.Values.ToList()
        };

        string json = JsonUtility.ToJson(data);
        PlayerPrefs.SetString(saveKey, json);
        PlayerPrefs.Save();
    }

    private void LoadProgression()
    {
        if (!PlayerPrefs.HasKey(saveKey))
        {
            unlockedLevels.Add(0);
            return;
        }

        string json = PlayerPrefs.GetString(saveKey);
        var data = JsonUtility.FromJson<LevelProgressionData>(json);

        if (data != null)
        {
            unlockedLevels = new HashSet<int>(data.unlockedLevelsList ?? new List<int>());

            bestStars.Clear();
            if (data.bestStarsKeys != null && data.bestStarsValues != null)
            {
                for (int i = 0; i < data.bestStarsKeys.Count && i < data.bestStarsValues.Count; i++)
                {
                    bestStars[data.bestStarsKeys[i]] = data.bestStarsValues[i];
                }
            }
        }

        if (unlockedLevels.Count == 0)
        {
            unlockedLevels.Add(0);
        }
    }

    [System.Serializable]
    private class LevelProgressionData
    {
        public List<int> unlockedLevelsList;
        public List<int> bestStarsKeys;
        public List<int> bestStarsValues;
    }
}
