using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.Serialization.Formatters.Binary;
using UnityEngine;

namespace BeatRunner.Core
{
    public static class SaveSystem
    {
        private const string SaveFileName = "beatrunner_save.dat";

        private static string SavePath => Path.Combine(Application.persistentDataPath, SaveFileName);

        public static SaveData CurrentSave { get; private set; } = new SaveData();

        public static void LoadSaveData()
        {
            try
            {
                if (File.Exists(SavePath))
                {
                    using var stream = File.Open(SavePath, FileMode.Open);
                    var formatter = new BinaryFormatter();
                    CurrentSave = (SaveData)formatter.Deserialize(stream);
                    Debug.Log($"Save loaded from {SavePath}");
                }
                else
                {
                    CurrentSave = new SaveData();
                    SaveSaveData();
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to load save: {e.Message}");
                CurrentSave = new SaveData();
            }
        }

        public static void SaveSaveData()
        {
            try
            {
                using var stream = File.Create(SavePath);
                var formatter = new BinaryFormatter();
                formatter.Serialize(stream, CurrentSave);
                Debug.Log($"Save written to {SavePath}");
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to save: {e.Message}");
            }
        }

        public static void AddHighScore(string trackId, int score, int combo, float accuracy)
        {
            if (CurrentSave.trackHighScores.TryGetValue(trackId, out var existing))
            {
                if (score > existing.score)
                {
                    existing.score = score;
                    existing.combo = combo;
                    existing.accuracy = accuracy;
                }
            }
            else
            {
                CurrentSave.trackHighScores[trackId] = new TrackHighScore
                {
                    score = score,
                    combo = combo,
                    accuracy = accuracy
                };
            }
            SaveSaveData();
        }

        public static TrackHighScore GetHighScore(string trackId)
        {
            return CurrentSave.trackHighScores.TryGetValue(trackId, out var score) ? score : new TrackHighScore();
        }

        public static void UnlockTrack(string trackId)
        {
            if (!CurrentSave.unlockedTrackIds.Contains(trackId))
            {
                CurrentSave.unlockedTrackIds.Add(trackId);
                SaveSaveData();
            }
        }

        public static bool IsTrackUnlocked(string trackId)
        {
            return CurrentSave.unlockedTrackIds.Contains(trackId);
        }

        public static void UnlockSkin(string skinId)
        {
            if (!CurrentSave.unlockedSkinIds.Contains(skinId))
            {
                CurrentSave.unlockedSkinIds.Add(skinId);
                SaveSaveData();
            }
        }

        public static bool IsSkinUnlocked(string skinId)
        {
            return CurrentSave.unlockedSkinIds.Contains(skinId);
        }
    }

    [Serializable]
    public class SaveData
    {
        public Dictionary<string, TrackHighScore> trackHighScores = new Dictionary<string, TrackHighScore>();
        public List<string> unlockedTrackIds = new List<string>();
        public List<string> unlockedSkinIds = new List<string>();
        public float audioLatencyMs = 0f;
        public int totalFragmentsCollected = 0;
        public Dictionary<string, InputRemapEntry> inputRemap = new Dictionary<string, InputRemapEntry>();
        public int targetFrameRate = 60;
        public bool tutorialCompleted = false;
    }

    [Serializable]
    public class TrackHighScore
    {
        public int score;
        public int combo;
        public float accuracy;
    }

    [Serializable]
    public class InputRemapEntry
    {
        public string actionName;
        public string primaryKey;
        public string secondaryKey;
        public string gamepadButton;
        public string touchZone;
    }
}
