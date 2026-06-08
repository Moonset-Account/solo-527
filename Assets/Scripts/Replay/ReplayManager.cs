using System;
using System.Collections.Generic;
using UnityEngine;
using RainAlley.Core;

namespace RainAlley.Replay
{
    public enum InputActionType
    {
        ColorSwitch,
        TrackSwitch,
        JudgeInput
    }

    public struct ReplayInputEvent
    {
        public double TimeMs;
        public InputActionType ActionType;
        public int ColorIndex;
        public TrackPosition Track;
        public JudgeResult JudgeResult;
    }

    public struct ReplayFrame
    {
        public double TimeMs;
        public UmbrellaColorType CurrentColor;
        public TrackPosition CurrentTrack;
        public List<ReplayInputEvent> PendingEvents;
    }

    public class ReplayManager
    {
        public int ReplayBeatWindow = 8;
        public bool IsReplaying => _isReplaying;
        public IReadOnlyList<ReplayInputEvent> CurrentRunEvents => _currentRunEvents;

        public event Action<int, int> OnReplayStart;
        public event Action OnReplayEnd;

        private List<ReplayInputEvent> _currentRunEvents = new List<ReplayInputEvent>();
        private List<ReplayInputEvent> _replayQueue = new List<ReplayInputEvent>();
        private int _replayEventIndex = 0;
        private double _replayStartTimeMs = 0;
        private bool _isReplaying = false;

        public void RecordEvent(ReplayInputEvent ev)
        {
            if (!_isReplaying)
            {
                _currentRunEvents.Add(ev);
            }
        }

        public void RecordColorSwitch(double timeMs, UmbrellaColorType newColor, int colorIndex)
        {
            if (_isReplaying) return;
            _currentRunEvents.Add(new ReplayInputEvent
            {
                TimeMs = timeMs,
                ActionType = InputActionType.ColorSwitch,
                ColorIndex = colorIndex,
                Track = TrackPosition.Left
            });
        }

        public void RecordTrackSwitch(double timeMs, TrackPosition newTrack)
        {
            if (_isReplaying) return;
            _currentRunEvents.Add(new ReplayInputEvent
            {
                TimeMs = timeMs,
                ActionType = InputActionType.TrackSwitch,
                Track = newTrack
            });
        }

        public void RecordJudgeInput(double timeMs, JudgeResult result)
        {
            if (_isReplaying) return;
            _currentRunEvents.Add(new ReplayInputEvent
            {
                TimeMs = timeMs,
                ActionType = InputActionType.JudgeInput,
                JudgeResult = result
            });
        }

        public bool PrepareReplay(int failBeatIndex, double msPerBeat, out int replayStartBeat, out int replayEndBeat)
        {
            replayStartBeat = Mathf.Max(0, failBeatIndex - ReplayBeatWindow);
            replayEndBeat = failBeatIndex;

            if (replayStartBeat >= replayEndBeat) return false;

            double replayStartMs = replayStartBeat * msPerBeat;
            double replayEndMs = replayEndBeat * msPerBeat;

            _replayQueue.Clear();
            foreach (var ev in _currentRunEvents)
            {
                if (ev.TimeMs >= replayStartMs && ev.TimeMs <= replayEndMs)
                {
                    var adjusted = ev;
                    adjusted.TimeMs -= replayStartMs;
                    _replayQueue.Add(adjusted);
                }
            }

            _replayQueue.Sort((a, b) => a.TimeMs.CompareTo(b.TimeMs));
            return true;
        }

        public void BeginReplay()
        {
            _isReplaying = true;
            _replayEventIndex = 0;
            _replayStartTimeMs = DateTime.Now.Ticks / TimeSpan.TicksPerMillisecond;
        }

        public List<ReplayInputEvent> TickReplay(double currentReplayTimeMs)
        {
            var fired = new List<ReplayInputEvent>();

            if (!_isReplaying) return fired;

            while (_replayEventIndex < _replayQueue.Count)
            {
                var ev = _replayQueue[_replayEventIndex];
                if (ev.TimeMs <= currentReplayTimeMs)
                {
                    fired.Add(ev);
                    _replayEventIndex++;
                }
                else break;
            }

            return fired;
        }

        public void EndReplay()
        {
            if (!_isReplaying) return;

            _isReplaying = false;
            TrimEventsAfterReplay();
            OnReplayEnd?.Invoke();
        }

        private void TrimEventsAfterReplay()
        {
            _currentRunEvents.Clear();
        }

        public void ClearRun()
        {
            _currentRunEvents.Clear();
            _replayQueue.Clear();
            _isReplaying = false;
        }

        public int GetCurrentRunEventCount()
        {
            return _currentRunEvents.Count;
        }
    }
}
