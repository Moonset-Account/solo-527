using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using DecorMatch3.Utils;
using DecorMatch3.Core.Events;
using Newtonsoft.Json;

namespace DecorMatch3.Core
{
    [System.Serializable]
    public class AnalyticsEventData
    {
        public string EventName;
        public long Timestamp;
        public string SessionId;
        public Dictionary<string, object> Parameters = new Dictionary<string, object>();
    }

    [System.Serializable]
    public class PlaythroughRecord
    {
        public string SessionId;
        public long StartTime;
        public long EndTime;
        public int LevelsPlayed;
        public int LevelsCompleted;
        public int LevelsFailed;
        public int OrdersCompleted;
        public int TotalMaterialsCollected;
        public List<LevelPlaythroughRecord> LevelRecords = new List<LevelPlaythroughRecord>();
        public List<DecorationChoiceRecord> DecorationChoices = new List<DecorationChoiceRecord>();
    }

    [System.Serializable]
    public class LevelPlaythroughRecord
    {
        public int LevelId;
        public long StartTime;
        public long EndTime;
        public float DurationSeconds;
        public bool IsSuccess;
        public int Score;
        public int Stars;
        public int MovesUsed;
        public int FailCount;
        public Dictionary<int, int> MaterialsCollected = new Dictionary<int, int>();
        public string FailReason;
    }

    [System.Serializable]
    public class DecorationChoiceRecord
    {
        public int OrderId;
        public string Category;
        public int ChoiceId;
        public string ChoiceValue;
        public long Timestamp;
        public int MatchingPreferenceScore;
    }

    public class AnalyticsSystem : Singleton<AnalyticsSystem>
    {
        [SerializeField] private int _maxEventsBeforeFlush = 100;
        [SerializeField] private bool _enableLocalLogging = true;
        [SerializeField] private string _localLogFileName = "analytics_log.json";

        private string _currentSessionId;
        private DateTime _sessionStartTime;
        private readonly List<AnalyticsEventData> _pendingEvents = new List<AnalyticsEventData>();
        private PlaythroughRecord _currentPlaythrough;

        private LevelPlaythroughRecord _currentLevelRecord;
        private readonly Dictionary<int, LevelPlaythroughRecord> _levelRecordLookup = new Dictionary<int, LevelPlaythroughRecord>();

        public string CurrentSessionId => _currentSessionId;
        public PlaythroughRecord CurrentPlaythrough => _currentPlaythrough;
        public IReadOnlyList<AnalyticsEventData> PendingEvents => _pendingEvents;

        protected override void Awake()
        {
            base.Awake();
            StartNewSession();
        }

        private void StartNewSession()
        {
            _currentSessionId = Guid.NewGuid().ToString("N").Substring(0, 16);
            _sessionStartTime = DateTime.UtcNow;

            _currentPlaythrough = new PlaythroughRecord
            {
                SessionId = _currentSessionId,
                StartTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
            };

            LogEvent("session_start", new Dictionary<string, object>
            {
                { "session_id", _currentSessionId },
                { "device_model", SystemInfo.deviceModel },
                { "os", SystemInfo.operatingSystem },
                { "graphics", SystemInfo.graphicsDeviceName }
            });
        }

        public void LogEvent(string eventName, Dictionary<string, object> parameters = null)
        {
            AnalyticsEventData eventData = new AnalyticsEventData
            {
                EventName = eventName,
                Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                SessionId = _currentSessionId,
                Parameters = parameters ?? new Dictionary<string, object>()
            };

            _pendingEvents.Add(eventData);

            if (_enableLocalLogging)
            {
                Debug.Log($"[Analytics] {eventName} | {JsonConvert.SerializeObject(eventData.Parameters)}");
            }

            EventBus.Publish(new AnalyticsEventLogged
            {
                EventName = eventName,
                Parameters = eventData.Parameters,
                Timestamp = DateTime.Now
            });

            if (_pendingEvents.Count >= _maxEventsBeforeFlush)
            {
                FlushEvents();
            }
        }

