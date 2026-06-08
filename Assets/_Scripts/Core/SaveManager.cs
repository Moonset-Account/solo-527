using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;

namespace LightShadowPlatformer.Core
{
    [Serializable]
    public class SaveData
    {
        public int currentLevel;
        public string activeCheckpointId;
        public List<string> activatedCheckpoints;
        public List<string> collectedItems;
        public List<string> activatedSwitches;
        public float playTime;
        public string saveTimestamp;

        public SaveData()
        {
            currentLevel = 0;
            activeCheckpointId = "";
            activatedCheckpoints = new List<string>();
            collectedItems = new List<string>();
            activatedSwitches = new List<string>();
            playTime = 0f;
            saveTimestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
        }
    }

    public class SaveManager : MonoBehaviour
    {
        public static SaveManager Instance { get; private set; }

        private string _saveFilePath;
        private SaveData _currentSave;
        private float _sessionStartTime;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            _saveFilePath = Path.Combine(Application.persistentDataPath, "savegame.json");
            _sessionStartTime = Time.realtimeSinceStartup;
        }

        public bool HasSaveData()
        {
            return File.Exists(_saveFilePath);
        }

        public void SaveProgress(int levelIndex, string checkpointId = "")
        {
            if (_currentSave == null)
                _currentSave = new SaveData();

            _currentSave.currentLevel = levelIndex;
            if (!string.IsNullOrEmpty(checkpointId))
                _currentSave.activeCheckpointId = checkpointId;

            _currentSave.playTime += (Time.realtimeSinceStartup - _sessionStartTime);
            _currentSave.saveTimestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
            _sessionStartTime = Time.realtimeSinceStartup;

            WriteSaveToFile();
        }

        public void SaveCheckpointActivation(string checkpointId)
        {
            if (_currentSave == null) _currentSave = new SaveData();

            if (!_currentSave.activatedCheckpoints.Contains(checkpointId))
                _currentSave.activatedCheckpoints.Add(checkpointId);

            _currentSave.activeCheckpointId = checkpointId;
            WriteSaveToFile();
        }

        public void SaveCollectibleCollected(string collectibleId)
        {
            if (_currentSave == null) _currentSave = new SaveData();

            if (!_currentSave.collectedItems.Contains(collectibleId))
                _currentSave.collectedItems.Add(collectibleId);
        }

        public void SaveSwitchState(string switchId, bool isActive)
        {
            if (_currentSave == null) _currentSave = new SaveData();

            if (isActive && !_currentSave.activatedSwitches.Contains(switchId))
                _currentSave.activatedSwitches.Add(switchId);
            else if (!isActive && _currentSave.activatedSwitches.Contains(switchId))
                _currentSave.activatedSwitches.Remove(switchId);
        }

        public bool IsCollectibleCollected(string collectibleId)
        {
            return _currentSave != null && _currentSave.collectedItems.Contains(collectibleId);
        }

        public bool IsSwitchActivated(string switchId)
        {
            return _currentSave != null && _currentSave.activatedSwitches.Contains(switchId);
        }

        public bool IsCheckpointActivated(string checkpointId)
        {
            return _currentSave != null && _currentSave.activatedCheckpoints.Contains(checkpointId);
        }

        public string GetActiveCheckpointId()
        {
            return _currentSave?.activeCheckpointId ?? "";
        }

        public SaveData LoadSave()
        {
            if (HasSaveData())
            {
                try
                {
                    string json = File.ReadAllText(_saveFilePath);
                    _currentSave = JsonUtility.FromJson<SaveData>(json);
                    _sessionStartTime = Time.realtimeSinceStartup;
                    return _currentSave;
                }
                catch (Exception e)
                {
                    Debug.LogError($"Failed to load save: {e.Message}");
                }
            }
            _currentSave = new SaveData();
            return _currentSave;
        }

        public SaveData GetCurrentSave()
        {
            return _currentSave ??= new SaveData();
        }

        public void DeleteSave()
        {
            if (HasSaveData())
            {
                File.Delete(_saveFilePath);
            }
            _currentSave = new SaveData();
            _sessionStartTime = Time.realtimeSinceStartup;
        }

        private void WriteSaveToFile()
        {
            try
            {
                string json = JsonUtility.ToJson(_currentSave, true);
                File.WriteAllText(_saveFilePath, json);
                Debug.Log($"Game saved to {_saveFilePath}");
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to save: {e.Message}");
            }
        }
    }
}
