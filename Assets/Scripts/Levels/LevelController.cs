using UnityEngine;
using System.Collections.Generic;

namespace InkMountainBridge
{
    public class LevelController : MonoBehaviour
    {
        public LevelConfig levelConfig;
        public BridgeStructure bridgeStructure;
        public BridgeBuilder bridgeBuilder;
        public ForceSimulator forceSimulator;
        public WeatherSystem weatherSystem;
        public CaravanController caravanController;
        public MaterialBudgetManager materialBudgetManager;
        public ScoreCalculator scoreCalculator;
        public ReplayRecorder replayRecorder;
        public AnalyticsRecorder analyticsRecorder;
        public float levelTimer;
        public bool isLevelActive;

        private FailPromptController failPromptController;
        private SettlementScreen settlementScreen;
        private TutorialController tutorialController;

        public void Initialize(LevelConfig config)
        {
            levelConfig = config;
            levelTimer = 0f;
            isLevelActive = false;

            AutoFindReferences();

            if (bridgeStructure != null)
            {
                foreach (var anchor in config.anchorPoints)
                {
                    bridgeStructure.AddNode(anchor, true);
                }
            }

            if (materialBudgetManager != null)
            {
                materialBudgetManager.ResetBudget(config.availableMaterials);
            }

            if (weatherSystem != null)
            {
                weatherSystem.Initialize(config);
                weatherSystem.SetWeather(config.weatherType);
            }

            if (bridgeBuilder != null)
            {
                bridgeBuilder.SetLevelConfig(config);
                bridgeBuilder.enabled = false;
            }

            if (forceSimulator != null)
            {
                forceSimulator.enabled = false;
            }

            if (caravanController != null)
            {
                caravanController.enabled = false;
            }

            if (tutorialController == null)
            {
                tutorialController = FindObjectOfType<TutorialController>();
            }

            if (failPromptController == null)
            {
                failPromptController = FindObjectOfType<FailPromptController>();
            }

            if (settlementScreen == null)
            {
                settlementScreen = FindObjectOfType<SettlementScreen>();
            }
        }

        public void StartBuildPhase()
        {
            isLevelActive = false;
            levelTimer = 0f;
            GameEvents.RaisePhaseChanged(GameState.Building);

            if (bridgeBuilder != null)
            {
                bridgeBuilder.enabled = true;
            }

            if (forceSimulator != null)
            {
                forceSimulator.enabled = false;
            }

            if (caravanController != null)
            {
                caravanController.enabled = false;
            }

            if (replayRecorder != null)
            {
                replayRecorder.StartRecording();
            }

            if (levelConfig.isTutorial && tutorialController != null)
            {
                tutorialController.StartTutorial(levelConfig.tutorialSteps);
            }
        }

        public void StartTestPhase()
        {
            isLevelActive = true;
            levelTimer = 0f;
            GameEvents.RaisePhaseChanged(GameState.Testing);

            if (bridgeBuilder != null)
            {
                bridgeBuilder.enabled = false;
            }

            if (forceSimulator != null)
            {
                forceSimulator.enabled = true;
            }

            if (caravanController != null)
            {
                caravanController.enabled = true;
                caravanController.moveSpeed = levelConfig.caravanSpeed;

                var pathFinder = caravanController.GetComponent<CaravanPathFinder>();
                if (pathFinder != null && bridgeStructure != null)
                {
                    pathFinder.bridgeStructure = bridgeStructure;

                    float halfWidth = levelConfig.valleyWidth / 2f;
                    Vector2 start = new Vector2(-halfWidth, 0f);
                    Vector2 end = new Vector2(halfWidth, 0f);

                    if (levelConfig.anchorPoints != null && levelConfig.anchorPoints.Length >= 2)
                    {
                        start = levelConfig.anchorPoints[0];
                        end = levelConfig.anchorPoints[levelConfig.anchorPoints.Length - 1];
                    }

                    pathFinder.SetEndpoints(start, end);
                    var path = pathFinder.CalculatePath();
                    if (path != null && path.Count > 0)
                    {
                        caravanController.SetPath(path);
                    }
                }

                caravanController.StartCrossing();
            }

            if (weatherSystem != null)
            {
                weatherSystem.SetWeather(levelConfig.weatherType);
            }
        }

        public void OnTestPhaseUpdate(float dt)
        {
            if (!isLevelActive) return;

            levelTimer += dt;

            if (levelConfig.timeLimit > 0f && levelTimer >= levelConfig.timeLimit)
            {
                HandleFail("Time limit exceeded");
                return;
            }

            if (forceSimulator != null)
            {
                forceSimulator.SimulateStep(dt);
            }

            if (weatherSystem != null)
            {
                weatherSystem.UpdateWeather(dt);
            }

            if (caravanController != null && (caravanController.isMoving || caravanController.isDrowning))
            {
                caravanController.Tick(dt);

                if (forceSimulator != null && caravanController.isMoving)
                {
                    forceSimulator.ApplyCaravanLoad(caravanController.transform.position, levelConfig.caravanWeight);
                }
            }

            if (bridgeStructure != null && !bridgeStructure.IsStructurallySound())
            {
                HandleFail("Bridge collapsed");
                return;
            }

            if (caravanController != null && caravanController.hasArrived)
            {
                if (levelConfig.forceFailOnComplete)
                {
                    HandleFail("Bridge could not withstand the crossing");
                    return;
                }

                HandleWin();
            }

            if (caravanController != null && caravanController.isDrowning)
            {
                HandleFail("Caravan drowned");
            }
        }