        public void FlushEvents()
        {
            if (_pendingEvents.Count == 0) return;

            try
            {
                string filePath = Path.Combine(Application.persistentDataPath, _localLogFileName);
                string existingJson = "";

                if (File.Exists(filePath))
                {
                    existingJson = File.ReadAllText(filePath);
                }

                List<AnalyticsEventData> allEvents = new List<AnalyticsEventData>();
                if (!string.IsNullOrEmpty(existingJson))
                {
                    try
                    {
                        allEvents = JsonConvert.DeserializeObject<List<AnalyticsEventData>>(existingJson) ?? new List<AnalyticsEventData>();
                    }
                    catch
                    {
                        allEvents = new List<AnalyticsEventData>();
                    }
                }

                allEvents.AddRange(_pendingEvents);

                File.WriteAllText(filePath, JsonConvert.SerializeObject(allEvents, Formatting.Indented));
                Debug.Log($"[Analytics] Flushed {_pendingEvents.Count} events to log");

                _pendingEvents.Clear();
            }
            catch (Exception e)
            {
                Debug.LogError($"[Analytics] Failed to flush events: {e.Message}");
            }
        }

        public void StartLevelPlaythrough(int levelId)
        {
            _currentLevelRecord = new LevelPlaythroughRecord
            {
                LevelId = levelId,
                StartTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                FailCount = SaveSystem.Instance != null ?
                    (SaveSystem.Instance.CurrentSave.LevelFailCounts.ContainsKey(levelId) ?
                     SaveSystem.Instance.CurrentSave.LevelFailCounts[levelId] : 0) : 0
            };

            _levelRecordLookup[levelId] = _currentLevelRecord;
            _currentPlaythrough.LevelsPlayed++;

            LogEvent("level_start", new Dictionary<string, object>
            {
                { "level_id", levelId },
                { "prior_fail_count", _currentLevelRecord.FailCount }
            });

            EventBus.Publish(new LevelStartedEvent
            {
                LevelId = levelId,
                StartTime = DateTime.Now
            });
        }

        public void RecordLevelFail(int levelId, string reason)
        {
            LevelPlaythroughRecord record = GetOrCreateLevelRecord(levelId);
            record.EndTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            record.DurationSeconds = (record.EndTime - record.StartTime) / 1000f;
            record.IsSuccess = false;
            record.FailReason = reason;
            record.FailCount++;

            _currentPlaythrough.LevelRecords.Add(record);
            _currentPlaythrough.LevelsFailed++;

            SaveSystem.Instance?.RecordLevelFail(levelId);

            LogEvent("level_fail", new Dictionary<string, object>
            {
                { "level_id", levelId },
                { "fail_reason", reason },
                { "duration_seconds", record.DurationSeconds },
                { "fail_count", record.FailCount }
            });

            EventBus.Publish(new LevelFailedEvent
            {
                LevelId = levelId,
                FailCount = record.FailCount,
                DurationSeconds = record.DurationSeconds,
                FailReason = reason
            });

            _currentLevelRecord = null;
        }

        public void RecordLevelComplete(int levelId, int score, int stars, int movesUsed, Dictionary<int, int> materials)
        {
            LevelPlaythroughRecord record = GetOrCreateLevelRecord(levelId);
            record.EndTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            record.DurationSeconds = (record.EndTime - record.StartTime);
            record.IsSuccess = true;
            record.Score = score;
            record.Stars = stars;
            record.MovesUsed = movesUsed;
            record.MaterialsCollected = materials ?? new Dictionary<int, int>();

            _currentPlaythrough.LevelRecords.Add(record);
            _currentPlaythrough.LevelsCompleted++;

            int totalMaterials = 0;
            foreach (var kvp in record.MaterialsCollected)
            {
                totalMaterials += kvp.Value;
            }
            _currentPlaythrough.TotalMaterialsCollected += totalMaterials;

            SaveSystem.Instance?.RecordLevelResult(levelId, stars, score);

            LogEvent("level_complete", new Dictionary<string, object>
            {
                { "level_id", levelId },
                { "score", score },
                { "stars", stars },
                { "moves_used", movesUsed },
                { "duration_seconds", record.DurationSeconds },
                { "materials_collected_count", totalMaterials }
            });

            EventBus.Publish(new LevelCompletedEvent
            {
                LevelId = levelId,
                Score = score,
                Stars = stars,
                DurationSeconds = record.DurationSeconds,
                MovesUsed = movesUsed,
                MaterialsCollected = record.MaterialsCollected,
                IsSuccess = true
            });

            _currentLevelRecord = null;
        }

