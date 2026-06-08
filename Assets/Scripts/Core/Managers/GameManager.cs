using UnityEngine;
using System;
using System.Collections.Generic;

public enum GameState
{
    Menu,
    Tutorial,
    LevelSelect,
    Playing,
    MatchDay,
    Result,
    GameOver
}

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    public TeamData currentTeam;
    public LevelConfig currentLevel;
    public int currentWeek;
    public GameState currentState;

    void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
        DontDestroyOnLoad(gameObject);
        currentState = GameState.Menu;
        currentWeek = 0;
    }

    public void StartNewGame(string levelId)
    {
        currentLevel = LevelConfigLoader.LoadFromJson("LevelData/" + levelId);
        if (currentLevel == null)
        {
            Debug.LogError("Failed to load level: " + levelId);
            return;
        }
        currentWeek = 1;
        currentTeam = CreateDefaultTeam(currentLevel);
        currentState = GameState.Playing;
        TrainingManager.Instance.ResetSchedule();
    }

    TeamData CreateDefaultTeam(LevelConfig level)
    {
        TeamData team = new TeamData();
        team.teamId = "team_player";
        team.teamName = "我的青年队";
        team.budget = level.budgetStart;
        team.reputation = 10;
        team.seasonWins = 0;
        team.seasonLosses = 0;
        team.seasonDraws = 0;
        team.lastMatchResult = MatchResult.NotPlayed;
        team.lastMatchOurScore = 0;
        team.lastMatchOpponentScore = 0;
        team.players = new List<PlayerData>();
        string[] names = { "张明", "李华", "王强", "赵鹏", "刘洋", "陈磊", "杨帆", "黄旭", "周杰", "吴昊", "孙涛", "马超", "朱亮", "胡威", "林峰", "何宇", "高翔", "郑凯", "谢辉", "韩磊" };
        PlayerPosition[] positions = { PlayerPosition.Goalkeeper, PlayerPosition.Defender, PlayerPosition.Defender, PlayerPosition.Defender, PlayerPosition.Defender, PlayerPosition.Midfielder, PlayerPosition.Midfielder, PlayerPosition.Midfielder, PlayerPosition.Midfielder, PlayerPosition.Forward, PlayerPosition.Forward, PlayerPosition.Goalkeeper, PlayerPosition.Defender, PlayerPosition.Defender, PlayerPosition.Midfielder, PlayerPosition.Midfielder, PlayerPosition.Forward, PlayerPosition.Forward, PlayerPosition.Defender, PlayerPosition.Midfielder };
        for (int i = 0; i < 20; i++)
        {
            PlayerData p = new PlayerData();
            p.playerId = "p_" + i.ToString();
            p.playerName = names[i];
            p.age = UnityEngine.Random.Range(16, 21);
            p.position = positions[i];
            p.state = PlayerState.Healthy;
            p.stamina = UnityEngine.Random.Range(60, 90);
            p.speed = UnityEngine.Random.Range(30, 70);
            p.technique = UnityEngine.Random.Range(30, 70);
            p.tactical = UnityEngine.Random.Range(30, 70);
            p.mental = UnityEngine.Random.Range(30, 70);
            p.injuryRisk = UnityEngine.Random.Range(0.01f, 0.1f);
            p.morale = UnityEngine.Random.Range(60, 90);
            team.players.Add(p);
        }
        return team;
    }

    public void AdvanceWeek()
    {
        currentWeek++;
        TrainingManager.Instance.ApplyWeeklyTraining(currentTeam);
        InjuryManager.Instance.ProcessWeeklyInjuries(currentTeam, currentLevel.injuryRateMultiplier);
        FinanceManager.Instance.ProcessWeeklyFinance(currentTeam);
        CheckForMatch();
        CheckGameEnd();
    }

    void CheckForMatch()
    {
        if (currentLevel == null || currentLevel.scheduledMatches == null) return;
        foreach (var match in currentLevel.scheduledMatches)
        {
            if (match.matchDay == currentWeek && match.result == MatchResult.NotPlayed)
            {
                TriggerMatch(match);
                return;
            }
        }
    }

    public void TriggerMatch(MatchData matchData)
    {
        currentState = GameState.MatchDay;
        var squad = MatchManager.Instance.SelectSquad(currentTeam);
        int ourScore = MatchManager.Instance.SimulateMatchScore(currentTeam, matchData);
        int oppScore = MatchManager.Instance.SimulateOpponentScore(matchData.opponentStrength);
        matchData.ourScore = ourScore;
        matchData.opponentScore = oppScore;
        if (ourScore > oppScore)
        {
            matchData.result = MatchResult.Win;
            currentTeam.seasonWins++;
            currentTeam.reputation += 3;
        }
        else if (ourScore < oppScore)
        {
            matchData.result = MatchResult.Loss;
            currentTeam.seasonLosses++;
            currentTeam.reputation = Mathf.Max(0, currentTeam.reputation - 1);
        }
        else
        {
            matchData.result = MatchResult.Draw;
            currentTeam.seasonDraws++;
            currentTeam.reputation += 1;
        }
        currentTeam.lastMatchResult = matchData.result;
        currentTeam.lastMatchOurScore = ourScore;
        currentTeam.lastMatchOpponentScore = oppScore;
        foreach (var p in squad)
        {
            p.ApplyFatigue(15);
        }
        currentState = GameState.Result;
    }

    public void CheckGameEnd()
    {
        if (currentLevel == null || currentTeam == null) return;
        if (currentLevel.IsLevelComplete(currentTeam))
        {
            currentState = GameState.Result;
            return;
        }
        if (currentLevel.IsLevelFailed(currentTeam, currentWeek) || currentTeam.budget < -10000)
        {
            currentState = GameState.GameOver;
            return;
        }
        if (currentWeek >= currentLevel.totalWeeks)
        {
            currentState = GameState.GameOver;
            return;
        }
        if (currentState == GameState.Result || currentState == GameState.MatchDay)
        {
            currentState = GameState.Playing;
        }
    }

    public GameState GetCurrentState()
    {
        return currentState;
    }

    public string GetStatusSummary()
    {
        if (currentTeam == null || currentLevel == null) return "";
        return string.Format("第{0}周 | 预算:{1} | 声望:{2} | 胜:{3}负:{4}平:{5}",
            currentWeek, currentTeam.budget, currentTeam.reputation,
            currentTeam.seasonWins, currentTeam.seasonLosses, currentTeam.seasonDraws);
    }
}