        public void HandleWin()
        {
            isLevelActive = false;

            LevelResult result = new LevelResult
            {
                levelId = levelConfig.levelId,
                completed = true,
                completionTime = levelTimer,
                materialsUsed = GetMaterialsUsed(),
                totalBudget = levelConfig.availableMaterials.beamCount + levelConfig.availableMaterials.ropeCount + levelConfig.availableMaterials.pierCount,
                maxStressRatio = bridgeStructure != null ? bridgeStructure.GetMaxStress() : 0f,
                weatherType = levelConfig.weatherType,
                caravanHealthRemaining = caravanController != null ? caravanController.currentHealth / caravanController.maxHealth : 0f,
                timestamp = System.DateTime.UtcNow.ToString("o")
            };

            if (scoreCalculator != null)
            {
                result.score = scoreCalculator.CalculateScore(result);
            }

            if (analyticsRecorder != null)
            {
                analyticsRecorder.RecordLevelResult(result);
            }

            if (replayRecorder != null)
            {
                replayRecorder.StopRecording();
            }

            GameEvents.RaiseLevelCompleted(levelConfig.levelId);
            GameEvents.RaisePhaseChanged(GameState.Settlement);

            if (settlementScreen != null)
            {
                settlementScreen.Show(result);
            }
        }

        public void HandleFail(string reason)
        {
            isLevelActive = false;

            if (caravanController != null)
            {
                caravanController.StopCrossing();
            }

            if (analyticsRecorder != null)
            {
                analyticsRecorder.RecordFailure(levelConfig.levelId, reason, levelTimer);
            }

            if (replayRecorder != null)
            {
                replayRecorder.StopRecording();
            }

            GameEvents.RaiseLevelFailed(reason);
            GameEvents.RaisePhaseChanged(GameState.Paused);

            if (failPromptController != null)
            {
                failPromptController.Show(reason);
            }
        }

        public void ResetLevel()
        {
            isLevelActive = false;
            levelTimer = 0f;

            if (bridgeStructure != null)
            {
                bridgeStructure.CollapseAll();
            }

            if (materialBudgetManager != null)
            {
                materialBudgetManager.ResetBudget(levelConfig.availableMaterials);
            }

            if (caravanController != null)
            {
                caravanController.enabled = false;
                caravanController.isMoving = false;
                caravanController.hasArrived = false;
                caravanController.isDrowning = false;
                caravanController.currentHealth = caravanController.maxHealth;
            }

            if (bridgeBuilder != null)
            {
                bridgeBuilder.enabled = false;
            }

            if (forceSimulator != null)
            {
                forceSimulator.enabled = false;
            }

            if (replayRecorder != null)
            {
                replayRecorder.ClearRecording();
            }
        }

        private int GetMaterialsUsed()
        {
            if (materialBudgetManager == null) return 0;
            return levelConfig.availableMaterials.beamCount - materialBudgetManager.GetRemaining(MaterialType.Beam)
                + levelConfig.availableMaterials.ropeCount - materialBudgetManager.GetRemaining(MaterialType.Rope)
                + levelConfig.availableMaterials.pierCount - materialBudgetManager.GetRemaining(MaterialType.StonePier);
        }

        private void Update()
        {
            if (isLevelActive)
            {
                OnTestPhaseUpdate(Time.deltaTime);
            }
        }

        private void AutoFindReferences()
        {
            if (bridgeStructure == null) bridgeStructure = FindObjectOfType<BridgeStructure>();
            if (bridgeBuilder == null) bridgeBuilder = FindObjectOfType<BridgeBuilder>();
            if (forceSimulator == null) forceSimulator = FindObjectOfType<ForceSimulator>();
            if (weatherSystem == null) weatherSystem = FindObjectOfType<WeatherSystem>();
            if (caravanController == null) caravanController = FindObjectOfType<CaravanController>();
            if (materialBudgetManager == null) materialBudgetManager = FindObjectOfType<MaterialBudgetManager>();
            if (scoreCalculator == null) scoreCalculator = FindObjectOfType<ScoreCalculator>();
            if (replayRecorder == null) replayRecorder = FindObjectOfType<ReplayRecorder>();
            if (analyticsRecorder == null) analyticsRecorder = FindObjectOfType<AnalyticsRecorder>();
            if (failPromptController == null) failPromptController = FindObjectOfType<FailPromptController>();
            if (settlementScreen == null) settlementScreen = FindObjectOfType<SettlementScreen>();
            if (tutorialController == null) tutorialController = FindObjectOfType<TutorialController>();
        }
    }
}
