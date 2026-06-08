using System;
using System.Collections.Generic;
using UnityEngine;

namespace LakeNavigation
{
    public class MissionManager : MonoBehaviour
    {
        public List<PhotoTarget> photoTargets;
        public List<LevelObjective> objectives;
        public float timeRemaining;
        public float levelTimeLimit;
        public Dictionary<PhotoTarget, PhotoQuality> completedPhotos = new Dictionary<PhotoTarget, PhotoQuality>();

        public event Action<PhotoTarget> OnMissionCompleted;
        public event Action<LevelObjective> OnObjectiveCompleted;
        public event Action OnTimeExpired;
        public event Action OnAllMissionsCompleted;
        public event Action<PhotoTarget, PhotoQuality> OnPhotoTaken;
        public event Action<float> OnTimeChanged;

        public void Initialize(List<PhotoTarget> targets, List<LevelObjective> levelObjectives, float timeLimit)
        {
            photoTargets = new List<PhotoTarget>(targets);
            objectives = new List<LevelObjective>(levelObjectives);
            levelTimeLimit = timeLimit;
            timeRemaining = timeLimit;
            completedPhotos.Clear();
        }

        public void TryTakePhoto(Vector2 boatPosition)
        {
            int closestIndex = -1;
            float closestDistance = float.MaxValue;

            for (int i = 0; i < photoTargets.Count; i++)
            {
                var target = photoTargets[i];
                if (target.IsCompleted) continue;
                float distance = Vector2.Distance(boatPosition, target.GridPosition);
                if (distance <= target.RequiredProximity && distance < closestDistance)
                {
                    closestIndex = i;
                    closestDistance = distance;
                }
            }

            if (closestIndex < 0) return;

            var closestTarget = photoTargets[closestIndex];
            PhotoQuality quality = CalculateQuality(closestDistance, closestTarget.RequiredProximity, closestTarget.PreferredWeather);
            closestTarget.IsCompleted = true;
            photoTargets[closestIndex] = closestTarget;
            completedPhotos[closestTarget] = quality;
            OnPhotoTaken?.Invoke(closestTarget, quality);
            OnMissionCompleted?.Invoke(closestTarget);

            if (AreAllRequiredMissionsCompleted())
            {
                OnAllMissionsCompleted?.Invoke();
            }
        }

        private PhotoQuality CalculateQuality(float distance, float requiredProximity, WeatherType weather)
        {
            PhotoQuality quality;

            if (distance <= requiredProximity * 0.3f)
                quality = PhotoQuality.Excellent;
            else if (distance <= requiredProximity * 0.6f)
                quality = PhotoQuality.Good;
            else if (distance <= requiredProximity * 0.85f)
                quality = PhotoQuality.Fair;
            else
                quality = PhotoQuality.Poor;

            if (weather == WeatherType.Foggy || weather == WeatherType.Stormy)
            {
                quality = (PhotoQuality)Mathf.Min((int)quality + 1, (int)PhotoQuality.Excellent);
            }

            return quality;
        }

        public void UpdateTime(float deltaTime)
        {
            if (timeRemaining <= 0f) return;

            timeRemaining -= deltaTime;
            if (timeRemaining < 0f) timeRemaining = 0f;
            OnTimeChanged?.Invoke(timeRemaining);

            if (timeRemaining <= 0f)
            {
                OnTimeExpired?.Invoke();
            }
        }

        public bool AreAllRequiredMissionsCompleted()
        {
            foreach (var target in photoTargets)
            {
                if (target.IsRequired && !target.IsCompleted)
                    return false;
            }
            foreach (var objective in objectives)
            {
                if (objective.IsRequired && !objective.IsCompleted)
                    return false;
            }
            return true;
        }

        public bool AreAllPhotoTargetsCompleted()
        {
            foreach (var target in photoTargets)
            {
                if (!target.IsCompleted)
                    return false;
            }
            return true;
        }

        public int GetCompletedMissionCount()
        {
            int count = 0;
            foreach (var target in photoTargets)
            {
                if (target.IsCompleted) count++;
            }
            return count;
        }

        public int GetTotalMissionCount()
        {
            return photoTargets.Count;
        }

        public void CompleteObjective(LevelObjective objective)
        {
            objective.IsCompleted = true;
            OnObjectiveCompleted?.Invoke(objective);

            if (AreAllRequiredMissionsCompleted())
            {
                OnAllMissionsCompleted?.Invoke();
            }
        }

        public void Reset()
        {
            for (int i = 0; i < photoTargets.Count; i++)
            {
                var target = photoTargets[i];
                target.IsCompleted = false;
                photoTargets[i] = target;
            }
            for (int i = 0; i < objectives.Count; i++)
            {
                var obj = objectives[i];
                obj.IsCompleted = false;
                objectives[i] = obj;
            }
            timeRemaining = levelTimeLimit;
            completedPhotos.Clear();
        }
    }
}
