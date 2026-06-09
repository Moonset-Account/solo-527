using UnityEngine;
using System;
using System.Collections.Generic;
using LakeSailing.Core;
using LakeSailing.Data;

namespace LakeSailing.Gameplay
{
    public enum TaskStatus
    {
        Inactive,
        Available,
        InProgress,
        Completed,
        Failed
    }

    [Serializable]
    public class PhotoTaskState
    {
        public string taskId;
        public TaskStatus status;
        public int attemptsRemaining = 3;
        public int bestScore;
        public bool photoTaken;
        public float photoQuality;
        public float distanceToTarget;
        public float weatherModifier;
        public float angleModifier;
        public int finalScore;
    }

    public class TaskSystem : PersistentSingleton<TaskSystem>
    {
        [SerializeField] private List<PhotoTaskState> activeTasks = new List<PhotoTaskState>();
        [SerializeField] private int totalScore;
        [SerializeField] private int photosTaken;
        [SerializeField] private float timeRemaining;
        [SerializeField] private LevelConfigData currentLevelConfig;

        public event Action<PhotoTaskState> OnTaskStatusChanged;
        public event Action<PhotoTaskState, int> OnTaskCompleted;
        public event Action<int> OnTotalScoreChanged;
        public event Action<float> OnTimeRemainingChanged;
        public event Action<int, int> OnLevelFinished;

        public List<PhotoTaskState> ActiveTasks => activeTasks;
        public int TotalScore => totalScore;
        public int PhotosTaken => photosTaken;
        public float TimeRemaining => timeRemaining;
        public LevelConfigData CurrentLevelConfig => currentLevelConfig;

        public void Initialize(LevelConfigData levelConfig)
        {
            currentLevelConfig = levelConfig;
            timeRemaining = levelConfig.timeLimitSeconds;
            totalScore = 0;
            photosTaken = 0;
            activeTasks.Clear();

            if (levelConfig.photoTasks != null)
            {
                foreach (var task in levelConfig.photoTasks)
                {
                    activeTasks.Add(new PhotoTaskState
                    {
                        taskId = task.taskId,
                        status = TaskStatus.Available,
                        attemptsRemaining = 3,
                        bestScore = 0,
                        photoTaken = false
                    });
                }
            }

            OnTotalScoreChanged?.Invoke(totalScore);
            OnTimeRemainingChanged?.Invoke(timeRemaining);
        }

        private void Update()
        {
            if (GameManager.Instance == null || GameManager.Instance.CurrentState != GameState.Playing)
                return;

            if (currentLevelConfig == null) return;

            timeRemaining -= Time.deltaTime;
            OnTimeRemainingChanged?.Invoke(timeRemaining);

            if (timeRemaining <= 0)
            {
                FinishLevel(false);
            }
        }

        public PhotoTaskState GetTask(string taskId)
        {
            return activeTasks.Find(t => t.taskId == taskId);
        }

        public PhotoTaskData GetTaskData(string taskId)
        {
            if (currentLevelConfig?.photoTasks == null) return null;
            foreach (var t in currentLevelConfig.photoTasks)
            {
                if (t.taskId == taskId) return t;
            }
            return null;
        }

        public bool CanTakePhoto(PhotoTaskData taskData, Vector2 boatPosition)
        {
            if (taskData == null) return false;
            var state = GetTask(taskData.taskId);
            if (state == null || state.status != TaskStatus.Available || state.attemptsRemaining <= 0)
                return false;

            float distance = Vector2.Distance(boatPosition, taskData.targetPosition);
            return distance <= taskData.detectionRadius;
        }