        public void RecordDecorationChoice(int orderId, string category, int choiceId, string choiceValue, int preferenceScore = 0)
        {
            DecorationChoiceRecord choiceRecord = new DecorationChoiceRecord
            {
                OrderId = orderId,
                Category = category,
                ChoiceId = choiceId,
                ChoiceValue = choiceValue,
                Timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                MatchingPreferenceScore = preferenceScore
            };

            _currentPlaythrough.DecorationChoices.Add(choiceRecord);

            SaveSystem.Instance?.RecordOrderDecorationChoice(orderId, category, choiceValue);

            LogEvent("decoration_choice", new Dictionary<string, object>
            {
                { "order_id", orderId },
                { "category", category },
                { "choice_id", choiceId },
                { "choice_value", choiceValue },
                { "preference_score", preferenceScore }
            });

            EventBus.Publish(new DecorationChoiceMadeEvent
            {
                OrderId = orderId,
                ChoiceCategory = category,
                ChoiceId = choiceId,
                ChoiceValue = choiceValue,
                Timestamp = DateTime.Now
            });
        }

        public void RecordOrderAccept(int orderId, string customerId)
        {
            SaveSystem.Instance?.AddActiveOrder(orderId);

            LogEvent("order_accept", new Dictionary<string, object>
            {
                { "order_id", orderId },
                { "customer_id", customerId }
            });

            EventBus.Publish(new OrderAcceptedEvent
            {
                OrderId = orderId,
                CustomerId = customerId
            });
        }

        public void RecordOrderComplete(int orderId, string customerId, int finalScore, int satisfaction, Dictionary<string, int> categoryScores)
        {
            _currentPlaythrough.OrdersCompleted++;

            SaveSystem.Instance?.RecordOrderCompletion(orderId, finalScore);

            LogEvent("order_complete", new Dictionary<string, object>
            {
                { "order_id", orderId },
                { "customer_id", customerId },
                { "final_score", finalScore },
                { "satisfaction", satisfaction }
            });

            EventBus.Publish(new OrderCompletedEvent
            {
                OrderId = orderId,
                CustomerId = customerId,
                FinalScore = finalScore,
                CustomerSatisfaction = satisfaction,
                CategoryScores = categoryScores ?? new Dictionary<string, int>(),
                CompletedTime = DateTime.Now
            });
        }

        public void RecordAchievementUnlocked(string achievementId, string achievementName)
        {
            SaveSystem.Instance?.UnlockAchievement(achievementId);

            LogEvent("achievement_unlocked", new Dictionary<string, object>
            {
                { "achievement_id", achievementId },
                { "achievement_name", achievementName }
            });

            EventBus.Publish(new AchievementUnlockedEvent
            {
                AchievementId = achievementId,
                AchievementName = achievementName,
                UnlockTime = DateTime.Now
            });
        }

        public void RecordDailyChallengeStart(string challengeId)
        {
            LogEvent("daily_challenge_start", new Dictionary<string, object>
            {
                { "challenge_id", challengeId },
                { "date", DateTime.UtcNow.ToString("yyyy-MM-dd") }
            });

            EventBus.Publish(new DailyChallengeStartedEvent
            {
                ChallengeId = challengeId,
                Date = DateTime.Now
            });
        }

        public void RecordDailyChallengeComplete(string challengeId, int score, bool success)
        {
            string dateKey = DateTime.UtcNow.ToString("yyyy-MM-dd");
            SaveSystem.Instance?.MarkDailyChallengeCompleted(dateKey + "_" + challengeId);

            LogEvent("daily_challenge_complete", new Dictionary<string, object>
            {
                { "challenge_id", challengeId },
                { "score", score },
                { "success", success }
            });

            EventBus.Publish(new DailyChallengeCompletedEvent
            {
                ChallengeId = challengeId,
                Score = score,
                IsSuccess = success
            });
        }

