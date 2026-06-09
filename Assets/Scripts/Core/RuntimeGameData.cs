using System.Collections.Generic;
using BeatRunner.Data;
using UnityEngine;

namespace BeatRunner.Core
{
    [CreateAssetMenu(fileName = "RuntimeGameData", menuName = "BeatRunner/RuntimeGameData")]
    public class RuntimeGameData : ScriptableObject
    {
        public int currentScore;
        public int currentCombo;
        public int maxCombo;
        public int perfectCount;
        public int greatCount;
        public int goodCount;
        public int missCount;
        public int fragmentsCollected;
        public int totalFragments;

        public TrackData selectedTrack;
        public SkinData selectedSkin;

        public List<TrackData> unlockedTracks = new List<TrackData>();
        public List<SkinData> unlockedSkins = new List<SkinData>();

        public float currentAudioLatencyMs;

        public InputType currentInputType = InputType.Keyboard;

        public void ResetRunStats()
        {
            currentScore = 0;
            currentCombo = 0;
            maxCombo = 0;
            perfectCount = 0;
            greatCount = 0;
            goodCount = 0;
            missCount = 0;
            fragmentsCollected = 0;
        }

        public void AddHit(JudgmentType judgment, int fragments)
        {
            switch (judgment)
            {
                case JudgmentType.Perfect:
                    perfectCount++;
                    break;
                case JudgmentType.Great:
                    greatCount++;
                    break;
                case JudgmentType.Good:
                    goodCount++;
                    break;
                case JudgmentType.Miss:
                    missCount++;
                    currentCombo = 0;
                    return;
            }

            currentCombo++;
            if (currentCombo > maxCombo) maxCombo = currentCombo;
            fragmentsCollected += fragments;
        }
    }

    public enum JudgmentType
    {
        Perfect,
        Great,
        Good,
        Miss
    }

    public enum InputType
    {
        Keyboard,
        Touch,
        Gamepad
    }
}
