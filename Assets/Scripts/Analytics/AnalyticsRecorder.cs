using System.Collections.Generic;
using UnityEngine;

namespace InkMountainBridge
{
    public class AnalyticsRecorder : MonoBehaviour
    {
        public TrialStatsConfig trialStatsConfig;
        public List<SessionRecord> sessionRecords = new List<SessionRecord>();
        public List<InputRecord> inputLog = new List<InputRecord>();
        public float autoSubmitTimer;

        private float _autoSubmitElapsed;

        private void OnEnable()
        {
            GameEvents.OnInputRecorded += RecordInput;
            GameEvents.OnLevelCompleted += HandleLevelCompleted;
            GameEvents.OnLevelFailed += HandleLevelFailed;
        }

        private void OnDisable()
        {
            GameEvents.OnInputRecorded -= RecordInput;
            GameEvents.OnLevelCompleted -= HandleLevelCompleted;
            GameEvents.OnLevelFailed -= HandleLevelFailed;
        }

        private void Update()
        {
            if (trialStatsConfig == null) return;
            _autoSubmitElapsed += Time.deltaTime;
            if (_autoSubmitElapsed >= trialStatsConfig.autoSubmitInterval)
            {
                _autoSubmitElapsed = 0f;
                SubmitRecords();
            }
        }

        private void HandleLevelCompleted(int levelId)
        {
        }

        private void HandleLevelFailed(string reason)
        {
            RecordFailure(0, reason, Time.time);
        }

        public void RecordInput(InputRecord record)
        {
            if (trialStatsConfig != null && !trialStatsConfig.recordInputEvents) return;
            inputLog.Add(record);
        }

        public void RecordLevelResult(LevelResult result)
        {
            if (trialStatsConfig != null && !trialStatsConfig.recordSettlementData) return;
            var record = new SessionRecord
            {
                sessionId = System.Guid.NewGuid().ToString(),
                levelId = result.levelId,
                result = result,
                endTime = System.DateTime.UtcNow.ToString("o"),
                platform = Application.platform.ToString()
            };
            sessionRecords.Add(record);
        }

        public void RecordFailure(int levelId, string reason, float timestamp)
        {
            if (trialStatsConfig != null && !trialStatsConfig.recordFailureDetails) return;
            var failure = new FailureRecord
            {
                timestamp = timestamp,
                levelId = levelId,
                reason = reason
            };
            if (sessionRecords.Count > 0)
            {
                var last = sessionRecords[sessionRecords.Count - 1];
                last.failureReasons.Add(failure);
            }
        }

        public void RecordSettlement(int levelId, int score, float time, int materialsUsed)
        {
            if (trialStatsConfig != null && !trialStatsConfig.recordSettlementData) return;
            var record = new SessionRecord
            {
                sessionId = System.Guid.NewGuid().ToString(),
                levelId = levelId,
                result = new LevelResult
                {
                    levelId = levelId,
                    score = score,
                    completionTime = time,
                    materialsUsed = materialsUsed
                },
                startTime = System.DateTime.UtcNow.ToString("o"),
                endTime = System.DateTime.UtcNow.ToString("o"),
                platform = Application.platform.ToString()
            };
            sessionRecords.Add(record);
        }

        public void SubmitRecords()
        {
            if (trialStatsConfig == null) return;
            if (string.IsNullOrEmpty(trialStatsConfig.analyticsServerUrl)) return;
            string json = ExportToJson();
            inputLog.Clear();
        }

        public string ExportToJson()
        {
            var wrapper = new AnalyticsExportWrapper
            {
                records = sessionRecords,
                inputs = inputLog
            };
            return JsonUtility.ToJson(wrapper, true);
        }

        [System.Serializable]
        private class AnalyticsExportWrapper
        {
            public List<SessionRecord> records;
            public List<InputRecord> inputs;
        }
    }
}