        public void RecordMatchDetected(int matchCount, int tileType, int comboLevel)
        {
            if (_currentLevelRecord != null)
            {
                LogEvent("match_detected", new Dictionary<string, object>
                {
                    { "level_id", _currentLevelRecord.LevelId },
                    { "match_count", matchCount },
                    { "tile_type", tileType },
                    { "combo_level", comboLevel }
                });

                EventBus.Publish(new MatchDetectedEvent
                {
                    MatchCount = matchCount,
                    TileType = tileType,
                    ComboLevel = comboLevel
                });
            }
        }

        public void RecordTileSwap(int fromX, int fromY, int toX, int toY, bool isValid)
        {
            if (_currentLevelRecord != null)
            {
                EventBus.Publish(new TileSwappedEvent
                {
                    FromX = fromX,
                    FromY = fromY,
                    ToX = toX,
                    ToY = toY,
                    IsValid = isValid
                });
            }
        }

        public void RecordMaterialsCollected(Dictionary<int, int> materials)
        {
            if (materials == null || materials.Count == 0) return;

            foreach (var kvp in materials)
            {
                SaveSystem.Instance?.AddMaterial(kvp.Key, kvp.Value);
            }

            EventBus.Publish(new MaterialsCollectedEvent
            {
                Materials = materials
            });
        }

        public void EndPlaythrough()
        {
            _currentPlaythrough.EndTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

            LogEvent("session_end", new Dictionary<string, object>
            {
                { "session_id", _currentSessionId },
                { "levels_played", _currentPlaythrough.LevelsPlayed },
                { "levels_completed", _currentPlaythrough.LevelsCompleted },
                { "orders_completed", _currentPlaythrough.OrdersCompleted },
                { "total_materials", _currentPlaythrough.TotalMaterialsCollected }
            });

            SavePlaythroughRecord();
            FlushEvents();
        }

        private void SavePlaythroughRecord()
        {
            try
            {
                string dir = Path.Combine(Application.persistentDataPath, "Playthroughs");
                if (!Directory.Exists(dir))
                {
                    Directory.CreateDirectory(dir);
                }

                string fileName = $"playthrough_{_currentSessionId}.json";
                string filePath = Path.Combine(dir, fileName);
                File.WriteAllText(filePath, JsonConvert.SerializeObject(_currentPlaythrough, Formatting.Indented));

                Debug.Log($"[Analytics] Playthrough saved: {fileName}");
            }
            catch (Exception e)
            {
                Debug.LogError($"[Analytics] Failed to save playthrough: {e.Message}");
            }
        }

        private LevelPlaythroughRecord GetOrCreateLevelRecord(int levelId)
        {
            if (_currentLevelRecord != null && _currentLevelRecord.LevelId == levelId)
            {
                return _currentLevelRecord;
            }

            if (_levelRecordLookup.TryGetValue(levelId, out LevelPlaythroughRecord existing))
            {
                return existing;
            }

            LevelPlaythroughRecord newRecord = new LevelPlaythroughRecord
            {
                LevelId = levelId,
                StartTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
            };
            _levelRecordLookup[levelId] = newRecord;
            return newRecord;
        }

        public List<LevelPlaythroughRecord> GetAllLevelRecordsForLevel(int levelId)
        {
            List<LevelPlaythroughRecord> result = new List<LevelPlaythroughRecord>();
            string dir = Path.Combine(Application.persistentDataPath, "Playthroughs");

            if (!Directory.Exists(dir)) return result;

            foreach (string file in Directory.GetFiles(dir, "*.json"))
            {
                try
                {
                    string json = File.ReadAllText(file);
                    PlaythroughRecord record = JsonConvert.DeserializeObject<PlaythroughRecord>(json);
                    if (record != null)
                    {
                        result.AddRange(record.LevelRecords.FindAll(r => r.LevelId == levelId));
                    }
                }
                catch
                {
                    continue;
                }
            }

            return result;
        }

        private void OnApplicationQuit()
        {
            EndPlaythrough();
        }
    }
}
