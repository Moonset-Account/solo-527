using System;
using System.Collections;
using UnityEngine;
using TeaGardenDefense.Core;
using TeaGardenDefense.Config;

namespace TeaGardenDefense
{
    public class GameBootstrap : MonoBehaviour
    {
        [SerializeField] private string _defaultLevelId = "level_1";
        [SerializeField] private bool _runSelfTest = false;
        [SerializeField] private bool _exportConfigJson = true;
        [SerializeField] private bool _testMode = false;

        private int _savedFailureL1;
        private bool _savedHasCompletedL1;
        private TeaGardenDefense.Core.LevelCompletionData _savedCompletionL1;
        private int _savedBaseHealth;
        private int _savedGold;

        private void Awake()
        {
            Application.runInBackground = true;

            if (GameManager.Instance == null)
            {
                var go = new GameObject("[GameManager]");
                go.AddComponent<GameManager>();
            }

            if (FindObjectOfType<DebugConsole>() == null)
            {
                gameObject.AddComponent<DebugConsole>();
            }
        }

        private IEnumerator Start()
        {
            yield return new WaitUntil(() => ConfigManager.Instance.IsLoaded);
            yield return null;

            if (_exportConfigJson)
            {
                ExportConfigToFile();
            }

            if (_runSelfTest)
            {
                StartCoroutine(RunQuickSelfTest());
            }
        }

        private void ExportConfigToFile()
        {
            try
            {
                ConfigManager.Instance.SaveConfigToDisk();
                Debug.Log("[Bootstrap] 配置文件已导出到 StreamingAssets/Config/game_config.json");
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[Bootstrap] 配置导出失败: {e.Message}");
            }
        }

        private IEnumerator RunQuickSelfTest()
        {
            Debug.Log("=== 茶园塔防 自检开始 (测试模式，不污染存档) ===");
            yield return new WaitForSeconds(0.3f);

            SaveProductionState();

            Test_ConfigLoading();
            yield return new WaitForSeconds(0.1f);

            Test_InputFeedback();
            yield return new WaitForSeconds(0.1f);

            Test_SaveAndSettlement();
            yield return new WaitForSeconds(0.1f);

            Test_GameStateTransition();
            yield return new WaitForSeconds(0.1f);

            Test_WaveAndEnemySystem();
            yield return new WaitForSeconds(0.1f);

            RestoreProductionState();
            ResetGameplaySystemsIfNeeded();

            Debug.Log("=== 茶园塔防 自检完成 (状态已还原) ===");
        }

        private void SaveProductionState()
        {
            try
            {
                var save = SaveSystem.Instance;
                _savedFailureL1 = save.FailureCounts.ContainsKey("level_1") ? save.FailureCounts["level_1"] : 0;
                _savedHasCompletedL1 = save.HasLevelCompleted("level_1");
                _savedCompletionL1 = save.GetLevelCompletion("level_1");
                if (GameManager.Instance != null && GameManager.Instance.Resources != null)
                {
                    _savedBaseHealth = GameManager.Instance.Resources.BaseHealth;
                    _savedGold = GameManager.Instance.Resources.Gold;
                }
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[SelfTest] 保存状态失败: {e.Message}");
            }
        }

        private void RestoreProductionState()
        {
            try
            {
                var save = SaveSystem.Instance;
                if (save.FailureCounts.ContainsKey("level_1"))
                    save.FailureCounts["level_1"] = _savedFailureL1;
                else if (_savedFailureL1 > 0)
                    save.FailureCounts["level_1"] = _savedFailureL1;
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[SelfTest] 还原状态失败: {e.Message}");
            }
        }

        private void ResetGameplaySystemsIfNeeded()
        {
            try
            {
                var gm = GameManager.Instance;
                if (gm != null && gm.CurrentLevel != null)
                {
                    gm.LoadLevel(gm.CurrentLevel.levelId);
                    Debug.Log("[SelfTest] 已重置游戏状态到关卡开局");
                }
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[SelfTest] 重置关卡失败: {e.Message}");
            }
        }

        private void Test_ConfigLoading()
        {
            var configs = ConfigManager.Instance;
            Debug.Log($"[1/5] 配置加载: {configs.IsLoaded}");
            Debug.Log($"      关卡数: {configs.GetAllLevels().Count}");
            Debug.Log($"      塔类型数: {configs.GetAllTowers().Count}");

            for (int i = 1; i <= 3; i++)
            {
                var level = configs.GetLevelConfig($"level_{i}");
                if (level != null)
                {
                    Debug.Log($"      关卡{i} ({level.levelName}): " +
                              $"路径{level.pathPoints.Count}点, " +
                              $"塔位{level.towerSlots.Count}个, " +
                              $"波次{level.waves.Count}波, " +
                              $"可用塔{level.availableTowerIds.Count}种, " +
                              $"天气{level.weatherPatterns.Count}种, " +
                              $"失败原因{level.failedReasons.Count}条");
                }
            }

            var tower = configs.GetTowerConfig("tea_archer");
            Debug.Log($"      茶农弓手: Lv1伤害{tower.levels[0].damage}, 成本{tower.baseCost}金");

            var enemy = configs.GetEnemyConfig("boss_queen");
            Debug.Log($"      Boss蚂蚁后: 血量{enemy.baseHealth}, 伤害{enemy.damageToBase}");

            var settings = configs.GetGlobalSettings();
            Debug.Log($"      全局设置: 帧率{settings.targetFrameRate}Hz, 自动保存{settings.autoSaveIntervalSeconds}秒");
        }

