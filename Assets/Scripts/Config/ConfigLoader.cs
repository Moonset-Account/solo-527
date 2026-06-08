using System;
using System.Collections.Generic;
using UnityEngine;
using YouthTrainingManagement.Core;
using YouthTrainingManagement.Models;

namespace YouthTrainingManagement.Config
{
    [CreateAssetMenu(fileName = "GameConfig", menuName = "YouthTraining/GameConfig", order = 0)]
    public class GameConfig : ScriptableObject
    {
        [Header("Season Settings")]
        public int SeasonWeeks = 10;
        public int TotalTeams = 8;
        public string LeagueName = "Youth Development League";

        [Header("Match Settings")]
        public int BasePrizeMoneyWin = 5000;
        public int BasePrizeMoneyDraw = 2000;
        public int BasePrizeMoneyLoss = 500;
        public int BaseTicketPrice = 25;
        public int BaseAttendance = 1000;
        public float MatchFatigueIncrease = 25f;
        public float MatchInjuryBaseRisk = 8f;

        [Header("Economy Settings")]
        public float StartingBalance = 50000f;
        public float WeeklyWages = 8000f;
        public float WeeklyFacilityCosts = 2000f;
        public float WeeklySponsorship = 6000f;
        public float WeeklyMedicalBudget = 1500f;
        public float WeeklyTrainingBudget = 3000f;

        [Header("Player Development")]
        public int DefaultPlayerCount = 16;
        public float BaseStatRangeMin = 30f;
        public float BaseStatRangeMax = 60f;
        public float WeeklyGainMultiplier = 1f;
        public float FatigueDecayPerDay = 8f;

        [Header("Difficulty Scaling")]
        public float OpponentStrengthGrowthRate = 0.02f;
        public float DifficultyMultiplier = 1f;
        public float MoraleDecayPerLoss = 5f;
        public float MoraleBoostPerWin = 8f;
    }

    [CreateAssetMenu(fileName = "TrainingDrills", menuName = "YouthTraining/TrainingDrills", order = 1)]
    public class TrainingDrillsConfig : ScriptableObject
    {
        public List<TrainingDrill> Drills = new List<TrainingDrill>();
    }

    [CreateAssetMenu(fileName = "RecoveryOptions", menuName = "YouthTraining/RecoveryOptions", order = 2)]
    public class RecoveryOptionsConfig : ScriptableObject
    {
        public List<RecoveryOption> Options = new List<RecoveryOption>();
    }

    [CreateAssetMenu(fileName = "Opponents", menuName = "YouthTraining/Opponents", order = 3)]
    public class OpponentsConfig : ScriptableObject
    {
        public List<OpponentTeam> Teams = new List<OpponentTeam>();
    }

    [Serializable]
    public class OpponentTeam
    {
        public string TeamId;
        public string Name;
        public int BaseDifficulty;
        public PlayerStats BaseStats;
        public int ExpectedAttendanceBoost;
        public int PrizeMoneyBoost;
    }

    [CreateAssetMenu(fileName = "Tutorial", menuName = "YouthTraining/Tutorial", order = 4)]
    public class TutorialConfig : ScriptableObject
    {
        public TutorialData TutorialData;
    }

    [Serializable]
    public class TutorialData
    {
        public List<TutorialStep> Steps = new List<TutorialStep>();
    }

    [Serializable]
    public class TutorialStep
    {
        public string Title;
        [TextArea(3, 10)]
        public string Description;
        public string HighlightedElementId;
        public bool RequiresAction;
        public string ActionType;
        public Sprite Illustration;
    }

    [CreateAssetMenu(fileName = "FeedbackStrings", menuName = "YouthTraining/FeedbackStrings", order = 5)]
    public class FeedbackStringsConfig : ScriptableObject
    {
        [Header("Training")]
        public string[] TrainingExcellentNotes;
        public string[] TrainingGoodNotes;
        public string[] TrainingAverageNotes;
        public string[] TrainingPoorNotes;
        public string[] TrainingInjuryMessages;

        [Header("Match")]
        public string[] WinMessages;
        public string[] DrawMessages;
        public string[] LossMessages;
        public string[] GoalScoredMessages;
        public string[] InjuryMessages;

