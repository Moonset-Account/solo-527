using UnityEngine;
using System;
using System.Collections.Generic;
using ShadowPlatformer.Core;

namespace ShadowPlatformer.Analytics
{
    [Serializable]
    public class StringStringPair
    {
        public string key;
        public string value;
    }

    [Serializable]
    public class PlaytestEvent
    {
        public string eventType;
        public float timestamp;
        public string levelId;
        public List<StringStringPair> data = new List<StringStringPair>();

        public void SetData(string key, string value)
        {
            var pair = data.Find(p => p.key == key);
            if (pair != null)
                pair.value = value;
            else
                data.Add(new StringStringPair { key = key, value = value });
        }

        public string GetData(string key)
        {
            var pair = data.Find(p => p.key == key);
            return pair?.value;
        }
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

        public void RecordEvent(string eventType, string levelId = null, List<StringStringPair> data = null)
        {
            var evt = new PlaytestEvent
            {
                eventType = eventType,
                timestamp = _sessionTime,
                levelId = levelId ?? Level.LevelManager.Instance?.CurrentLevel?.levelId ?? ""
            };
            if (data != null)
                evt.data = data;
            _session.events.Add(evt);
        }

        private void RecordPlayerDeath()
        {
            var data = new List<StringStringPair>();
            data.Add(new StringStringPair { key = "deaths", value = Level.LevelManager.Instance?.CurrentDeaths.ToString() ?? "0" });
            RecordEvent("PlayerDeath", data: data);
        }

        private void RecordLevelStart(string levelId)
        {
            RecordEvent("LevelStart", levelId);
        }

        private void RecordLevelComplete(string levelId)
        {
            var data = new List<StringStringPair>();
            data.Add(new StringStringPair { key = "time", value = Level.LevelManager.Instance?.LevelTimer.ToString("F2") ?? "0" });
            data.Add(new StringStringPair { key = "deaths", value = Level.LevelManager.Instance?.CurrentDeaths.ToString() ?? "0" });
            RecordEvent("LevelComplete", levelId, data);
        }

        private void RecordLightSwitch()
        {
            var data = new List<StringStringPair>();
            data.Add(new StringStringPair { key = "direction", value = Light.LightManager.Instance?.currentDirection.ToString() ?? "Unknown" });
            RecordEvent("LightSwitch", data: data);
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
