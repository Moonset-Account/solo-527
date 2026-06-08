using UnityEngine;
using System;
using System.Collections.Generic;
using System.IO;

public static class LevelConfigLoader
{
    public static LevelConfig LoadFromJson(string path)
    {
        TextAsset asset = Resources.Load<TextAsset>(path);
        if (asset == null)
        {
            Debug.LogError("Failed to load level config at: " + path);
            return null;
        }
        return JsonUtility.FromJson<LevelConfig>(asset.text);
    }

    public static List<LevelConfig> LoadAllLevels()
    {
        List<LevelConfig> configs = new List<LevelConfig>();
        TextAsset[] assets = Resources.LoadAll<TextAsset>("LevelData");
        if (assets == null || assets.Length == 0)
        {
            Debug.LogWarning("No level configs found in Resources/LevelData");
            return configs;
        }
        foreach (TextAsset asset in assets)
        {
            LevelConfig config = JsonUtility.FromJson<LevelConfig>(asset.text);
            if (config != null)
            {
                configs.Add(config);
            }
        }
        configs.Sort((a, b) => a.difficulty.CompareTo(b.difficulty));
        return configs;
    }

    public static void SaveLevelConfig(LevelConfig config, string path)
    {
        string json = JsonUtility.ToJson(config, true);
        string fullPath = Path.Combine(Application.dataPath, path);
        string directory = Path.GetDirectoryName(fullPath);
        if (!Directory.Exists(directory))
        {
            Directory.CreateDirectory(directory);
        }
        File.WriteAllText(fullPath, json);
    }
}
