using System;
using UnityEngine;
using RainAlley.Core;

namespace RainAlley.BeatSystem
{
    public class BeatJudge
    {
        public double PerfectWindowMs { get; private set; }
        public double GoodWindowMs { get; private set; }
        public double LatencyOffsetMs { get; private set; }

        public int PerfectScore = 300;
        public int GoodScore = 150;

        public event Action<JudgeResult, ObstacleData> OnJudged;

        public BeatJudge(double perfectMs, double goodMs, double latencyMs = 0)
        {
            PerfectWindowMs = perfectMs;
            GoodWindowMs = goodMs;
            LatencyOffsetMs = latencyMs;
        }

        public void UpdateWindows(double perfectMs, double goodMs)
        {
            PerfectWindowMs = perfectMs;
            GoodWindowMs = goodMs;
        }

        public void UpdateLatencyOffset(double latencyMs)
        {
            LatencyOffsetMs = latencyMs;
        }

        public JudgeResult JudgeInput(double inputTimeMs, ObstacleData obstacle,
                                      UmbrellaColorType currentColor, TrackPosition currentTrack)
        {
            double adjustedTarget = obstacle.BeatTimeMs + LatencyOffsetMs;
            double offset = inputTimeMs - adjustedTarget;
            double absOffset = Math.Abs(offset);

            JudgeType judgeType;
            int score;

            if (absOffset <= PerfectWindowMs)
            {
                judgeType = JudgeType.Perfect;
                score = PerfectScore;
            }
            else if (absOffset <= GoodWindowMs)
            {
                judgeType = offset < 0 ? JudgeType.Early : JudgeType.Late;
                score = GoodScore;
            }
            else
            {
                var miss = JudgeResult.Miss();
                OnJudged?.Invoke(miss, obstacle);
                return miss;
            }

            bool colorCorrect = UmbrellaColor.Matches(currentColor, obstacle.RequiredColor);
            bool trackCorrect = currentTrack == obstacle.Track;

            if (!colorCorrect || !trackCorrect)
            {
                score = 0;
            }

            var result = JudgeResult.Create(judgeType, offset, colorCorrect, trackCorrect, score);
            OnJudged?.Invoke(result, obstacle);
            return result;
        }

        public bool CheckAutoMiss(double currentTimeMs, ObstacleData obstacle)
        {
            double adjustedTarget = obstacle.BeatTimeMs + LatencyOffsetMs;
            return currentTimeMs > adjustedTarget + GoodWindowMs;
        }

        public bool IsInJudgeWindow(double currentTimeMs, ObstacleData obstacle)
        {
            double adjustedTarget = obstacle.BeatTimeMs + LatencyOffsetMs;
            double abs = Math.Abs(currentTimeMs - adjustedTarget);
            return abs <= GoodWindowMs;
        }
    }
}
