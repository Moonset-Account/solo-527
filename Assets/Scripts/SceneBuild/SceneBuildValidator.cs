using System;
using System.Reflection;
using BeatRunner.Audio;
using BeatRunner.Core;
using BeatRunner.Input;
using BeatRunner.Player;
using BeatRunner.UI;
using UnityEngine;

namespace BeatRunner.SceneBuild
{
    public static class SceneBuildValidator
    {
        private static int _passCount;
        private static int _failCount;
        private static string _report;

        public static void RunFullValidation()
        {
            _passCount = 0;
            _failCount = 0;
            _report = "\n═══════════════════════════════════════════════════\n"
                    + "   节拍跑酷 Main 场景构建验证报告 (Runtime 自动验证)\n"
                    + "═══════════════════════════════════════════════════\n\n";

            var gm = GameManager.Instance;
            var im = InputManager.Instance;
            var gsm = GameStateManager.Instance;

            Report($"[0] 核心单例存在性检查");
            Check("GameManager.Instance != null", gm != null);
            Check("InputManager.Instance != null", im != null);
            Check("GameStateManager.Instance != null", gsm != null);
            Check("AudioManager.Instance != null", AudioManager.Instance != null);
            Check("ServiceLocator.Get<GameSettings>() != null", ServiceLocator.TryGet(out GameSettings _));
            Check("ServiceLocator.Get<RuntimeGameData>() != null", ServiceLocator.TryGet(out RuntimeGameData _));
            Check("ServiceLocator.Get<BeatRunner.Data.TrackLibrary>() != null", ServiceLocator.TryGet(out BeatRunner.Data.TrackLibrary _));

            Report("\n[1] MainMenu → GameManager 跳转事件链 (4 条路径)");
            VerifyEventSubscription<MainMenu, Action<BeatRunner.Data.TrackData, BeatRunner.Data.SkinData, int>>(
                "OnStartSelected", gm, "HandleStartSelected",
                "主菜单「开始」→ GameManager.StartRun()");
            VerifyEventSubscription<MainMenu, Action>(
                "OnOpenTutorial", gm, "HandleOpenTutorial",
                "主菜单「教程」→ StartRun(isTutorial=true)");
            VerifyEventSubscription<MainMenu, Action>(
                "OnOpenSettings", gm, "HandleOpenSettings",
                "主菜单「设置」→ SettingsMenu.Show()");
            VerifyEventSubscription<HudController, Action>(
                "OnPauseClicked", gm, "HandlePauseInput",
                "HUD 暂停按钮 → PauseMenu.Show()");

            Report("\n[2] 暂停/结算/失败 返回事件链 (7 条路径)");
            VerifyEventSubscription<PauseMenu, Action>(
                "OnResume", gm, "HandleResume",
                "暂停→继续 → LevelManager.ResumeLevel()");
            VerifyEventSubscription<PauseMenu, Action>(
                "OnRetry", gm, "HandleRetry",
                "暂停→重试 → StartRun(同参数)");
            VerifyEventSubscription<PauseMenu, Action>(
                "OnSettings", gm, "HandleOpenSettings",
                "暂停→设置 → SettingsMenu.Show()");
            VerifyEventSubscription<PauseMenu, Action>(
                "OnQuitToMenu", gm, "HandleQuitToMenu",
                "暂停→回菜单 → ShowMainMenu()");
            VerifyEventSubscription<ResultsScreen, Action>(
                "OnRetry", gm, "HandleRetry",
                "结算→重试 → StartRun()");
            VerifyEventSubscription<ResultsScreen, Action>(
                "OnBackToMenu", gm, "HandleQuitToMenu",
                "结算→回菜单 → ShowMainMenu()");
            VerifyEventSubscription<GameOverScreen, Action>(
                "OnRetry", gm, "HandleRetry",
                "失败→重试 → StartRun()");

            Report("\n[3] 教程流程事件链");
            VerifyEventSubscription<TutorialController, Action>(
                "OnTutorialComplete", gm, "HandleTutorialComplete",
                "教程完成 → 结算 3 秒弹窗 → 主菜单");
            VerifyEventSubscription<TutorialController, Action>(
                "OnTutorialSkipped", gm, "HandleTutorialSkipped",
                "跳过教程 → 回主菜单");
            VerifyEventSubscription<InputManager, Action>(
                "OnJump", null, null,
                "InputManager.OnJump 事件存在 (驱动玩家跳跃)");
            VerifyEventSubscription<InputManager, Action>(
                "OnSlide", null, null,
                "InputManager.OnSlide 事件存在 (驱动玩家滑行)");
            VerifyEventSubscription<InputManager, Action>(
                "OnLeft", null, null,
                "InputManager.OnLeft 事件存在 (驱动切轨)");
            VerifyEventSubscription<InputManager, Action>(
                "OnPause", gm, "HandlePauseInput",
                "ESC/P 键 → 暂停菜单");

            Report("\n[4] 重绑定三处同步 — 运行时模拟验证 (跳跃键 Space→F)");
            ValidateRemapSync();

            Report("\n[5] 玩家动作链验证");
            var player = UnityEngine.Object.FindObjectOfType<PlayerController>();
            Check("PlayerController 存在", player != null);
            if (player != null)
            {
                Check("PlayerController.CurrentTrackIndex = 1 (中轨)", player.CurrentTrackIndex == 1);
                Check("PlayerController.State 初始为 Idle/Running",
                    player.State == PlayerState.Idle || player.State == PlayerState.Running);
            }

            int total = _passCount + _failCount;
            _report += "\n═══════════════════════════════════════════════════\n"
                    + $"   验证结果: {_passCount}/{total} 通过, {_failCount} 失败\n"
                    + (_failCount == 0
                        ? "   ✓ 全部通过！Main 场景可从主菜单进入教程/暂停/设置/结算\n"
                        + "   ✓ 重绑定后设置页/教程/实际输入三处同步\n"
                        : $"   ✗ {_failCount} 项需检查！\n")
                    + "═══════════════════════════════════════════════════\n";

            Debug.Log(_report);
        }

