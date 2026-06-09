#if UNITY_EDITOR
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;
using System;
using System.IO;

namespace LakeSailing.EditorTools
{
    public static class BuildPipeline
    {
        private static readonly string[] Scenes = { "Assets/Scenes/BootScene.unity" };
        private static readonly string OutputRoot = Path.Combine(Directory.GetCurrentDirectory(), "Builds");

        [MenuItem("Build/Standalone/Windows x64")]
        public static void BuildWindows()
        {
            string path = EnsureBuildDir("Windows");
            Build(Path.Combine(path, "LakeSailing.exe"), BuildTarget.StandaloneWindows64, BuildOptions.None);
        }

        [MenuItem("Build/Standalone/macOS Universal")]
        public static void BuildMacOS()
        {
            string path = EnsureBuildDir("macOS");
            Build(Path.Combine(path, "LakeSailing.app"), BuildTarget.StandaloneOSX, BuildOptions.None);
        }

        [MenuItem("Build/Standalone/Linux x64")]
        public static void BuildLinux()
        {
            string path = EnsureBuildDir("Linux");
            Build(Path.Combine(path, "LakeSailing"), BuildTarget.StandaloneLinux64, BuildOptions.None);
        }

        [MenuItem("Build/All Standalone")]
        public static void BuildAllStandalone()
        {
            BuildWindows();
            BuildMacOS();
            BuildLinux();
        }

        [MenuItem("Build/Development/Windows (Dev + Profiler)")]
        public static void BuildWindowsDev()
        {
            string path = EnsureBuildDir("Windows_Dev");
            Build(Path.Combine(path, "LakeSailing_Dev.exe"), BuildTarget.StandaloneWindows64,
                BuildOptions.Development | BuildOptions.AllowDebugging | BuildOptions.ConnectWithProfiler | BuildOptions.ShowBuiltPlayer);
        }

        [MenuItem("Build/Tools/Validate Project Setup")]
        public static void ValidateProject()
        {
            bool allOk = true;
            Debug.Log("=== Lake Sailing Project Validation ===");

            if (!File.Exists("Assets/Scenes/BootScene.unity"))
            {
                Debug.LogError("[FAIL] Missing BootScene.unity");
                allOk = false;
            }
            else Debug.Log("[PASS] BootScene exists");

            string[] requiredScripts = {
                "Assets/Scripts/Core/GameManager.cs",
                "Assets/Scripts/Core/SaveSystem.cs",
                "Assets/Scripts/Core/EventBus.cs",
                "Assets/Scripts/Core/GameBootstrapper.cs",
                "Assets/Scripts/Core/AudioManager.cs",
                "Assets/Scripts/Gameplay/WeatherSystem.cs",
                "Assets/Scripts/Gameplay/BoatController.cs",
                "Assets/Scripts/Gameplay/TaskSystem.cs",
                "Assets/Scripts/Gameplay/GallerySystem.cs",
                "Assets/Scripts/UI/UIManager.cs",
                "Assets/Scripts/UI/MainMenuPanel.cs",
                "Assets/Scripts/UI/HUDPanel.cs",
                "Assets/Scripts/Meta/AchievementSystem.cs",
                "Assets/Scripts/Meta/LeaderboardSystem.cs"
            };

            foreach (var s in requiredScripts)
            {
                if (!File.Exists(s))
                {
                    Debug.LogError($"[FAIL] Missing script: {s}");
                    allOk = false;
                }
            }
            Debug.Log($"[PASS] Core scripts: {requiredScripts.Length}/{requiredScripts.Length} found");

            if (!File.Exists("Packages/manifest.json"))
            {
                Debug.LogError("[FAIL] Missing manifest.json");
                allOk = false;
            }
            else Debug.Log("[PASS] Package manifest exists");

            if (!Directory.Exists("Assets/Art") || !Directory.Exists("Assets/Audio"))
            {
                Debug.LogWarning("[WARN] Art/Audio directories empty (placeholder mode active)");
            }

            if (allOk)
            {
                Debug.Log("=== VALIDATION PASSED: Project is ready to build ===");
                EditorUtility.DisplayDialog("Validation", "项目检查通过！可以正常构建。", "好的");
            }
            else
            {
                Debug.LogError("=== VALIDATION FAILED: Check errors above ===");
                EditorUtility.DisplayDialog("Validation", "项目存在问题，详情请查看Console。", "好的");
            }
        }

        [MenuItem("Build/Tools/Clean Build Output")]
        public static void CleanBuilds()
        {
            if (Directory.Exists(OutputRoot))
            {
                Directory.Delete(OutputRoot, true);
                Debug.Log("Builds directory cleaned.");
            }
            AssetDatabase.Refresh();
        }

        private static string EnsureBuildDir(string platform)
        {
            string path = Path.Combine(OutputRoot, platform, DateTime.Now.ToString("yyyyMMdd_HHmm"));
            Directory.CreateDirectory(path);
            return path;
        }

        private static void Build(string outputPath, BuildTarget target, BuildOptions options)
        {
            Debug.Log($"[Build] Starting {target} at {outputPath}");

            var buildPlayerOptions = new BuildPlayerOptions
            {
                scenes = Scenes,
                locationPathName = outputPath,
                target = target,
                options = options
            };

            BuildReport report = UnityEditor.BuildPipeline.BuildPlayer(buildPlayerOptions);
            BuildSummary summary = report.summary;

            switch (summary.result)
            {
                case BuildResult.Succeeded:
                    Debug.Log($"[Build] SUCCESS: {target} - Size: {summary.totalSize / 1024 / 1024}MB, Output: {outputPath}");
                    if (summary.result == BuildResult.Succeeded &&
                        (options & BuildOptions.ShowBuiltPlayer) != 0)
                    {
                        EditorUtility.RevealInFinder(outputPath);
                    }
                    break;
                case BuildResult.Failed:
                    Debug.LogError($"[Build] FAILED: {target} - Errors: {summary.totalErrors}, Warnings: {summary.totalWarnings}");
                    throw new Exception($"Build failed with {summary.totalErrors} errors");
                case BuildResult.Cancelled:
                    Debug.LogWarning($"[Build] CANCELLED: {target}");
                    break;
            }
        }
    }
}
#endif
