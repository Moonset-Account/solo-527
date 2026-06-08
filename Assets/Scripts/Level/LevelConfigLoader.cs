using UnityEngine;
using System.Collections.Generic;
using System.IO;

public class LevelConfigLoader : MonoBehaviour
{
    [SerializeField] private string configPath = "LevelConfigs";

    public LevelData LoadLevelConfig(string fileName)
    {
        string fullPath = Path.Combine(Application.streamingAssetsPath, configPath, fileName + ".json");

        if (!File.Exists(fullPath))
        {
            Debug.LogError($"Level config file not found: {fullPath}");
            return null;
        }

        string json = File.ReadAllText(fullPath);
        return JsonUtility.FromJson<LevelData>(json);
    }

    public void SaveLevelConfig(LevelData levelData, string fileName)
    {
        string directoryPath = Path.Combine(Application.streamingAssetsPath, configPath);

        if (!Directory.Exists(directoryPath))
        {
            Directory.CreateDirectory(directoryPath);
        }

        string json = JsonUtility.ToJson(levelData, true);
        string fullPath = Path.Combine(directoryPath, fileName + ".json");
        File.WriteAllText(fullPath, json);

        Debug.Log($"Level config saved to: {fullPath}");
    }

    public static List<LevelData> GetAllLevelConfigs()
    {
        var configs = new List<LevelData>();
        string directoryPath = Path.Combine(Application.streamingAssetsPath, "LevelConfigs");

        if (!Directory.Exists(directoryPath))
        {
            return configs;
        }

        string[] files = Directory.GetFiles(directoryPath, "*.json");

        foreach (string file in files)
        {
            string json = File.ReadAllText(file);
            var levelData = JsonUtility.FromJson<LevelData>(json);
            if (levelData != null)
            {
                configs.Add(levelData);
            }
        }

        return configs;
    }

    private void EnsureStreamingAssetsDirectory()
    {
        string directoryPath = Path.Combine(Application.streamingAssetsPath, configPath);
        if (!Directory.Exists(directoryPath))
        {
            Directory.CreateDirectory(directoryPath);
        }
    }
}
