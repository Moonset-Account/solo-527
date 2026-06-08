using System.Collections.Generic;
using UnityEngine;

public class MissionManager : MonoBehaviour
{
    public static MissionManager Instance { get; private set; }

    public List<MissionData> activeMissions = new List<MissionData>();
    public Dictionary<string, MissionProgress> progressDict = new Dictionary<string, MissionProgress>();

    private float _levelStartTime;
    private bool _levelActive;

    public System.Action<MissionData, MissionResult> OnMissionCompleted;
    public System.Action<MissionData> OnMissionObjectiveUpdated;

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
    }

    private void OnEnable()
    {
        GameEvents.MissionPhotoTaken += HandlePhotoTaken;
        GameEvents.RoutePointReached += HandleRoutePointReached;
        GameEvents.SupplyDepleted += HandleSupplyDepleted;
        GameEvents.InputActionTriggered += HandleInputAction;
    }

    private void OnDisable()
    {
        GameEvents.MissionPhotoTaken -= HandlePhotoTaken;
        GameEvents.RoutePointReached -= HandleRoutePointReached;
        GameEvents.SupplyDepleted -= HandleSupplyDepleted;
        GameEvents.InputActionTriggered -= HandleInputAction;
    }

    public void StartLevelMissions(List<MissionData> missions)
    {
        activeMissions.Clear();
        progressDict.Clear();
        activeMissions.AddRange(missions);

        foreach (var mission in missions)
        {
            progressDict[mission.missionId] = new MissionProgress
            {
                missionId = mission.missionId,
                isCompleted = false,
                currentScore = 0,
                attemptCount = 0
            };
        }

        _levelStartTime = Time.time;
        _levelActive = true;
    }

    public void EndLevel()
    {
        _levelActive = false;
    }

    private void HandlePhotoTaken(string photoId, int quality)
    {
        foreach (var mission in activeMissions)
        {
            if (mission.missionType != MissionType.Photo) continue;
            if (mission.targetId != photoId) continue;
            if (progressDict[mission.missionId].isCompleted) continue;

            CompleteMission(mission, quality);
        }
    }

    private void HandleRoutePointReached(int pointIndex)
    {
        foreach (var mission in activeMissions)
        {
            if (mission.missionType != MissionType.ReachPoint && mission.missionType != MissionType.TimedRoute)
                continue;
            if (progressDict[mission.missionId].isCompleted) continue;

            progressDict[mission.missionId].currentScore += mission.baseScore / 3;
            OnMissionObjectiveUpdated?.Invoke(mission);

            if (mission.missionType == MissionType.ReachPoint)
            {
                CompleteMission(mission, progressDict[mission.missionId].currentScore);
            }
        }
    }

    private void HandleSupplyDepleted(SupplyType type)
    {
        foreach (var mission in activeMissions)
        {
            if (mission.missionType != MissionType.SupplyRun) continue;
            if (progressDict[mission.missionId].isCompleted) continue;
        }
    }

    private void HandleInputAction(string action)
    {
        if (!_levelActive) return;

        if (action == "Photo")
        {
            AttemptPhoto();
        }
    }

    private void AttemptPhoto()
    {
        var boat = FindObjectOfType<BoatController>();
        if (boat == null) return;

        if (boat.Film <= 0)
        {
            GameEvents.TriggerAudioTriggerRequested("film_empty", 0.8f);
            return;
        }

        Vector2 boatPos = new Vector2(boat.transform.position.x, boat.transform.position.z);
        float boatHeading = boat.transform.eulerAngles.y;

        PhotoTarget[] targets = FindObjectsOfType<PhotoTarget>();
        PhotoTarget bestTarget = null;
        PhotoQuality bestQuality = PhotoQuality.Poor;

        foreach (var target in targets)
        {
            if (!target.IsHighlighted) continue;

            PhotoQuality quality = target.CalculatePhotoQuality(boatPos, boatHeading);
            if (quality > bestQuality || bestTarget == null)
            {
                bestQuality = quality;
                bestTarget = target;
            }
        }

        if (bestTarget != null)
        {
            int qualityScore = QualityToScore(bestQuality);
            int totalScore = CalculatePhotoScore(bestTarget, qualityScore);
            boat.ConsumeFilm();

            GameEvents.TriggerMissionPhotoTaken(bestTarget.targetId, totalScore);
            GameEvents.TriggerAudioTriggerRequested("photo_shutter", 1f);

            if (bestQuality >= PhotoQuality.Great)
            {
                GameEvents.TriggerAudioTriggerRequested("photo_great", 0.7f);
            }

            if (!string.IsNullOrEmpty(bestTarget.collectionItemId))
            {
                GameEvents.TriggerCollectionItemUnlocked(bestTarget.collectionItemId);
            }
        }
        else
        {
            GameEvents.TriggerMissionPhotoTaken("none", 0);
            GameEvents.TriggerAudioTriggerRequested("photo_shutter", 0.5f);
        }
    }

    private int CalculatePhotoScore(PhotoTarget target, int qualityScore)
    {
        float elapsed = Time.time - _levelStartTime;
        int timeBonus = 0;
        foreach (var mission in activeMissions)
        {
            if (mission.targetId == target.targetId && elapsed < mission.timeBonusThreshold)
            {
                timeBonus = Mathf.RoundToInt((mission.timeBonusThreshold - elapsed) * mission.bonusScorePerSecond / mission.timeBonusThreshold);
            }
        }
        return qualityScore + timeBonus;
    }

    private int QualityToScore(PhotoQuality quality)
    {
        switch (quality)
        {
            case PhotoQuality.Perfect: return 100;
            case PhotoQuality.Great: return 75;
            case PhotoQuality.Good: return 50;
            case PhotoQuality.Fair: return 25;
            default: return 5;
        }
    }

    private void CompleteMission(MissionData mission, int score)
    {
        if (!progressDict.ContainsKey(mission.missionId)) return;

        var progress = progressDict[mission.missionId];
        progress.isCompleted = true;
        progress.completionTime = Time.time - _levelStartTime;
        progress.currentScore = Mathf.Max(score, mission.baseScore);
        progress.attemptCount++;

        var result = new MissionResult
        {
            missionId = mission.missionId,
            score = progress.currentScore,
            completionTime = progress.completionTime,
            starCount = CalculateStars(progress.currentScore, mission),
            collectionItemId = mission.collectionItemId
        };

        if (!string.IsNullOrEmpty(mission.completionAudioId))
        {
            GameEvents.TriggerAudioTriggerRequested(mission.completionAudioId, 0.8f);
        }
        else
        {
            GameEvents.TriggerAudioTriggerRequested("mission_complete", 0.8f);
        }

        GameEvents.TriggerMissionCompleted(mission.missionId, progress.currentScore);
        OnMissionCompleted?.Invoke(mission, result);

        if (AreAllMissionsComplete())
        {
            int totalScore = GetTotalScore();
            GameEvents.TriggerLevelCompleted(LevelManager.Instance.CurrentLevelId, totalScore);
        }
    }

    public int CalculateStars(int score, MissionData mission)
    {
        float ratio = (float)score / (mission.baseScore + mission.qualityBonusMax);
        if (ratio >= 0.9f) return 3;
        if (ratio >= 0.6f) return 2;
        if (ratio >= 0.3f) return 1;
        return 0;
    }

    public bool AreAllMissionsComplete()
    {
        foreach (var kvp in progressDict)
        {
            if (!kvp.Value.isCompleted) return false;
        }
        return activeMissions.Count > 0;
    }

    public int GetTotalScore()
    {
        int total = 0;
        foreach (var kvp in progressDict)
        {
            total += kvp.Value.currentScore;
        }
        return total;
    }

    public int GetCompletedCount()
    {
        int count = 0;
        foreach (var kvp in progressDict)
        {
            if (kvp.Value.isCompleted) count++;
        }
        return count;
    }

    public MissionProgress GetProgress(string missionId)
    {
        return progressDict.ContainsKey(missionId) ? progressDict[missionId] : null;
    }

    public List<MissionResult> GetAllResults()
    {
        var results = new List<MissionResult>();
        foreach (var mission in activeMissions)
        {
            var progress = progressDict[mission.missionId];
            results.Add(new MissionResult
            {
                missionId = mission.missionId,
                score = progress.currentScore,
                completionTime = progress.completionTime,
                starCount = CalculateStars(progress.currentScore, mission),
                collectionItemId = mission.collectionItemId,
                isCompleted = progress.isCompleted
            });
        }
        return results;
    }
}

public class MissionProgress
{
    public string missionId;
    public bool isCompleted;
    public int currentScore;
    public float completionTime;
    public int attemptCount;
}

public class MissionResult
{
    public string missionId;
    public int score;
    public float completionTime;
    public int starCount;
    public string collectionItemId;
    public bool isCompleted;
}
