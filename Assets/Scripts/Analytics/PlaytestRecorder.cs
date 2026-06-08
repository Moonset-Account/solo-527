using UnityEngine;
using System;
using System.Collections.Generic;
using ShadowPlatformer.Core;

namespace ShadowPlatformer.Analytics
{
    [Serializable]
    public class PlaytestEvent
    {
        public string eventType;
        public float timestamp;
        public string levelId;
        public Dictionary<string, string> data;
    }

    [Serializable]
    public class PlaytestSession
    {
        public string sessionId;
        public string buildVersion;
        public float sessionStartTime;
        public List<PlaytestEvent> events = new List<PlaytestEvent>();
    }

    public class PlaytestRecorder : MonoBehaviour
    {
        public static PlaytestRecorder Instance { get; private set; }

        public float autoFlushInterval = 30f;
        public int maxEventsBeforeFlush = 100;

        private PlaytestSession _session;
        private float _sessionTime;
        private float _lastFlushTime;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            StartSession();
        }

        private void OnEnable()
        {
            EventBus.Instance.OnPlayerDeath += RecordPlayerDeath;
            EventBus.Instance.OnLevelStarted += RecordLevelStart;
            EventBus.Instance.OnLevelCompleted += RecordLevelComplete;
            EventBus.Instance.OnLightSwitched += RecordLightSwitch;
            EventBus.Instance.OnCheckpointReached += RecordCheckpoint;
        }

        private void OnDisable()
        {
            EventBus.Instance.OnPlayerDeath -= RecordPlayerDeath;
            EventBus.Instance.OnLevelStarted -= RecordLevelStart;
            EventBus.Instance.OnLevelCompleted -= RecordLevelComplete;
            EventBus.Instance.OnLightSwitched -= RecordLightSwitch;
            EventBus.Instance.OnCheckpointReached -= RecordCheckpoint;
        }

        private void Update()
        {
            _sessionTime += Time.unscaledDeltaTime;

            if (_sessionTime - _lastFlushTime >= autoFlushInterval ||
                _session.events.Count >= maxEventsBeforeFlush)
            {
                Flush();
            }
        }

        private void StartSession()
        {
            _session = new PlaytestSession
            {
                sessionId = Guid.NewGuid().ToString(),
                buildVersion = Application.version,
                sessionStartTime = Time.realtimeSinceStartup
            };
            _sessionTime = 0f;
            _lastFlushTime = 0f;
        }

        public void RecordEvent(string eventType, string levelId = null, Dictionary<string, string> data = null)
        {
            var evt = new PlaytestEvent
            {
                eventType = eventType,
                timestamp = _sessionTime,
                levelId = levelId ?? Level.LevelManager.Instance?.CurrentLevel?.levelId ?? "",
                data = data ?? new Dictionary<string, string>()
            };
            _session.events.Add(evt);
        }

        private void RecordPlayerDeath()
        {
            RecordEvent("PlayerDeath", data: new Dictionary<string, string>
            {
                { "deaths", Level.LevelManager.Instance?.CurrentDeaths.ToString() ?? "0" }
            });
        }

        private void RecordLevelStart(string levelId)
        {
            RecordEvent("LevelStart", levelId);
        }

        private void RecordLevelComplete(string levelId)
        {
            RecordEvent("LevelComplete", levelId, new Dictionary<string, string>
            {
                { "time", Level.LevelManager.Instance?.LevelTimer.ToString("F2") ?? "0" },
                { "deaths", Level.LevelManager.Instance?.CurrentDeaths.ToString() ?? "0" }
            });
        }

        private void RecordLightSwitch()
        {
            RecordEvent("LightSwitch", data: new Dictionary<string, string>
            {
                { "direction", Light.LightManager.Instance?.currentDirection.ToString() ?? "Unknown" }
            });
        }

        private void RecordCheckpoint()
        {
            RecordEvent("CheckpointReached");
        }

        public void Flush()
        {
            _lastFlushTime = _sessionTime;
            string json = JsonUtility.ToJson(_session);
            PlayerPrefs.SetString($"Playtest_{_session.sessionId}", json);
            PlayerPrefs.Save();
        }

        private void OnApplicationQuit()
        {
            RecordEvent("SessionEnd");
            Flush();
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
        }
    }
}