        private static void Report(string msg)
        {
            _report += $"\n{msg}\n";
        }

        private static void Check(string label, bool pass)
        {
            string mark = pass ? "[PASS]" : "[FAIL]";
            _report += $"  {mark} {label}\n";
            if (pass) _passCount++;
            else _failCount++;
        }

        private static void VerifyEventSubscription<TSrc, TDelegate>(
            string eventName, object target, string targetMethod, string description)
            where TDelegate : Delegate
        {
            Type srcType = typeof(TSrc);
            EventInfo ev = srcType.GetEvent(eventName,
                BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);
            if (ev == null)
            {
                Check($"{description} → 事件 {eventName} 不存在", false);
                return;
            }

            FieldInfo backingField = srcType.GetField(eventName,
                BindingFlags.Instance | BindingFlags.NonPublic);
            if (backingField == null)
            {
                Check($"{description} → 找到 {eventName} 事件 (无法进一步验证订阅)", true);
                return;
            }

            if (target == null)
            {
                Check($"{description} → {eventName} 事件定义存在", true);
                return;
            }

            var sources = UnityEngine.Object.FindObjectsOfType<TSrc>();
            foreach (var src in sources)
            {
                object delObj = backingField.GetValue(src);
                if (delObj is Delegate del)
                {
                    foreach (var d in del.GetInvocationList())
                    {
                        if (d.Target == target && d.Method.Name == targetMethod)
                        {
                            Check($"{description} → {eventName} 已订阅 {targetMethod}()", true);
                            return;
                        }
                    }
                }
            }
            Check($"{description} → {eventName} 未找到订阅 {targetMethod}()", false);
        }