        private void Test_InputFeedback()
        {
            Debug.Log("[2/5] 输入映射测试:");
            var input = InputManager.Instance;

            Debug.Log($"      start_wave (开始波次): {input.GetKeyDisplayString("start_wave")}");
            Debug.Log($"      speed_up (加速): {input.GetKeyDisplayString("speed_up")}");
            Debug.Log($"      pause (暂停): {input.GetKeyDisplayString("pause")}");
            Debug.Log($"      upgrade_tower (升级): {input.GetKeyDisplayString("upgrade_tower")}");
            Debug.Log($"      sell_tower (出售): {input.GetKeyDisplayString("sell_tower")}");
            Debug.Log($"      select_tower_1~5: 数字键 1-5 / 小键盘 1-5");

            input.OnActionPressed += action =>
            {
                Debug.Log($"[输入反馈] 按键触发: {action} (时间: {Time.time:F2}s)");
            };
        }

        private void Test_SaveAndSettlement()
        {
            Debug.Log("[3/5] 存档与结算系统测试:");
            var save = SaveSystem.Instance;

            Debug.Log($"      玩家ID: {save.PlayerData?.playerId?.Substring(0, 8)}...");
            Debug.Log($"      已解锁关卡: {string.Join(", ", save.PlayerData.unlockedLevels)}");
            Debug.Log($"      显示FPS: {save.PlayerData.settings.showFPS}");
            Debug.Log($"      启用教程: {save.PlayerData.settings.showTutorial}");
            Debug.Log($"      目标帧率: {save.PlayerData.settings.targetFrameRate}Hz");
            Debug.Log($"      输入映射数: {save.InputMappings.Count}");
            Debug.Log($"      累计失败: {save.PlayerData.totalFailures}次");
            Debug.Log($"      总游戏时长: {save.PlayerData.totalPlayTimeSeconds:F0}秒");

            save.OnSaveSuccess += type => Debug.Log($"[存档] 保存成功: {type}");
            save.OnSaveFailed += type => Debug.LogWarning($"[存档] 操作失败: {type}");

            int failCountBefore = save.FailureCounts.ContainsKey("level_1") ? save.FailureCounts["level_1"] : 0;
            Debug.Log($"      存档中level_1失败次数: {failCountBefore}次（仅读取不修改）");

            Debug.Log($"      关卡1状态: {(save.HasLevelCompleted("level_1") ? "已通关" : "未通关")}");
        }

        private void Test_GameStateTransition()
        {
            Debug.Log("[4/5] 游戏状态与管理器连通性:");
            var gm = GameManager.Instance;
            if (gm == null)
            {
                Debug.LogWarning("      GameManager未初始化!");
                return;
            }

            Debug.Log($"      状态: {gm.CurrentState}");
            Debug.Log($"      资源系统: {(gm.Resources != null ? "OK" : "FAIL")}");
            Debug.Log($"      路径系统: {(gm.Path != null ? "OK" : "FAIL")}");
            Debug.Log($"      敌人系统: {(gm.Enemies != null ? "OK" : "FAIL")}");
            Debug.Log($"      塔系统: {(gm.Towers != null ? "OK" : "FAIL")}");
            Debug.Log($"      波次系统: {(gm.Waves != null ? "OK" : "FAIL")}");
            Debug.Log($"      天气系统: {(gm.Weather != null ? "OK" : "FAIL")}");
            Debug.Log($"      教程系统: {(gm.Tutorial != null ? "OK" : "FAIL")}");
            Debug.Log($"      提示系统: {(gm.Hints != null ? "OK" : "FAIL")}");
            Debug.Log($"      结算系统: {(gm.Settlement != null ? "OK" : "FAIL")}");

            gm.OnTowerSelected += id => Debug.Log($"[事件] 塔选择事件: {id}");
            gm.OnSlotSelected += id => Debug.Log($"[事件] 塔位选择事件: {id}");
            gm.OnGameStateChanged += state => Debug.Log($"[事件] 状态切换: {state}");

            if (gm.CurrentLevel != null)
            {
                Debug.Log($"      当前关卡: {gm.CurrentLevel.levelName}");
                Debug.Log($"      初始金币: {gm.Resources.Gold}");
                Debug.Log($"      初始基地血量: {gm.Resources.BaseHealth}");
            }
        }

        private void Test_WaveAndEnemySystem()
        {
            Debug.Log("[5/5] 波次与敌人系统测试:");
            var gm = GameManager.Instance;
            if (gm == null || gm.Waves == null)
            {
                Debug.LogWarning("      系统未就绪");
                return;
            }

            Debug.Log($"      总波次: {gm.Waves.TotalWaves}");
            Debug.Log($"      当前波次: {gm.Waves.CurrentWaveNumber}");

            var towerSlots = gm.Towers.GetAllSlots();
            int unlocked = 0;
            foreach (var slot in towerSlots)
            {
                if (slot.isUnlocked) unlocked++;
            }
            Debug.Log($"      塔位: {towerSlots.Count}个, 已解锁{unlocked}个");

            Debug.Log("\n=== 验收提示 ===");
            Debug.Log("✅ 按 空格键 测试「输入反馈」(start_wave)");
            Debug.Log("✅ 按 Shift 键 测试「加速切换」(speed_up)");
            Debug.Log("✅ 按 U 键 测试「升级塔」(需先选塔)");
            Debug.Log("✅ 按 ESC 键 测试「暂停」(pause)");
            Debug.Log("✅ 按 F1 键 打开调试控制台");
            Debug.Log("✅ 按 F5 键 重新开始关卡");
            Debug.Log("✅ 按 F6 键 切换下一关");
            Debug.Log("✅ 检查 Debug.Log 中「存档状态」确认存档工作");
            Debug.Log("✅ 完成/失败关卡后查看「结算数据」");
        }
    }
}
