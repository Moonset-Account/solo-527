using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using SpaceCourier.Core;
using SpaceCourier.Data;
using SpaceCourier.DataModule;
using SpaceCourier.Gameplay;

namespace SpaceCourier.SaveSystem
{
    public class PlayRecorder : MonoBehaviour, IModule
    {
        public ModuleType Type => ModuleType.PlayRecorder;

        private DataManager dataManager;
        private TurnManager turnManager;
        private FuelManager fuelManager;
        private ReputationManager reputationManager;
        private SaveManager saveManager;

        private PlayRecord currentSession;
        private bool isRecording = false;
        private float sessionStartTime;

        public event Action<PlayRecord> OnSessionEnded;
        public event Action OnPlayRecordSaved;

        public PlayRecord CurrentSession => currentSession;
        public bool IsRecording => isRecording;

        public void Initialize()
        {
            dataManager = GameManager.Instance?.GetModule<DataManager>(ModuleType.DataManager);
            turnManager = GameManager.Instance?.GetModule<TurnManager>(ModuleType.TurnManager);
            fuelManager = GameManager.Instance?.GetModule<FuelManager>(ModuleType.FuelManager);
            reputationManager = GameManager.Instance?.GetModule<ReputationManager>(ModuleType.ReputationManager);
            saveManager = GameManager.Instance?.GetModule<SaveManager>(ModuleType.SaveManager);

            EventBus.Subscribe<GameEvents.CriticalChoiceMade>(OnCriticalChoiceMade);

            Debug.Log("[PlayRecorder] Initialized.");
        }

        private void OnCriticalChoiceMade(GameEvents.CriticalChoiceMade e)
        {
            if (!isRecording || currentSession == null) return;
            RecordCriticalChoice(
                e.ChoiceType,
                e.ChoiceValue,
                e.TurnNumber,
                e.FuelAtChoice,
                e.ReputationAtChoice,
                e.OutcomeNote
            );
        }

        public void Shutdown()
        {
            EventBus.Unsubscribe<GameEvents.CriticalChoiceMade>(OnCriticalChoiceMade);
            SavePlayRecord();
            isRecording = false;
            Debug.Log("[PlayRecorder] Shutdown.");
        }

        public void StartSession(int levelId)
        {
            currentSession = new PlayRecord
            {
                RecordId = Guid.NewGuid().ToString("N"),
                StartTime = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                LevelId = levelId,
                CriticalChoices = new List<CriticalChoiceLog>()
            };

            sessionStartTime = Time.realtimeSinceStartup;
            isRecording = true;

            Debug.Log($"[PlayRecorder] Session started: Level {levelId}");
        }

        public void RecordCriticalChoice(string choiceType, string choiceValue, int turnNumber,
            int fuelAtChoice, int reputationAtChoice, string outcomeNote)
        {
            if (!isRecording || currentSession == null) return;

            var log = new CriticalChoiceLog
            {
                ChoiceType = choiceType,
                ChoiceValue = choiceValue,
                TurnNumber = turnNumber,
                FuelAtChoice = fuelAtChoice,
                ReputationAtChoice = reputationAtChoice,
                OutcomeNote = outcomeNote,
                Timestamp = DateTime.Now.ToString("HH:mm:ss")
            };

            currentSession.CriticalChoices.Add(log);
        }

        public void RecordRouteChoice(List<int> route, int fuelCost)
        {
            if (!isRecording || currentSession == null || route == null || route.Count < 2) return;

            RecordCriticalChoice(
                "RouteSelection",
                $"{route[0]}->{route[route.Count - 1]} (Nodes:{route.Count})",
                turnManager?.CurrentTurn ?? 0,
                fuelManager?.CurrentFuel ?? 0,
                reputationManager?.CurrentReputation ?? 0,
                $"FuelCost:{fuelCost}"
            );
        }

        public void RecordEventChoice(int eventId, string eventTitle, string choiceText, string outcome)
        {
            if (!isRecording || currentSession == null) return;

            RecordCriticalChoice(
                $"Event_{eventId}_{eventTitle}",
                choiceText,
                turnManager?.CurrentTurn ?? 0,
                fuelManager?.CurrentFuel ?? 0,
                reputationManager?.CurrentReputation ?? 0,
                outcome
            );
        }