        [Header("Recovery")]
        public string[] RecoveryExcellentNotes;
        public string[] RecoveryGoodNotes;

        [Header("Finance")]
        public string LowBalanceWarning;
        public string BudgetExceededWarning;
    }

    public class ConfigLoader : MonoBehaviour
    {
        public GameConfig GameConfig;
        public TrainingDrillsConfig TrainingDrillsConfig;
        public RecoveryOptionsConfig RecoveryOptionsConfig;
        public OpponentsConfig OpponentsConfig;
        public TutorialConfig TutorialConfig;
        public FeedbackStringsConfig FeedbackStringsConfig;

        public bool IsLoaded { get; private set; }

        public void LoadAllConfigs()
        {
            try
            {
                GameConfig = Resources.Load<GameConfig>("Configs/GameConfig");
                if (GameConfig == null)
                {
                    GameConfig = ScriptableObject.CreateInstance<GameConfig>();
                    Debug.LogWarning("GameConfig not found in Resources/Configs. Using defaults.");
                }

                TrainingDrillsConfig = Resources.Load<TrainingDrillsConfig>("Configs/TrainingDrills");
                if (TrainingDrillsConfig == null)
                {
                    TrainingDrillsConfig = CreateDefaultTrainingDrills();
                    Debug.LogWarning("TrainingDrillsConfig not found. Using defaults.");
                }

                RecoveryOptionsConfig = Resources.Load<RecoveryOptionsConfig>("Configs/RecoveryOptions");
                if (RecoveryOptionsConfig == null)
                {
                    RecoveryOptionsConfig = CreateDefaultRecoveryOptions();
                    Debug.LogWarning("RecoveryOptionsConfig not found. Using defaults.");
                }

                OpponentsConfig = Resources.Load<OpponentsConfig>("Configs/Opponents");
                if (OpponentsConfig == null)
                {
                    OpponentsConfig = CreateDefaultOpponents();
                    Debug.LogWarning("OpponentsConfig not found. Using defaults.");
                }

                TutorialConfig = Resources.Load<TutorialConfig>("Configs/Tutorial");
                if (TutorialConfig == null)
                {
                    TutorialConfig = CreateDefaultTutorial();
                    Debug.LogWarning("TutorialConfig not found. Using defaults.");
                }

                FeedbackStringsConfig = Resources.Load<FeedbackStringsConfig>("Configs/FeedbackStrings");
                if (FeedbackStringsConfig == null)
                {
                    FeedbackStringsConfig = CreateDefaultFeedbackStrings();
                    Debug.LogWarning("FeedbackStringsConfig not found. Using defaults.");
                }

                IsLoaded = true;
                Debug.Log("All configs loaded successfully.");
            }
            catch (Exception ex)
            {
                Debug.LogError($"Failed to load configs: {ex.Message}");
                IsLoaded = false;
            }
        }

        public TutorialData GetTutorialData() => TutorialConfig?.TutorialData;
        public TutorialData Tutorial => TutorialConfig?.TutorialData;
        public List<TrainingDrill> GetAllDrills() => TrainingDrillsConfig?.Drills ?? new List<TrainingDrill>();
        public List<RecoveryOption> GetAllRecoveryOptions() => RecoveryOptionsConfig?.Options ?? new List<RecoveryOption>();
        public TrainingDrill GetDrillById(string id) => GetAllDrills().Find(d => d.DrillId == id);
        public RecoveryOption GetRecoveryOptionById(string id) => GetAllRecoveryOptions().Find(r => r.OptionId == id);

        public SeasonModel GenerateDefaultSeason()
        {
            var season = new SeasonModel
            {
                SeasonId = Guid.NewGuid().ToString(),
                SeasonYear = DateTime.Now.Year,
                LeagueName = GameConfig.LeagueName,
                TotalWeeks = GameConfig.SeasonWeeks,
                CurrentWeek = 1,
                CurrentDayInWeek = 0,
                CurrentPhase = DayPhase.Morning,
                TotalTeams = GameConfig.TotalTeams,
                LeaguePosition = GameConfig.TotalTeams / 2,
                Fixtures = GenerateFixtures()
            };
            return season;
        }

