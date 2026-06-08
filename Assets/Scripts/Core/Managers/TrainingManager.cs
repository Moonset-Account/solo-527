using UnityEngine;
using System;
using System.Collections.Generic;

public enum TrainingType
{
    Physical,
    Technical,
    Tactical,
    Mental,
    Rest
}

[Serializable]
public class TrainingSlot
{
    public TrainingType type;
    public string assignedPlayerId;
}

public class TrainingManager : MonoBehaviour
{
    public static TrainingManager Instance { get; private set; }

    public List<TrainingSlot> weeklySchedule;

    void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
        DontDestroyOnLoad(gameObject);
        ResetSchedule();
    }

    public void ResetSchedule()
    {
        weeklySchedule = new List<TrainingSlot>(7);
        for (int i = 0; i < 7; i++)
        {
            weeklySchedule.Add(new TrainingSlot { type = TrainingType.Rest, assignedPlayerId = "" });
        }
    }

    public void SetDayTraining(int dayIndex, TrainingType type, string playerId)
    {
        if (dayIndex < 0 || dayIndex >= weeklySchedule.Count) return;
        weeklySchedule[dayIndex].type = type;
        weeklySchedule[dayIndex].assignedPlayerId = playerId;
    }

    public void ClearDayTraining(int dayIndex)
    {
        if (dayIndex < 0 || dayIndex >= weeklySchedule.Count) return;
        weeklySchedule[dayIndex].type = TrainingType.Rest;
        weeklySchedule[dayIndex].assignedPlayerId = "";
    }

    public void ApplyWeeklyTraining(TeamData team)
    {
        if (team == null || team.players == null) return;
        foreach (var slot in weeklySchedule)
        {
            if (slot.type == TrainingType.Rest) continue;
            if (string.IsNullOrEmpty(slot.assignedPlayerId)) continue;
            PlayerData player = team.GetPlayer(slot.assignedPlayerId);
            if (player == null || player.IsInjured()) continue;
            int gain = 2;
            switch (slot.type)
            {
                case TrainingType.Physical:
                    player.ApplyTraining("speed", gain);
                    player.ApplyTraining("stamina", 1);
                    break;
                case TrainingType.Technical:
                    player.ApplyTraining("technique", gain);
                    break;
                case TrainingType.Tactical:
                    player.ApplyTraining("tactical", gain);
                    break;
                case TrainingType.Mental:
                    player.ApplyTraining("mental", gain);
                    break;
            }
        }
        foreach (var player in team.players)
        {
            if (player.IsInjured()) continue;
            bool hasRestDay = false;
            foreach (var slot in weeklySchedule)
            {
                if (slot.type == TrainingType.Rest)
                {
                    hasRestDay = true;
                    break;
                }
            }
            if (hasRestDay)
            {
                player.ApplyRest(10);
            }
        }
    }
}
