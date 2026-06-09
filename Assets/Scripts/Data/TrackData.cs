using System;
using System.Collections.Generic;
using UnityEngine;

namespace BeatRunner.Data
{
    public enum NoteType
    {
        Jump,
        Slide,
        ObstacleHigh,
        ObstacleLow,
        Fragment,
        LaneSwitchLeft,
        LaneSwitchRight
    }

    [Serializable]
    public class NoteData
    {
        public NoteType type;
        public int trackIndex;
        public int beatIndex;
        [Range(0f, 1f)] public float beatOffset = 0f;
        public int fragmentValue = 1;
        public float zOffset = 0f;
        public float hitRadius = 1f;
    }

    [Serializable]
    public class LevelData
    {
        public string levelId;
        public string levelName;
        public int difficulty;
        public float startDelay = 4f;
        public float endDelay = 2f;
        public int beatsPerMeasure = 4;
        public int startBeat = 0;
        public int endBeat = 64;
        public List<NoteData> notes = new List<NoteData>();

        public int TotalBeats => endBeat - startBeat;
        public int TotalMeasures => TotalBeats / beatsPerMeasure;
    }

    [CreateAssetMenu(fileName = "TrackData", menuName = "BeatRunner/TrackData")]
    public class TrackData : ScriptableObject
    {
        public string trackId;
        public string trackName;
        public string artistName;
        public AudioClip musicClip;
        public float bpm = 120f;
        [TextArea] public string description;
        public Sprite coverArt;
        public Color themeColor = new Color(0.3f, 0.6f, 1f);

        [Header("Difficulty Levels")]
        public LevelData easyLevel;
        public LevelData normalLevel;
        public LevelData hardLevel;

        [Header("Unlock")]
        public bool isUnlockedByDefault;
        public int requiredFragments = 0;

        [Header("Scoring")]
        public int fragmentReward = 10;

        public LevelData GetLevelByDifficulty(int difficulty)
        {
            switch (difficulty)
            {
                case 0: return easyLevel ?? normalLevel ?? hardLevel;
                case 1: return normalLevel ?? hardLevel ?? easyLevel;
                case 2: return hardLevel ?? normalLevel ?? easyLevel;
                default: return normalLevel;
            }
        }

        public float GetDurationSeconds()
        {
            var level = normalLevel ?? easyLevel ?? hardLevel;
            if (level == null) return 0f;
            float secondsPerBeat = 60f / bpm;
            return level.startDelay + (level.TotalBeats * secondsPerBeat) + level.endDelay;
        }

        public int GetTotalFragments()
        {
            int total = 0;
            void Count(LevelData lvl)
            {
                if (lvl == null) return;
                foreach (var n in lvl.notes)
                {
                    if (n.type == NoteType.Fragment) total += n.fragmentValue;
                }
            }
            Count(easyLevel);
            Count(normalLevel);
            Count(hardLevel);
            return total;
        }
    }

    [CreateAssetMenu(fileName = "SkinData", menuName = "BeatRunner/SkinData")]
    public class SkinData : ScriptableObject
    {
        public string skinId;
        public string skinName;
        public Sprite previewIcon;

        public Color primaryColor = Color.white;
        public Color secondaryColor = Color.cyan;
        public Color trailColor = Color.magenta;

        public Material playerMaterial;
        public GameObject visualPrefab;

        [Header("Unlock")]
        public bool isUnlockedByDefault;
        public int requiredFragments = 100;
    }

    [CreateAssetMenu(fileName = "TrackLibrary", menuName = "BeatRunner/TrackLibrary")]
    public class TrackLibrary : ScriptableObject
    {
        public List<TrackData> tracks = new List<TrackData>();
        public List<SkinData> skins = new List<SkinData>();

        public TrackData GetTrackById(string id)
        {
            return tracks.Find(t => t != null && t.trackId == id);
        }

        public SkinData GetSkinById(string id)
        {
            return skins.Find(s => s != null && s.skinId == id);
        }

        public List<TrackData> GetUnlockedTracks()
        {
            var result = new List<TrackData>();
            foreach (var t in tracks)
            {
                if (t == null) continue;
                if (t.isUnlockedByDefault || Core.SaveSystem.IsTrackUnlocked(t.trackId))
                {
                    result.Add(t);
                }
            }
            return result;
        }

        public List<SkinData> GetUnlockedSkins()
        {
            var result = new List<SkinData>();
            foreach (var s in skins)
            {
                if (s == null) continue;
                if (s.isUnlockedByDefault || Core.SaveSystem.IsSkinUnlocked(s.skinId))
                {
                    result.Add(s);
                }
            }
            return result;
        }
    }
}
