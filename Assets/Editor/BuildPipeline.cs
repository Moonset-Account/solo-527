#if UNITY_EDITOR
using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;

namespace KitchenChaos.EditorTools
{
    public static class BuildPipeline
    {
        static readonly string[] Scenes =
        {
            "Assets/Scenes/Main.unity",
        };

        [MenuItem("KitchenChaos/Build/Windows (x64)")]
        public static void BuildWindows()
        {
            var target = BuildTarget.StandaloneWindows64;
            var path = EnsureDir("Builds/Win64/KitchenChaos.exe");
            DoBuild(target, path);
        }

        [MenuItem("KitchenChaos/Build/macOS (Apple Silicon)")]
        public static void BuildMac()
        {
            var target = BuildTarget.StandaloneOSX;
            var path = EnsureDir("Builds/macOS/KitchenChaos.app");
            DoBuild(target, path);
        }

        [MenuItem("KitchenChaos/Build/All Targets")]
        public static void BuildAll()
        {
            BuildWindows();
            BuildMac();
        }

        [MenuItem("KitchenChaos/Validation/Verify Level Configs")]
        public static void ValidateLevels()
        {
            var configs = Resources.LoadAll<Config.LevelConfig>("");
            Debug.Log($"找到 {configs.Length} 个关卡配置");
            int errors = 0;
            foreach (var lvl in configs)
            {
                var result = ValidateLevel(lvl);
                if (result.Valid) continue;
                errors++;
                Debug.LogError($"[关卡错误] {lvl.name}: {string.Join("; ", result.Errors)}");
            }
            if (errors == 0) Debug.Log("✅ 所有关卡验证通过！");
            else Debug.LogError($"❌ 发现 {errors} 个关卡配置错误");
        }

        [MenuItem("KitchenChaos/Validation/Run Main Loop Simulation")]
        public static void RunMainLoopSim()
        {
            var gm = new GameObject("_BootSim").AddComponent<Bootstrap.GameBootstrap>();
            Debug.Log("🚀 启动模拟：请在 Unity 中按 Play 测试主循环。");
        }

        static string EnsureDir(string rel)
        {
            var full = Path.Combine(Directory.GetCurrentDirectory(), rel);
            Directory.CreateDirectory(Path.GetDirectoryName(full));
            return full;
        }

        static void DoBuild(BuildTarget target, string path)
        {
            var options = new BuildPlayerOptions
            {
                scenes = Scenes.Where(File.Exists).ToArray(),
                locationPathName = path,
                target = target,
                options = BuildOptions.None
            };
            var report = UnityEditor.BuildPipeline.BuildPlayer(options);
            if (report.summary.result == BuildResult.Succeeded)
                Debug.Log($"✅ 构建成功: {path} ({report.summary.totalSize / 1048576} MB)");
            else
                Debug.LogError($"❌ 构建失败: {report.summary.result}");
        }

        public static LevelValidationResult ValidateLevel(Config.LevelConfig lvl)
        {
            var r = new LevelValidationResult();
            if (lvl.StarThresholds == null || lvl.StarThresholds.Length != 3)
                r.Errors.Add("StarThresholds 必须是 3 个值");
            if (lvl.Duration < 30) r.Errors.Add("Duration 太短 (<30s)");
            if (lvl.PlayerSpawnPoints == null || lvl.PlayerSpawnPoints.Length == 0)
                r.Errors.Add("缺少 PlayerSpawnPoints");
            if (lvl.AvailableRecipeNames == null || lvl.AvailableRecipeNames.Length == 0)
                r.Errors.Add("食谱池为空");
            if (lvl.StationPlacements == null || lvl.StationPlacements.Length == 0)
                r.Errors.Add("关卡未放置任何工作台");
            if (lvl.MaxPlayersInLevel < 1) r.Errors.Add("MaxPlayersInLevel < 1");
            r.Valid = r.Errors.Count == 0;
            return r;
        }

        public class LevelValidationResult
        {
            public bool Valid;
            public readonly List<string> Errors = new();
        }
    }
}
#endif
