using System.Collections.Generic;
using UnityEngine;

namespace BalloonPost.Unity
{
    using BalloonPost.Core;
    using BalloonPost.Save;
    using BalloonPost.Tutorial;
    using BalloonPost.UI;

    public class GameBootstrap : MonoBehaviour
    {
        [Header("启动配置")]
        public int GameSeed = 42;
        public int MaxTurns = 30;
        public int LevelIndex = 0;
        public bool StartTutorial = true;
        public int TutorialLevel = 1;

        [Header("运行时数据")]
        public GameManager Game;
        public TutorialManager Tutorial;

        public static GameBootstrap Instance { get; private set; }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void Start()
        {
            InitializeGame();
        }

        public void InitializeGame()
        {
            Game = new GameManager(GameSeed, MaxTurns, LevelIndex);
            Tutorial = new TutorialManager();
            Tutorial.BindGame(Game);

            Game.OnLogMessage += msg => Debug.Log($"[Game] {msg}");
            Game.OnPhaseChanged += phase => Debug.Log($"[Phase] {phase}");
            Game.OnSettlementComplete += OnSettlementComplete;

            if (StartTutorial)
            {
                StartTutorialLevel(TutorialLevel);
            }
            else
            {
                Game.InitializeStandardLevel(4, 4);
                Game.SetPhase(GamePhase.Planning);
            }

            Debug.Log($"=== 游戏初始化完成 ===");
            Debug.Log($"地图格数：{Game.Grid.Count}");
            Debug.Log($"城镇数量：{Game.Grid.Towns.Count}");
            Debug.Log($"待接合同：{Game.ContractManager.PendingContracts.Count}");
            Debug.Log(WindManager.GetWindDirectionLabel(Game.WindManager.CurrentWind.Direction));
        }

        public void StartTutorialLevel(int level)
        {
            TutorialLevel = level;
            switch (level)
            {
                case 1:
                    Game.InitializeTutorialLevel1();
                    Tutorial.CurrentStepIndex = 0;
                    break;
                case 2:
                    Game.InitializeTutorialLevel2();
                    Tutorial.CurrentStepIndex = 1;
                    break;
                case 3:
                    Game.InitializeTutorialLevel3();
                    Tutorial.CurrentStepIndex = 2;
                    break;
                default:
                    Game.InitializeTutorialLevel1();
                    Tutorial.CurrentStepIndex = 0;
                    break;
            }
            Game.SetPhase(GamePhase.Tutorial);
            Tutorial.StartCurrentStep();
            Debug.Log($"=== 教程第 {level} 关开始 ===");
            Debug.Log($"目标：{Tutorial.CurrentStep?.Title}");
        }

        private void OnSettlementComplete(SettlementReport report)
        {
            var view = SettlementPresenter.BuildView(report, Game);

            Debug.Log("\n" + new string('=', 50));
            Debug.Log(view.TitleText);
            Debug.Log(new string('=', 50));
            Debug.Log(view.ScoreText);
            Debug.Log("");
            Debug.Log(view.EarningsBreakdown);
            Debug.Log("");
            Debug.Log(view.DeliveredList);
            Debug.Log("");
            Debug.Log(view.ComplaintsList);
            Debug.Log("");
            Debug.Log(view.UndeliveredList);
            Debug.Log("");
            Debug.Log(view.HighlightsText);
            Debug.Log($"\n评级：{view.SummaryGrade}（{view.Stars}星）");
            Debug.Log(new string('=', 50));

            if (Game.Phase == GamePhase.Tutorial || Game.Phase == GamePhase.GameOver)
            {
                bool passed = Tutorial.CheckStepCompletion(report);
                Debug.Log($"\n教程目标检查：{(passed ? "✅ 通过！" : "❌ 未完成，再接再厉")}");
                if (passed)
                {
                    bool hasNext = Tutorial.AdvanceToNextStep();
                    if (hasNext)
                    {
                        Debug.Log($"\n进入下一教程：{Tutorial.CurrentStep.Title}");
                    }
                    else
                    {
                        Debug.Log("\n🎉 恭喜！你已完成所有教程，现在可以挑战正式关卡了！");
                    }
                }
            }

            SaveSystem.SaveGame(Game, $"结算_{report.FinalScore}分");
        }

        public bool SaveGame(string name = null)
        {
            bool ok = SaveSystem.SaveGame(Game, name);
            Debug.Log(ok ? "✅ 保存成功" : "❌ 保存失败");
            return ok;
        }

        public void LoadGame(string saveId)
        {
            var loaded = SaveSystem.LoadGame(saveId);
            if (loaded != null)
            {
                Game = loaded;
                Tutorial.BindGame(Game);
                Game.OnLogMessage += msg => Debug.Log($"[Game] {msg}");
                Game.OnPhaseChanged += phase => Debug.Log($"[Phase] {phase}");
                Game.OnSettlementComplete += OnSettlementComplete;
                Debug.Log($"✅ 存档 {saveId} 已加载");
            }
        }

        public List<Save.SaveData> ListSaves()
        {
            return SaveSystem.ListAllSaves();
        }

        public void RestoreGameManager(GameManager restored)
        {
            Game = restored;
            if (Tutorial == null) Tutorial = new TutorialManager();
            Tutorial.BindGame(Game);
            Game.OnLogMessage -= OnBubbleLog;
            Game.OnLogMessage += OnBubbleLog;
            Game.OnPhaseChanged -= OnBubblePhase;
            Game.OnPhaseChanged += OnBubblePhase;
            Game.OnSettlementComplete -= OnSettlementComplete;
            Game.OnSettlementComplete += OnSettlementComplete;
            Debug.Log($"[Bootstrap] GameManager 已从存档恢复：T{restored.TurnsElapsed}，{restored.Grid.Count}格子");
        }

        private void OnBubbleLog(string msg) => Debug.Log($"[Game] {msg}");
        private void OnBubblePhase(GamePhase phase) => Debug.Log($"[Phase] {phase}");
    }
}
