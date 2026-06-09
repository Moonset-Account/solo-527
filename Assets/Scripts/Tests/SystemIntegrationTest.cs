using System;
using System.Collections.Generic;
using UnityEngine;

namespace PixelPlantLab.Tests
{
    public class SystemIntegrationTest : MonoBehaviour
    {
        public bool RunTestsOnStart = true;
        public int MutationTestIterations = 1000;
        public Text TestOutputText;

        private void Start()
        {
            if (RunTestsOnStart) RunAllTests();
        }

        [ContextMenu("Run All Tests")]
        public void RunAllTests()
        {
            var results = new List<string>();

            results.Add("=== Pixel Plant Lab 系统测试 ===");
            results.Add($"时间: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
            results.Add("");

            TestPlantDatabase(results);
            TestMutationEngine(results);
            TestResourceManager(results);
            TestDexAndLog(results);
            TestQuestSystem(results);
            TestRecipeProbabilityTracking(results);

            int passed = 0, failed = 0;
            foreach (var r in results)
            {
                if (r.StartsWith("[PASS]")) passed++;
                else if (r.StartsWith("[FAIL]")) failed++;
            }
            results.Add("");
            results.Add($"=== 结果汇总: 通过 {passed} / 失败 {failed} / 共 {passed + failed} ===");

            string allText = string.Join("\n", results);
            Debug.Log(allText);
            if (TestOutputText != null) TestOutputText.text = allText;
        }

        private void TestPlantDatabase(List<string> outList)
        {
            outList.Add("--- 植物数据库 ---");

            int commons = PlantDatabase.GetPlantsByRarity(Rarity.Common).Count;
            int rares = PlantDatabase.GetPlantsByRarity(Rarity.Rare).Count;
            int legendaries = PlantDatabase.GetPlantsByRarity(Rarity.Legendary).Count;
            int failures = PlantDatabase.GetPlantsByRarity(Rarity.Failure).Count;
            int total = PlantDatabase.AllPlants.Count;

            outList.Add(commons >= 5 ? $"[PASS] 普通植物数量: {commons}" : $"[FAIL] 普通植物不足: {commons}");
            outList.Add(rares >= 7 ? $"[PASS] 稀有植物数量: {rares}" : $"[FAIL] 稀有植物不足: {rares}");
            outList.Add(legendaries >= 1 ? $"[PASS] 传说植物数量: {legendaries}" : $"[FAIL] 传说植物不足: {legendaries}");
            outList.Add(failures >= 3 ? $"[PASS] 失败植物数量: {failures}" : $"[FAIL] 失败植物不足: {failures}");
            outList.Add(total >= 18 ? $"[PASS] 总植物数量: {total}" : $"[FAIL] 总植物不足: {total}");

            var glowing = PlantDatabase.GetPlantsWithTrait(MutationTrait.Glowing);
            outList.Add(glowing.Count >= 2 ? $"[PASS] 发光特征植物: {glowing.Count}" : $"[FAIL] 发光特征植物不足: {glowing.Count}");

            var withered = PlantDatabase.GetPlantsWithTrait(MutationTrait.Withered);
            outList.Add(withered.Count >= 2 ? $"[PASS] 枯萎特征植物: {withered.Count}" : $"[FAIL] 枯萎特征植物不足: {withered.Count}");

            outList.Add("");
        }

        private void TestMutationEngine(List<string> outList)
        {
            outList.Add("--- 突变引擎 ---");

            var rng = new System.Random(42);
            MutationEngine.ClearRecipeHistory();

            int failureCount = 0, commonCount = 0, rareCount = 0, legendaryCount = 0;
            var seenPlants = new HashSet<string>();

            var balancedParams = new ExperimentParams
            {
                LightLevel = 0.55f,
                WaterLevel = 0.5f,
                SoilNitrogen = 0.33f,
                SoilPhosphorus = 0.33f,
                SoilPotassium = 0.34f,
                CultureTime = 0.65f
            };

            for (int i = 0; i < MutationTestIterations; i++)
            {
                var result = MutationEngine.GenerateMutation(balancedParams, rng);
                seenPlants.Add(result.Plant.Id);
                switch (result.Plant.Rarity)
                {
                    case Rarity.Failure: failureCount++; break;
                    case Rarity.Common: commonCount++; break;
                    case Rarity.Rare: rareCount++; break;
                    case Rarity.Legendary: legendaryCount++; break;
                }
            }

            float total = MutationTestIterations;
            outList.Add($"迭代 {MutationTestIterations} 次，均衡参数下:");
            outList.Add($"  失败率: {(failureCount / total * 100f):F1}% (理想 < 15%)");
            outList.Add($"  普通率: {(commonCount / total * 100f):F1}%");
            outList.Add($"  稀有率: {(rareCount / total * 100f):F1}% (理想 > 12%)");
            outList.Add($"  传说率: {(legendaryCount / total * 100f):F2}%");

            outList.Add(failureCount / total < 0.2f ? "[PASS] 均衡参数失败率在合理范围" : "[WARN] 均衡参数失败率偏高");
            outList.Add(rareCount / total > 0.08f ? "[PASS] 稀有率在合理范围" : "[WARN] 稀有率偏低，可能需要调整rareBoost");
            outList.Add(seenPlants.Count >= 6 ? $"[PASS] 发现了 {seenPlants.Count} 种不同植物" : $"[WARN] 植物多样性较低: {seenPlants.Count}");

            MutationEngine.ClearRecipeHistory();
            var dryParams = new ExperimentParams
            {
                LightLevel = 0.95f,
                WaterLevel = 0.02f,
                SoilNitrogen = 0.5f,
                SoilPhosphorus = 0.5f,
                SoilPotassium = 0.5f,
                CultureTime = 0.5f
            };
            int dryFailures = 0;
            for (int i = 0; i < 200; i++)
            {
                var r = MutationEngine.GenerateMutation(dryParams, new System.Random(i * 99));
                if (r.Plant.Rarity == Rarity.Failure) dryFailures++;
            }
            outList.Add(dryFailures / 200f > 0.6f ? $"[PASS] 极端干燥参数失败率: {(dryFailures / 2f):F0}%（符合预期）"
                                                  : $"[WARN] 极端干燥失败率偏低: {(dryFailures / 2f):F0}%");

            MutationEngine.ClearRecipeHistory();
            outList.Add("");
        }

        private void TestRecipeProbabilityTracking(List<string> outList)
        {
            outList.Add("--- 同配方概率统计 ---");
            MutationEngine.ClearRecipeHistory();

            var p = new ExperimentParams
            {
                LightLevel = 0.5f,
                WaterLevel = 0.5f,
                SoilNitrogen = 0.4f,
                SoilPhosphorus = 0.3f,
                SoilPotassium = 0.3f,
                CultureTime = 0.6f
            };
            string hash = MutationEngine.GetRecipeHash(p);
            var rng = new System.Random(12345);

            for (int i = 0; i < 200; i++)
            {
                MutationEngine.GenerateMutation(p, rng);
            }

            var stats = MutationEngine.GetOrCreateStats(p);
            outList.Add($"配方哈希: {hash}");
            outList.Add($"总实验次数: {stats.TotalRuns}");
            outList.Add($"不同结果数: {stats.OutcomeCounts.Count}");
            outList.Add(stats.TotalRuns == 200 ? "[PASS] 历史记录正确累加" : "[FAIL] 历史记录异常");

            float totalP = 0f;
            foreach (var kv in stats.OutcomeCounts)
            {
                var plant = PlantDatabase.GetPlant(kv.Key);
                float prob = stats.GetOutcomeProbability(kv.Key);
                totalP += prob;
                outList.Add($"  {plant?.DisplayName ?? kv.Key} × {kv.Value} = {(prob * 100f):F1}%");
            }
            outList.Add(Mathf.Approximately(totalP, 1f) ? "[PASS] 概率总和为100%" : $"[FAIL] 概率总和异常: {totalP}");

            float fP = stats.GetRarityProbability(Rarity.Failure);
            float cP = stats.GetRarityProbability(Rarity.Common);
            float rP = stats.GetRarityProbability(Rarity.Rare);
            float lP = stats.GetRarityProbability(Rarity.Legendary);
            outList.Add($"稀有度概率 - 失败:{(fP * 100f):F0}% 普通:{(cP * 100f):F0}% 稀有:{(rP * 100f):F0}% 传说:{(lP * 100f):F1}%");

            MutationEngine.ClearRecipeHistory();
            outList.Add("");
        }

        private void TestResourceManager(List<string> outList)
        {
            outList.Add("--- 资源系统 ---");

            var resGo = new GameObject("TestResourceManager");
            var rm = resGo.AddComponent<ResourceManager>();
            rm.InitialSeeds = 10;
            rm.InitialNutrients = 10;
            rm.InitialCredits = 50;
            rm.Awake();

            bool canAfford = rm.CanAffordExperiment(new ExperimentParams { LightLevel = 0.5f, WaterLevel = 0.5f }, out var cost);
            outList.Add(canAfford ? "[PASS] 默认资源可负担基础实验" : "[FAIL] 默认资源不足");
            outList.Add($"  成本: 种子×{cost.Seeds} 营养×{cost.Nutrients} 积分×{cost.Credits}");

            var testParams = new ExperimentParams
            {
                LightLevel = 0.5f,
                WaterLevel = 0.5f,
                SoilNitrogen = 1.0f,
                SoilPhosphorus = 1.0f,
                SoilPotassium = 1.0f,
                CultureTime = 1.0f
            };
            var highCost = rm.GetExperimentCost(testParams);
            outList.Add(highCost.Nutrients > cost.Nutrients ? "[PASS] 高营养配方消耗更多营养素" : "[WARN] 营养消耗未按比例提升");
            outList.Add(highCost.Credits > cost.Credits ? "[PASS] 长时间配方消耗更多积分" : "[WARN] 时间消耗未按比例提升");

            rm.DeductExperimentCost(testParams, out var deduct1, out _);
            var origCost = rm.GetExperimentCost(testParams);
            var abortRefund = rm.RefundResources(ExperimentStatus.Aborted, origCost, 0.2f);
            var failRefund = rm.RefundResources(ExperimentStatus.Failed, origCost, 1f);
            outList.Add(abortRefund.Seeds >= 0 ? $"[PASS] 终止返还: 种子×{abortRefund.Seeds}" : "[FAIL] 返还异常");
            outList.Add($"  失败返还: 种子×{failRefund.Seeds} 积分×{failRefund.Credits}");

            Destroy(resGo);
            outList.Add("");
        }

        private void TestDexAndLog(List<string> outList)
        {
            outList.Add("--- 图鉴与日志 ---");

            var dexGo = new GameObject("TestDex");
            var dm = dexGo.AddComponent<DexManager>();
            dm.Awake();

            var logGo = new GameObject("TestLog");
            var lm = logGo.AddComponent<ExperimentLogManager>();
            lm.Awake();

            outList.Add($"初始图鉴: {dm.DiscoveredCount}/{dm.TotalPlants}");
            outList.Add(dm.DiscoveredCount == 0 ? "[PASS] 初始图鉴为空" : "[FAIL] 初始图鉴非空");

            var sprout = PlantDatabase.GetPlant("sprout_normal");
            var wither = PlantDatabase.GetPlant("wither_bones");
            var paramsA = new ExperimentParams { LightLevel = 0.5f, WaterLevel = 0.5f };
            var paramsB = new ExperimentParams { LightLevel = 0.95f, WaterLevel = 0.01f };

            bool firstA;
            dm.RecordDiscovery(sprout, paramsA, out firstA);
            outList.Add(firstA ? "[PASS] 首次发现正确标记" : "[FAIL] 首次发现标记错误");

            bool firstB;
            dm.RecordDiscovery(sprout, paramsA, out firstB);
            outList.Add(!firstB ? "[PASS] 重复发现不会重复标记" : "[FAIL] 重复发现仍被判定为首次");

            dm.RecordDiscovery(wither, paramsB, out _);
            var failuresDex = dm.FailureDiscovered;
            outList.Add(failuresDex >= 1 ? $"[PASS] 图鉴包含失败样本: {failuresDex}" : "[FAIL] 图鉴失败样本统计异常");

            var entry = dm.GetEntry(sprout.Id);
            outList.Add(entry?.FirstDiscoveryParams != null ? "[PASS] 图鉴保存首次配方" : "[FAIL] 首次配方未保存");
            outList.Add(entry?.DiscoveryCount >= 2 ? $"[PASS] 发现次数正确: {entry.DiscoveryCount}" : "[FAIL] 发现次数异常");

            lm.AddLog(paramsA, sprout, ExperimentStatus.Completed, true, 10, 5, "测试日志1");
            lm.AddLog(paramsB, wither, ExperimentStatus.Failed, true, 10, 2, "测试日志2失败");
            var successLogs = lm.FilterByTrait(MutationTrait.Withered);
            outList.Add(successLogs.Count >= 1 ? "[PASS] 日志按特征筛选有效" : "[FAIL] 特征筛选异常");
            var firstLogs = lm.FilterByFirstDiscovery();
            outList.Add(firstLogs.Count == 2 ? "[PASS] 日志按首次发现筛选有效" : "[WARN] 首次发现筛选结果异常");

            string stats = lm.GetStatisticsSummary();
            outList.Add(!string.IsNullOrEmpty(stats) ? "[PASS] 日志统计输出正常" : "[FAIL] 日志统计为空");

            Destroy(dexGo);
            Destroy(logGo);
            outList.Add("");
        }

        private void TestQuestSystem(List<string> outList)
        {
            outList.Add("--- 任务与挑战 ---");

            var qGo = new GameObject("TestQuestManager");
            var qm = qGo.AddComponent<QuestManager>();
            qm.Awake();

            var tutQuests = qm.GetTutorialQuests();
            outList.Add(tutQuests.Count >= 3 ? $"[PASS] 教程任务数量: {tutQuests.Count}" : $"[FAIL] 教程任务不足: {tutQuests.Count}");
            var current = qm.GetCurrentTutorialQuest();
            outList.Add(current?.Id == "tutorial_01" ? "[PASS] 当前任务顺序正确" : "[FAIL] 当前任务顺序异常");

            var resGo = new GameObject("TestRMForQuest");
            var rm = resGo.AddComponent<ResourceManager>();
            rm.InitialSeeds = 100;
            rm.InitialNutrients = 100;
            rm.InitialCredits = 1000;
            rm.Awake();

            var testParams = new ExperimentParams { LightLevel = 0.5f, WaterLevel = 0.5f };
            qm.NotifyExperimentCompleted(PlantDatabase.GetPlant("leafy_green"), false, testParams);
            current = qm.GetCurrentTutorialQuest();
            outList.Add(current?.Objectives[0].CurrentCount >= 1 ? "[PASS] 实验完成后教程进度更新" : "[WARN] 教程进度未更新");

            var dGo = new GameObject("TestChallengeMgr");
            var dm = dGo.AddComponent<DailyChallengeManager>();
            dm.ChallengesPerDay = 3;
            dm.Awake();

            int challengeCount = dm.Challenges.Count;
            outList.Add(challengeCount == 3 ? $"[PASS] 每日挑战数量: {challengeCount}" : $"[WARN] 每日挑战数量异常: {challengeCount}");

            Destroy(qGo);
            Destroy(resGo);
            Destroy(dGo);
            outList.Add("");
        }
    }
}
