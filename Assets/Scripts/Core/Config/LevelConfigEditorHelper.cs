using UnityEngine;
using System;
using System.Collections.Generic;

public static class LevelConfigEditorHelper
{
    static string[] opponentNames = { "东城青训", "南山少年", "西湖联队", "北风竞技", "银河青年", "红星少年", "蓝翼梯队", "金色阳光", "雷霆青训", "海潮少年" };

    public static LevelConfig CreateDefaultLevel(string id, string name, int difficulty)
    {
        LevelConfig config = new LevelConfig();
        config.levelId = id;
        config.levelName = name;
        config.description = "难度" + difficulty + "的挑战关卡";
        config.difficulty = difficulty;
        config.totalWeeks = 8 + difficulty * 4;
        config.budgetStart = Mathf.Max(30000, 120000 - difficulty * 8000);
        config.targetWins = Mathf.Max(2, difficulty * 2);
        config.targetReputation = 20 + difficulty * 8;
        config.injuryRateMultiplier = 0.8f + difficulty * 0.12f;
        config.trainingEfficiencyMultiplier = Mathf.Max(0.5f, 1.3f - difficulty * 0.08f);
        config.scheduledMatches = GenerateSchedule(config.totalWeeks, difficulty);
        return config;
    }

    public static List<MatchData> GenerateSchedule(int totalWeeks, int difficulty)
    {
        List<MatchData> matches = new List<MatchData>();
        int matchIndex = 0;
        for (int week = 2; week <= totalWeeks; week += 2)
        {
            MatchData match = new MatchData();
            match.matchId = "match_" + matchIndex;
            match.opponentName = opponentNames[matchIndex % opponentNames.Length];
            match.opponentStrength = Mathf.Clamp(30 + difficulty * 5 + UnityEngine.Random.Range(-5, 10), 20, 95);
            match.matchDay = week;
            match.result = MatchResult.NotPlayed;
            match.ourScore = 0;
            match.opponentScore = 0;
            matches.Add(match);
            matchIndex++;
        }
        return matches;
    }
}