        public FinanceModel GenerateDefaultFinance()
        {
            return new FinanceModel
            {
                CurrentBalance = GameConfig.StartingBalance,
                WeeklyBudget = GameConfig.WeeklyTrainingBudget + GameConfig.WeeklyMedicalBudget,
                WeeklyWages = GameConfig.WeeklyWages,
                WeeklyFacilityCosts = GameConfig.WeeklyFacilityCosts,
                WeeklyMedicalBudget = GameConfig.WeeklyMedicalBudget,
                WeeklyTrainingBudget = GameConfig.WeeklyTrainingBudget,
                SponsorshipIncomePerWeek = GameConfig.WeeklySponsorship,
                WeekOfLastSettlement = 0
            };
        }

        private List<FixtureModel> GenerateFixtures()
        {
            var fixtures = new List<FixtureModel>();
            var teams = OpponentsConfig.Teams;
            if (teams.Count == 0) teams = CreateDefaultOpponents().Teams;

            int fixtureId = 0;
            for (int week = 1; week <= GameConfig.SeasonWeeks; week++)
            {
                bool isMatchWeek = week % 2 == 0;
                if (isMatchWeek)
                {
                    var opponent = teams[(fixtureId) % teams.Count];
                    float weekMultiplier = 1f + (week * GameConfig.OpponentStrengthGrowthRate);
                    var fixture = new FixtureModel
                    {
                        Id = $"F{fixtureId:D4}",
                        OpponentName = opponent.Name,
                        OpponentTeamId = opponent.TeamId,
                        OpponentStats = opponent.BaseStats * weekMultiplier * GameConfig.DifficultyMultiplier,
                        WeekNumber = week,
                        DayPhase = DayPhase.MatchDay,
                        DifficultyRating = Mathf.RoundToInt(opponent.BaseDifficulty * weekMultiplier),
                        ExpectedAttendance = GameConfig.BaseAttendance + opponent.ExpectedAttendanceBoost,
                        TicketPrice = GameConfig.BaseTicketPrice,
                        IsHomeMatch = (fixtureId % 2 == 0),
                        PrizeMoney = GameConfig.BasePrizeMoneyWin + opponent.PrizeMoneyBoost,
                        IsCompleted = false,
                        Result = MatchResult.NotPlayed
                    };
                    fixtures.Add(fixture);
                    fixtureId++;
                }
            }
            return fixtures;
        }

