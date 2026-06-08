using System;
using System.Collections.Generic;
using UnityEngine;
using RainAlley.Core;

namespace RainAlley.Track
{
    public enum ObstacleStatus
    {
        Pending,
        Active,
        Judged,
        Missed
    }

    public class ActiveObstacle
    {
        public ObstacleData Data;
        public ObstacleStatus Status;
        public JudgeResult Result;
        public GameObject VisualObject;
        public int Index;
    }

    public class TrackObstacleManager
    {
        public IReadOnlyList<ActiveObstacle> AllObstacles => _allObstacles;
        public IReadOnlyList<ActiveObstacle> ActiveWindowObstacles => _activeWindow;

        public int NextPendingIndex => _nextPendingIndex;
        public int PendingCount => _allObstacles.Count - _nextPendingIndex;

        private List<ActiveObstacle> _allObstacles = new List<ActiveObstacle>();
        private List<ActiveObstacle> _activeWindow = new List<ActiveObstacle>();

        private int _nextPendingIndex = 0;
        private double _lookaheadMs = 2000;
        private double _missGraceMs = 500;

        public event Action<ActiveObstacle> OnObstacleEnterWindow;
        public event Action<ActiveObstacle, JudgeResult> OnObstacleJudged;
        public event Action<ActiveObstacle> OnObstacleMissed;
        public event Action<ActiveObstacle> OnObstacleExited;

        public void LoadObstacles(List<ObstacleData> obstacles)
        {
            _allObstacles.Clear();
            _activeWindow.Clear();
            _nextPendingIndex = 0;

            for (int i = 0; i < obstacles.Count; i++)
            {
                _allObstacles.Add(new ActiveObstacle
                {
                    Data = obstacles[i],
                    Status = ObstacleStatus.Pending,
                    Index = i
                });
            }
        }

        public void Reset()
        {
            foreach (var obs in _allObstacles)
            {
                obs.Status = ObstacleStatus.Pending;
                obs.Result = default;
            }
            _activeWindow.Clear();
            _nextPendingIndex = 0;
        }

        public void Update(double currentTimeMs, double latencyOffsetMs,
                          Func<double, ObstacleData, bool> missCheck)
        {
            double effectiveTime = currentTimeMs + latencyOffsetMs;

            while (_nextPendingIndex < _allObstacles.Count)
            {
                var next = _allObstacles[_nextPendingIndex];
                double adjusted = next.Data.BeatTimeMs + latencyOffsetMs;
                if (effectiveTime >= adjusted - _lookaheadMs)
                {
                    next.Status = ObstacleStatus.Active;
                    _activeWindow.Add(next);
                    OnObstacleEnterWindow?.Invoke(next);
                    _nextPendingIndex++;
                }
                else break;
            }

            for (int i = _activeWindow.Count - 1; i >= 0; i--)
            {
                var obs = _activeWindow[i];
                double adjusted = obs.Data.BeatTimeMs + latencyOffsetMs;

                if (obs.Status == ObstacleStatus.Active && missCheck(currentTimeMs, obs.Data))
                {
                    obs.Status = ObstacleStatus.Missed;
                    obs.Result = JudgeResult.Miss();
                    OnObstacleMissed?.Invoke(obs);
                    OnObstacleJudged?.Invoke(obs, obs.Result);
                }

                if (effectiveTime > adjusted + _missGraceMs)
                {
                    if (obs.Status == ObstacleStatus.Active)
                    {
                        obs.Status = ObstacleStatus.Missed;
                        obs.Result = JudgeResult.Miss();
                        OnObstacleMissed?.Invoke(obs);
                        OnObstacleJudged?.Invoke(obs, obs.Result);
                    }

                    _activeWindow.RemoveAt(i);
                    OnObstacleExited?.Invoke(obs);
                }
            }
        }

        public ActiveObstacle FindClosestActiveToJudge(double currentTimeMs, double latencyOffsetMs,
                                                      double goodWindowMs)
        {
            ActiveObstacle best = null;
            double bestOffset = double.MaxValue;

            foreach (var obs in _activeWindow)
            {
                if (obs.Status != ObstacleStatus.Active) continue;

                double adjusted = obs.Data.BeatTimeMs + latencyOffsetMs;
                double offset = Math.Abs(currentTimeMs - adjusted);

                if (offset <= goodWindowMs && offset < bestOffset)
                {
                    best = obs;
                    bestOffset = offset;
                }
            }

            return best;
        }

        public void MarkJudged(ActiveObstacle obstacle, JudgeResult result)
        {
            obstacle.Status = ObstacleStatus.Judged;
            obstacle.Result = result;
            OnObstacleJudged?.Invoke(obstacle, result);
        }

        public List<ActiveObstacle> GetObstaclesInBeatRange(int startBeat, int endBeat)
        {
            var result = new List<ActiveObstacle>();
            foreach (var obs in _allObstacles)
            {
                if (obs.Data.BeatIndex >= startBeat && obs.Data.BeatIndex <= endBeat)
                    result.Add(obs);
            }
            return result;
        }

        public int FindObstacleIndexAtOrBeforeBeat(int beat)
        {
            int idx = -1;
            for (int i = 0; i < _allObstacles.Count; i++)
            {
                if (_allObstacles[i].Data.BeatIndex <= beat)
                    idx = i;
                else
                    break;
            }
            return idx;
        }

        public void SetLookahead(double lookaheadMs)
        {
            _lookaheadMs = Math.Max(500, lookaheadMs);
        }
    }
}