        public void RecordContractAction(int contractId, string action, string detail = "")
        {
            if (!isRecording || currentSession == null) return;

            RecordCriticalChoice(
                $"Contract_{contractId}",
                action,
                turnManager?.CurrentTurn ?? 0,
                fuelManager?.CurrentFuel ?? 0,
                reputationManager?.CurrentReputation ?? 0,
                detail
            );
        }

        public void EndSession(bool isVictory, string reason, int finalScore)
        {
            if (!isRecording || currentSession == null) return;

            currentSession.EndTime = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
            currentSession.PlayTimeSeconds = Time.realtimeSinceStartup - sessionStartTime;
            currentSession.IsVictory = isVictory;
            currentSession.EndReason = reason;
            currentSession.FinalScore = finalScore;

            if (turnManager != null)
            {
                currentSession.TurnsUsed = turnManager.CurrentTurn;
                currentSession.MaxTurns = turnManager.MaxTurns;
            }

            if (dataManager?.RuntimeData != null)
            {
                var runtime = dataManager.RuntimeData;
                currentSession.DeliveriesCompleted = runtime.Player.TotalDeliveries;
                currentSession.DeliveriesFailed = runtime.Player.FailedDeliveries;
                currentSession.EventsTriggered = runtime.EventHistory.Count;
                currentSession.EndingFuel = runtime.Ship.CurrentFuel;
                currentSession.EndingCredits = runtime.Player.Credits;
                currentSession.EndingReputation = runtime.Player.Reputation;
                currentSession.TotalFuelUsed = runtime.Ship.MaxFuel - runtime.Ship.CurrentFuel >= 0
                    ? runtime.Ship.MaxFuel - runtime.Ship.CurrentFuel
                    : runtime.Ship.MaxFuel;
            }

            OnSessionEnded?.Invoke(currentSession);
            Debug.Log($"[PlayRecorder] Session ended. Victory: {isVictory}, Score: {finalScore}, Time: {currentSession.PlayTimeSeconds:F1}s");

            SavePlayRecord();
            isRecording = false;
        }

        public bool SavePlayRecord()
        {
            if (currentSession == null) return false;

            try
            {
                string dir = GetRecordsDirectory();
                string fileName = $"record_{currentSession.StartTime.Replace(":", "-").Replace(" ", "_")}_{currentSession.RecordId.Substring(0, 6)}.json";
                string path = Path.Combine(dir, fileName);

                string json = JsonUtility.ToJson(currentSession, true);
                File.WriteAllText(path, json);

                OnPlayRecordSaved?.Invoke();
                Debug.Log($"[PlayRecorder] Record saved: {path}");
                return true;
            }
            catch (Exception e)
            {
                Debug.LogError($"[PlayRecorder] Failed to save record: {e.Message}");
                return false;
            }
        }

        public string ExportPlayDataToFile()
        {
            if (currentSession == null)
            {
                return LoadLatestRecord() ?? string.Empty;
            }

            try
            {
                string dir = GetExportDirectory();
                string fileName = $"export_{DateTime.Now:yyyyMMdd_HHmmss}.json";
                string path = Path.Combine(dir, fileName);

                var exportData = new
                {
                    exportTime = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                    session = currentSession,
                    summary = BuildSummaryText()
                };

                string json = JsonUtility.ToJson(currentSession, true);
                File.WriteAllText(path, json);

                Debug.Log($"[PlayRecorder] Data exported to: {path}");
                return path;
            }
            catch (Exception e)
            {
                Debug.LogError($"[PlayRecorder] Export failed: {e.Message}");
                return string.Empty;
            }
        }