        private TrainingDrillsConfig CreateDefaultTrainingDrills()
        {
            var config = ScriptableObject.CreateInstance<TrainingDrillsConfig>();
            config.Drills = new List<TrainingDrill>
            {
                new TrainingDrill
                {
                    DrillId = "STR_01", Name = "Weight Training", Type = TrainingType.Strength,
                    Description = "Build raw power with compound lifts and resistance training.",
                    StatsGainMultiplier = new PlayerStats(3f, 0.5f, 0.2f, 1f, 0f),
                    FatiguePerPlayer = 18f, MoraleEffect = -2f, BaseCost = 500f,
                    InjuryRiskIncrease = 4f, DurationMinutes = 90, DifficultyLevel = 3, SuccessRate = 0.85f
                },
                new TrainingDrill
                {
                    DrillId = "SPD_01", Name = "Sprint Drills", Type = TrainingType.Speed,
                    Description = "Explosive sprints and agility ladders to boost acceleration.",
                    StatsGainMultiplier = new PlayerStats(0.5f, 3.5f, 0.8f, 1.2f, 0f),
                    FatiguePerPlayer = 20f, MoraleEffect = 0f, BaseCost = 400f,
                    InjuryRiskIncrease = 6f, DurationMinutes = 75, DifficultyLevel = 3, SuccessRate = 0.82f
                },
                new TrainingDrill
                {
                    DrillId = "TEC_01", Name = "Ball Control", Type = TrainingType.Technique,
                    Description = "Dribbling, passing, and first touch drills.",
                    StatsGainMultiplier = new PlayerStats(0.2f, 0.8f, 3.2f, 0.5f, 1f),
                    FatiguePerPlayer = 14f, MoraleEffect = 3f, BaseCost = 350f,
                    InjuryRiskIncrease = 2f, DurationMinutes = 90, DifficultyLevel = 2, SuccessRate = 0.9f
                },
                new TrainingDrill
                {
                    DrillId = "END_01", Name = "Conditioning", Type = TrainingType.Endurance,
                    Description = "Long-distance running and interval training.",
                    StatsGainMultiplier = new PlayerStats(0.8f, 1f, 0.3f, 3.5f, 0.5f),
                    FatiguePerPlayer = 22f, MoraleEffect = -3f, BaseCost = 300f,
                    InjuryRiskIncrease = 3f, DurationMinutes = 120, DifficultyLevel = 4, SuccessRate = 0.78f
                },
                new TrainingDrill
                {
                    DrillId = "TAC_01", Name = "Tactical Sessions", Type = TrainingType.Tactical,
                    Description = "Formation drills, set pieces, and team shape work.",
                    StatsGainMultiplier = new PlayerStats(0.3f, 0.3f, 1f, 0.5f, 3.2f),
                    FatiguePerPlayer = 10f, MoraleEffect = 1f, BaseCost = 600f,
                    InjuryRiskIncrease = 1f, DurationMinutes = 90, DifficultyLevel = 2, SuccessRate = 0.92f
                },
                new TrainingDrill
                {
                    DrillId = "REC_01", Name = "Light Recovery", Type = TrainingType.RecoveryLight,
                    Description = "Stretching, yoga, and light ball work.",
                    StatsGainMultiplier = new PlayerStats(0.2f, 0.2f, 0.3f, 0.2f, 0.2f),
                    FatiguePerPlayer = -8f, MoraleEffect = 5f, BaseCost = 200f,
                    InjuryRiskIncrease = 0.5f, DurationMinutes = 45, DifficultyLevel = 1, SuccessRate = 0.98f
                }
            };
            return config;
        }

        private RecoveryOptionsConfig CreateDefaultRecoveryOptions()
        {
            var config = ScriptableObject.CreateInstance<RecoveryOptionsConfig>();
            config.Options = new List<RecoveryOption>
            {
                new RecoveryOption
                {
                    OptionId = "REST", Name = "Rest Day", Type = RecoveryType.Rest,
                    Description = "Complete rest with no physical activity.",
                    FatigueRecoveryAmount = 20f, MoraleBoostAmount = 3f, InjuryRecoveryRate = 0.05f,
                    CostPerPlayer = 0f, DurationHours = 24
                },
                new RecoveryOption
                {
                    OptionId = "ICE", Name = "Ice Bath", Type = RecoveryType.IceBath,
                    Description = "Cold water immersion for muscle recovery.",
                    FatigueRecoveryAmount = 28f, MoraleBoostAmount = -2f, InjuryRecoveryRate = 0.08f,
                    CostPerPlayer = 25f, DurationHours = 1
                },
                new RecoveryOption
                {
                    OptionId = "MASSAGE", Name = "Sports Massage", Type = RecoveryType.Massage,
                    Description = "Deep tissue massage to relieve tension.",
                    FatigueRecoveryAmount = 35f, MoraleBoostAmount = 5f, InjuryRecoveryRate = 0.12f,
                    CostPerPlayer = 80f, DurationHours = 2
                },
                new RecoveryOption
                {
                    OptionId = "PHYSIO", Name = "Physiotherapy", Type = RecoveryType.Physiotherapy,
                    Description = "Targeted treatment for injury rehabilitation.",
                    FatigueRecoveryAmount = 22f, MoraleBoostAmount = 2f, InjuryRecoveryRate = 0.25f,
                    CostPerPlayer = 150f, DurationHours = 3
                },
                new RecoveryOption
                {
                    OptionId = "YOGA", Name = "Yoga Session", Type = RecoveryType.Yoga,
                    Description = "Flexibility and mindfulness training.",
                    FatigueRecoveryAmount = 24f, MoraleBoostAmount = 6f, InjuryRecoveryRate = 0.1f,
                    CostPerPlayer = 40f, DurationHours = 2
                },
                new RecoveryOption
                {
                    OptionId = "SLEEP", Name = "Sleep Optimization", Type = RecoveryType.Sleep,
                    Description = "Extended rest and recovery protocol.",
                    FatigueRecoveryAmount = 32f, MoraleBoostAmount = 4f, InjuryRecoveryRate = 0.15f,
                    CostPerPlayer = 10f, DurationHours = 12
                },
                new RecoveryOption
                {
                    OptionId = "MEDICAL", Name = "Full Medical", Type = RecoveryType.FullMedical,
                    Description = "Complete medical checkup and intensive treatment.",
                    FatigueRecoveryAmount = 30f, MoraleBoostAmount = 8f, InjuryRecoveryRate = 0.4f,
                    CostPerPlayer = 300f, DurationHours = 6
                }
            };
            return config;
        }