        public PhotoResult TakePhoto(PhotoTaskData taskData, Vector2 boatPosition, float boatHeading)
        {
            var result = new PhotoResult();
            var state = GetTask(taskData.taskId);

            if (state == null || state.attemptsRemaining <= 0)
            {
                result.success = false;
                result.message = "无法拍摄";
                return result;
            }

            state.status = TaskStatus.InProgress;
            state.attemptsRemaining--;
            photosTaken++;

            float distance = Vector2.Distance(boatPosition, taskData.targetPosition);
            state.distanceToTarget = distance;

            float distanceScore = Mathf.Max(0, 100 - Mathf.Abs(distance - taskData.optimalDistance) * 15f);
            state.weatherModifier = WeatherSystem.Instance.GetPhotoQualityModifier();
            distanceScore *= state.weatherModifier / 100f;

            Vector2 toTarget = (taskData.targetPosition - boatPosition).normalized;
            float boatFacingX = Mathf.Sin(boatHeading * Mathf.Deg2Rad);
            float boatFacingY = Mathf.Cos(boatHeading * Mathf.Deg2Rad);
            Vector2 boatFacing = new Vector2(boatFacingX, boatFacingY);
            float angleDot = Vector2.Dot(toTarget, boatFacing);
            state.angleModifier = Mathf.Max(0, angleDot) * 100f;
            distanceScore *= state.angleModifier / 100f;

            float rarityBonus = taskData.targetRarity * 20f;
            state.photoQuality = Mathf.Clamp(distanceScore, 0, 100);

            state.finalScore = Mathf.RoundToInt(taskData.basePoints * (state.photoQuality / 100f) + rarityBonus);

            if (state.photoQuality >= 70f)
            {
                state.status = TaskStatus.Completed;
                state.photoTaken = true;
                state.bestScore = Mathf.Max(state.bestScore, state.finalScore);
                totalScore += state.finalScore;

                OnTaskCompleted?.Invoke(state, state.finalScore);
                OnTotalScoreChanged?.Invoke(totalScore);
                OnTaskStatusChanged?.Invoke(state);

                if (!string.IsNullOrEmpty(taskData.requiredGalleryItemId))
                {
                    _ = SaveSystem.Instance.UnlockGalleryItem(taskData.requiredGalleryItemId);
                }

                result.success = true;
                result.score = state.finalScore;
                result.quality = state.photoQuality;
                result.message = $"拍摄成功！获得 {state.finalScore} 分";

                CheckLevelComplete();
            }
            else
            {
                state.status = state.attemptsRemaining > 0 ? TaskStatus.Available : TaskStatus.Failed;
                OnTaskStatusChanged?.Invoke(state);

                result.success = false;
                result.quality = state.photoQuality;
                result.message = state.attemptsRemaining > 0 ?
                    $"画质不足 ({state.photoQuality:F0}/70)，还有 {state.attemptsRemaining} 次机会" :
                    "拍摄次数用尽";
            }

            return result;
        }

        public void CheckLevelComplete()
        {
            bool allCompleted = true;
            bool anyCompleted = false;

            foreach (var task in activeTasks)
            {
                if (task.status == TaskStatus.Completed)
                {
                    anyCompleted = true;
                }
                if (task.status != TaskStatus.Completed && task.status != TaskStatus.Failed)
                {
                    allCompleted = false;
                }
            }

            if (allCompleted && anyCompleted)
            {
                int timeBonus = Mathf.RoundToInt(timeRemaining * 2f);
                totalScore += timeBonus;
                OnTotalScoreChanged?.Invoke(totalScore);

                FinishLevel(true);
            }
        }

        public void FinishLevel(bool allTasksCompleted)
        {
            if (GameManager.Instance.CurrentState == GameState.Victory ||
                GameManager.Instance.CurrentState == GameState.Defeat)
                return;

            int stars = CalculateStars(totalScore);
            int completedCount = 0;
            foreach (var t in activeTasks)
            {
                if (t.status == TaskStatus.Completed) completedCount++;
            }

            bool victory = allTasksCompleted || completedCount >= activeTasks.Count * 0.5f;

            if (victory)
            {
                GameManager.Instance.ChangeState(GameState.Victory);
                _ = SaveSystem.Instance.CompleteLevel(currentLevelConfig.levelId, totalScore, stars);

                if (currentLevelConfig.difficulty >= 1 && !string.IsNullOrEmpty(currentLevelConfig.levelId))
                {
                    int nextLevelNum = int.Parse(currentLevelConfig.levelId.Split('_')[1]) + 1;
                    _ = SaveSystem.Instance.UnlockLevel($"level_{nextLevelNum:D2}");
                }

                _ = SaveSystem.Instance.AddXP(totalScore);
                _ = SaveSystem.Instance.AddCoins(totalScore / 10);
            }
            else
            {
                GameManager.Instance.ChangeState(GameState.Defeat);
                _ = SaveSystem.Instance.AddXP(totalScore / 2);
            }

            OnLevelFinished?.Invoke(totalScore, stars);
            EventBus.Trigger(new LevelFinishedEvent(currentLevelConfig.levelId, victory, totalScore, stars));
        }

        public int CalculateStars(int score)
        {
            if (currentLevelConfig == null) return 0;
            if (score >= currentLevelConfig.threeStarsScore) return 3;
            if (score >= currentLevelConfig.twoStarsScore) return 2;
            if (score >= currentLevelConfig.minStarsScore) return 1;
            return 0;
        }

        public int GetCompletedTaskCount()
        {
            int count = 0;
            foreach (var t in activeTasks)
            {
                if (t.status == TaskStatus.Completed) count++;
            }
            return count;
        }

        public int GetTotalTaskCount()
        {
            return activeTasks.Count;
        }

        public float GetDistanceToTask(string taskId, Vector2 boatPosition)
        {
            var data = GetTaskData(taskId);
            if (data == null) return float.MaxValue;
            return Vector2.Distance(boatPosition, data.targetPosition);
        }
    }

    [Serializable]
    public struct PhotoResult
    {
        public bool success;
        public int score;
        public float quality;
        public string message;
    }

    public struct LevelFinishedEvent : IEvent
    {
        public readonly string LevelId;
        public readonly bool Victory;
        public readonly int Score;
        public readonly int Stars;

        public LevelFinishedEvent(string levelId, bool victory, int score, int stars)
        {
            LevelId = levelId;
            Victory = victory;
            Score = score;
            Stars = stars;
        }
    }
}
