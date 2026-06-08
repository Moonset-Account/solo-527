using UnityEngine;
using System;
using System.IO;
using System.Collections.Generic;

public class SaveManager : MonoBehaviour
{
    public static SaveManager Instance { get; private set; }

    private string saveFolder = "Saves";

    void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    string GetSavePath()
    {
        return Path.Combine(Application.persistentDataPath, saveFolder);
    }

    string GetSaveFilePath(string saveId)
    {
        return Path.Combine(GetSavePath(), saveId + ".json");
    }

    public void SaveGame(SaveData data)
    {
        string path = GetSavePath();
        if (!Directory.Exists(path))
        {
            Directory.CreateDirectory(path);
        }
        string json = JsonUtility.ToJson(data, true);
        File.WriteAllText(GetSaveFilePath(data.saveId), json);
    }

    public SaveData LoadGame(string saveId)
    {
        string filePath = GetSaveFilePath(saveId);
        if (!File.Exists(filePath))
        {
            return null;
        }
        string json = File.ReadAllText(filePath);
        return JsonUtility.FromJson<SaveData>(json);
    }

    public List<string> GetAllSaveIds()
    {
        List<string> ids = new List<string>();
        string path = GetSavePath();
        if (!Directory.Exists(path))
        {
            return ids;
        }
        string[] files = Directory.GetFiles(path, "*.json");
        foreach (string file in files)
        {
            ids.Add(Path.GetFileNameWithoutExtension(file));
        }
        return ids;
    }

    public void DeleteSave(string saveId)
    {
        string filePath = GetSaveFilePath(saveId);
        if (File.Exists(filePath))
        {
            File.Delete(filePath);
        }
    }

    public bool HasSave(string saveId)
    {
        return File.Exists(GetSaveFilePath(saveId));
    }
}