        private OpponentsConfig CreateDefaultOpponents()
        {
            var config = ScriptableObject.CreateInstance<OpponentsConfig>();
            config.Teams = new List<OpponentTeam>
            {
                new OpponentTeam
                {
                    TeamId = "T01", Name = "Rovers United", BaseDifficulty = 50,
                    BaseStats = new PlayerStats(45f, 48f, 50f, 52f, 47f),
                    ExpectedAttendanceBoost = 200, PrizeMoneyBoost = 500
                },
                new OpponentTeam
                {
                    TeamId = "T02", Name = "City Academy", BaseDifficulty = 65,
                    BaseStats = new PlayerStats(55f, 58f, 62f, 57f, 60f),
                    ExpectedAttendanceBoost = 500, PrizeMoneyBoost = 1500
                },
                new OpponentTeam
                {
                    TeamId = "T03", Name = "Northern Stars", BaseDifficulty = 45,
                    BaseStats = new PlayerStats(42f, 44f, 46f, 48f, 43f),
                    ExpectedAttendanceBoost = 100, PrizeMoneyBoost = 300
                },
                new OpponentTeam
                {
                    TeamId = "T04", Name = "Athletic FC", BaseDifficulty = 58,
                    BaseStats = new PlayerStats(52f, 50f, 55f, 56f, 54f),
                    ExpectedAttendanceBoost = 350, PrizeMoneyBoost = 1000
                },
                new OpponentTeam
                {
                    TeamId = "T05", Name = "Westside Boys", BaseDifficulty = 40,
                    BaseStats = new PlayerStats(38f, 42f, 40f, 45f, 39f),
                    ExpectedAttendanceBoost = 50, PrizeMoneyBoost = 200
                },
                new OpponentTeam
                {
                    TeamId = "T06", Name = "Eagles SC", BaseDifficulty = 70,
                    BaseStats = new PlayerStats(62f, 65f, 68f, 60f, 66f),
                    ExpectedAttendanceBoost = 800, PrizeMoneyBoost = 2500
                },
                new OpponentTeam
                {
                    TeamId = "T07", Name = "Dynamo Youth", BaseDifficulty = 52,
                    BaseStats = new PlayerStats(48f, 52f, 50f, 55f, 49f),
                    ExpectedAttendanceBoost = 250, PrizeMoneyBoost = 750
                }
            };
            return config;
        }