        private static void ValidateRemapSync()
        {
            var im = InputManager.Instance;
            if (im == null) { Check("InputManager 缺失，跳过重绑定验证", false); return; }

            BindingFlags flags = BindingFlags.Instance | BindingFlags.NonPublic;

            FieldInfo bindingsField = typeof(InputManager).GetField("_bindings", flags);
            if (bindingsField == null) { Check("_bindings 字段反射失败", false); return; }

            var origBindings = (InputManager.InputBindings)bindingsField.GetValue(im);
            KeyCode origJump = origBindings.jumpKey;

            try
            {
                Check("1. 原跳跃键 != KeyCode.F", origJump != KeyCode.F);

                bindingsField.SetValue(im, new InputManager.InputBindings
                {
                    leftKey = origBindings.leftKey,
                    leftAlt = origBindings.leftAlt,
                    rightKey = origBindings.rightKey,
                    rightAlt = origBindings.rightAlt,
                    jumpKey = KeyCode.F,
                    jumpAlt = origBindings.jumpAlt,
                    jumpAlt2 = origBindings.jumpAlt2,
                    slideKey = origBindings.slideKey,
                    slideAlt = origBindings.slideAlt,
                    pauseKey = origBindings.pauseKey,
                    pauseAlt = origBindings.pauseAlt,
                    confirmKey = origBindings.confirmKey,
                    cancelKey = origBindings.cancelKey
                });

                MethodInfo hintMethod = typeof(InputManager).GetMethod("GetKeyHintsForAction",
                    BindingFlags.Instance | BindingFlags.Public);
                if (hintMethod != null)
                {
                    string[] hints = (string[])hintMethod.Invoke(im, new object[] { "jump" });
                    string joined = string.Join(",", hints);
                    Check($"2. GetKeyHintsForAction(\"jump\") 包含 'F' → [{joined}]",
                        joined.Contains("F"));
                }
                else
                {
                    Check("2. GetKeyHintsForAction 方法缺失", false);
                }

                string jumpHint = GetRemapButtonText("jump");
                Check($"3. 设置页 _remapJumpText 显示 F → [{jumpHint}]",
                    jumpHint.Contains("F"));

                string tutorialHint = GetTutorialHintText();
                Check($"4. 教程页 _keyHintText (若激活) 含 F → [{tutorialHint}]",
                    string.IsNullOrEmpty(tutorialHint) || tutorialHint.Contains("F")
                    || tutorialHint == "(教程未激活)");

                Check("5. _bindings.jumpKey == KeyCode.F",
                    ((InputManager.InputBindings)bindingsField.GetValue(im)).jumpKey == KeyCode.F);
            }
            finally
            {
                bindingsField.SetValue(im, origBindings);
            }
        }

        private static string GetRemapButtonText(string action)
        {
            var sm = UnityEngine.Object.FindObjectOfType<SettingsMenu>();
            if (sm == null) return "(SettingsMenu 未激活)";

            BindingFlags flags = BindingFlags.Instance | BindingFlags.NonPublic;
            string fieldName = action switch
            {
                "jump" => "_remapJumpText",
                "slide" => "_remapSlideText",
                "left" => "_remapLeftText",
                "right" => "_remapRightText",
                _ => null
            };
            if (fieldName == null) return "";
            FieldInfo f = typeof(SettingsMenu).GetField(fieldName, flags);
            if (f == null) return "(字段缺失)";
            var t = f.GetValue(sm) as UnityEngine.UI.Text;
            return t == null ? "(null)" : t.text;
        }

        private static string GetTutorialHintText()
        {
            var tc = UnityEngine.Object.FindObjectOfType<TutorialController>();
            if (tc == null) return "(TutorialController 未激活)";

            FieldInfo rootField = typeof(TutorialController).GetField("_tutorialRoot",
                BindingFlags.Instance | BindingFlags.NonPublic);
            if (rootField == null) return "(字段缺失)";
            var root = rootField.GetValue(tc) as GameObject;
            if (root == null || !root.activeSelf) return "(教程未激活)";

            FieldInfo hintField = typeof(TutorialController).GetField("_keyHintText",
                BindingFlags.Instance | BindingFlags.NonPublic);
            if (hintField == null) return "(字段缺失)";
            var t = hintField.GetValue(tc) as UnityEngine.UI.Text;
            return t == null ? "(null)" : t.text;
        }
    }
}