        private string BuildSummaryText()
        {
            if (currentSession == null) return string.Empty;

            var lines = new List<string>
            {
                "=== 太空快递 - 试玩数据总结 ===",
                $"关卡 ID: {currentSession.LevelId}",
                $"开始时间: {currentSession.StartTime}",
                $"结束时间: {currentSession.EndTime}",
                $"游戏时长: {FormatPlayTime(currentSession.PlayTimeSeconds)}",
                $"任务结果: {(currentSession.IsVictory ? "成功" : "失败")}",
                $"结束原因: {currentSession.EndReason}",
                $"最终得分: {currentSession.FinalScore}",
                $"回合数: {currentSession.TurnsUsed} / {currentSession.MaxTurns}",
                $"完成配送: {currentSession.DeliveriesCompleted}",
                $"失败配送: {currentSession.DeliveriesFailed}",
                $"触发事件: {currentSession.EventsTriggered}",
                $"消耗燃料: {currentSession.TotalFuelUsed}",
                $"剩余燃料: {currentSession.EndingFuel}",
                $"剩余星币: {currentSession.EndingCredits}",
                $"最终声望: {currentSession.EndingReputation}",
                $"关键选择数: {currentSession.CriticalChoices.Count}",
                "",
                "=== 关键选择记录 ==="
            };

            int idx = 1;
            foreach (var choice in currentSession.CriticalChoices)
            {
                lines.Add($"  [{idx}] 回合{choice.TurnNumber}: {choice.ChoiceType}");
                lines.Add($"       选择: {choice.ChoiceValue}");
                if (!string.IsNullOrEmpty(choice.OutcomeNote))
                    lines.Add($"       结果: {choice.OutcomeNote}");
                lines.Add($"       燃料:{choice.FuelAtChoice} 声望:{choice.ReputationAtChoice} @{choice.Timestamp}");
                idx++;
            }

            return string.Join("\n", lines);
        }

        public string FormatPlayTime()
        {
            float seconds = currentSession != null ? currentSession.PlayTimeSeconds : 0f;
            return FormatPlayTime(seconds);
        }

        public static string FormatPlayTime(float totalSeconds)
        {
            TimeSpan t = TimeSpan.FromSeconds(totalSeconds);
            if (t.TotalMinutes >= 60)
            {
                return $"{(int)t.TotalHours}h {t.Minutes}m {t.Seconds}s";
            }
            if (t.TotalSeconds >= 60)
            {
                return $"{t.Minutes}m {t.Seconds}s";
            }
            return $"{t.Seconds}s";
        }

        public List<PlayRecord> LoadAllRecords()
        {
            var records = new List<PlayRecord>();
            string dir = GetRecordsDirectory();
            if (!Directory.Exists(dir)) return records;

            var files = Directory.GetFiles(dir, "*.json");
            foreach (var file in files)
            {
                try
                {
                    string json = File.ReadAllText(file);
                    var record = JsonUtility.FromJson<PlayRecord>(json);
                    if (record != null) records.Add(record);
                }
                catch { /* skip bad files */ }
            }
            return records;
        }

        private string LoadLatestRecord()
        {
            var all = LoadAllRecords();
            if (all.Count == 0) return null;
            return JsonUtility.ToJson(all[all.Count - 1], true);
        }

        private string GetRecordsDirectory()
        {
            string dir = Path.Combine(Application.persistentDataPath, "PlayRecords");
            if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
            return dir;
        }

        private string GetExportDirectory()
        {
            string dir = Path.Combine(Application.persistentDataPath, "Exports");
            if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
            return dir;
        }

        public int GetTotalSessionsPlayed()
        {
            return LoadAllRecords().Count;
        }

        public int GetTotalFailures()
        {
            var all = LoadAllRecords();
            int count = 0;
            foreach (var r in all) if (!r.IsVictory) count++;
            return count;
        }

        public int GetTotalVictories()
        {
            var all = LoadAllRecords();
            int count = 0;
            foreach (var r in all) if (r.IsVictory) count++;
            return count;
        }

        public int GetHighestScore()
        {
            var all = LoadAllRecords();
            int max = 0;
            foreach (var r in all) if (r.FinalScore > max) max = r.FinalScore;
            return max;
        }

        public float GetAveragePlayTime()
        {
            var all = LoadAllRecords();
            if (all.Count == 0) return 0f;
            float total = 0;
            foreach (var r in all) total += r.PlayTimeSeconds;
            return total / all.Count;
        }

        public List<CriticalChoiceLog> GetCurrentCriticalChoices()
        {
            if (dataManager?.RuntimeData == null) return new List<CriticalChoiceLog>();

            var result = new List<CriticalChoiceLog>();
            foreach (var c in dataManager.RuntimeData.CriticalChoices)
            {
                result.Add(new CriticalChoiceLog
                {
                    ChoiceType = c.ChoiceType,
                    ChoiceValue = c.ChoiceValue,
                    TurnNumber = c.TurnNumber,
                    FuelAtChoice = c.FuelAtChoice,
                    ReputationAtChoice = c.ReputationAtChoice,
                    OutcomeNote = c.OutcomeNote,
                    Timestamp = DateTime.Now.ToString("HH:mm:ss")
                });
            }
            return result;
        }
    }
}