        private TutorialConfig CreateDefaultTutorial()
        {
            var config = ScriptableObject.CreateInstance<TutorialConfig>();
            config.TutorialData = new TutorialData
            {
                Steps = new List<TutorialStep>
                {
                    new TutorialStep
                    {
                        Title = "Welcome to Youth Training Manager!",
                        Description = "You've just been appointed as the head coach of a promising youth football team. Your job is to balance training, matches, and recovery to build a winning team while keeping your players healthy and motivated.",
                        RequiresAction = false
                    },
                    new TutorialStep
                    {
                        Title = "The Core Loop",
                        Description = "Each week follows a cycle: MORNING -> AFTERNOON -> EVENING. You can schedule Training, Matches, or Recovery sessions in each phase. Your goal is to improve player stats without burning them out.",
                        RequiresAction = false
                    },
                    new TutorialStep
                    {
                        Title = "Training",
                        Description = "Training sessions improve specific stats (Strength, Speed, Technique, Endurance, Tactical). Each training type has pros and cons: high gains cause more fatigue and higher injury risk. Watch the Injury Risk meter!",
                        HighlightedElementId = "btn_training",
                        RequiresAction = false
                    },
                    new TutorialStep
                    {
                        Title = "Recovery",
                        Description = "Players get tired and injured. Recovery sessions reduce fatigue, boost morale, and heal injuries. Different options have different costs and effects. Never skip recovery — injuries kill seasons!",
                        HighlightedElementId = "btn_recovery",
                        RequiresAction = false
                    },
                    new TutorialStep
                    {
                        Title = "Matches",
                        Description = "Matches happen every other week. Your team's performance depends on stats, fatigue, morale, and injuries. Win to earn prize money and climb the league. Good luck!",
                        HighlightedElementId = "btn_match",
                        RequiresAction = false
                    },
                    new TutorialStep
                    {
                        Title = "Finance & Strategy",
                        Description = "Every choice costs money. Training and recovery have direct costs. Win matches for prize money, but don't over-train — injuries cost more in the long run. Balance is everything!",
                        RequiresAction = false
                    },
                    new TutorialStep
                    {
                        Title = "Ready to Start!",
                        Description = "You now understand the basics. Remember: Short-term wins are great, but player development wins championships. Click START to begin your journey!",
                        RequiresAction = false
                    }
                }
            };
            return config;
        }

        private FeedbackStringsConfig CreateDefaultFeedbackStrings()
        {
            var config = ScriptableObject.CreateInstance<FeedbackStringsConfig>();
            config.TrainingExcellentNotes = new[]
            {
                "Incredible focus today — personal best performance!",
                "Set a new team record in drill completion!",
                "Elite level technique and intensity shown!",
                "Coach's special mention — outstanding work rate!"
            };
            config.TrainingGoodNotes = new[]
            {
                "Solid session — consistent improvement.",
                "Good effort and solid execution.",
                "Above average output, keep it going.",
                "Strong work ethic visible today."
            };
            config.TrainingAverageNotes = new[]
            {
                "Decent session, room to push harder.",
                "Met minimum standards, not exceptional.",
                "Adequate performance, nothing more.",
                "Some players coasted through drills."
            };
            config.TrainingPoorNotes = new[]
            {
                "Lacked intensity today — disappointing.",
                "Multiple errors and low concentration.",
                "Missed targets, need to refocus.",
                "Low energy, below acceptable standards."
            };
            config.TrainingInjuryMessages = new[]
            {
                " pulled a muscle during drills.",
                " suffered an awkward fall.",
                " reported tightness and had to stop.",
                " collided with a teammate during drills."
            };
            config.WinMessages = new[]
            {
                "Excellent team performance, well deserved victory!",
                "Clinical finishing secured the three points!",
                "Dominant display — tactical plan worked perfectly!",
                "Kept fighting until the end — great character!"
            };
            config.DrawMessages = new[]
            {
                "A fair result — both teams had chances.",
                "Solid defensive display earned a point.",
                "Could have won, but happy with a point.",
                "Battled back well to salvage a draw."
            };
            config.LossMessages = new[]
            {
                "Not our day — time to regroup and train harder.",
                "Individual errors proved costly today.",
                "Outplayed by the better team on the day.",
                "Fatigue was visible — recovery priority this week."
            };
            config.GoalScoredMessages = new[] { " scores a brilliant goal!", " finds the net with style!", " clinical finish in the box!" };
            config.InjuryMessages = new[] { " goes off injured!", " down and looks hurt!", " forced off after that challenge!" };
            config.RecoveryExcellentNotes = new[]
            {
                "Fresh and raring to go!",
                "Feeling 100% — mentally and physically sharp.",
                "Body refreshed, ready for battle!"
            };
            config.RecoveryGoodNotes = new[]
            {
                "Feeling much better after treatment.",
                "Good recovery, ready to train.",
                "Loosened up nicely, ready for action."
            };
            config.LowBalanceWarning = "Warning: Bank balance is running low!";
            config.BudgetExceededWarning = "Budget exceeded! Consider cheaper options this week.";
            return config;
        }
    }
}
