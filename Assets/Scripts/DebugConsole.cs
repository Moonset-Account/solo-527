using UnityEngine;
using System.Collections.Generic;
using TeaGardenDefense.Core;
using TeaGardenDefense.Config;

namespace TeaGardenDefense
{
    public class DebugConsole : MonoBehaviour
    {
        private Vector2 _scrollPos;
        private string _log = "";
        private bool _showConsole;
        private int _selectedLevelIndex;
        private string[] _levelNames;

        private void Start()
        {
            Application.logMessageReceived += HandleLog;

            var levels = ConfigManager.Instance.GetAllLevels();
            _levelNames = new string[levels.Count];
            for (int i = 0; i < levels.Count; i++)
                _levelNames[i] = levels[i].levelName;
        }

        private void HandleLog(string condition, string stackTrace, LogType type)
        {
            _log += $"[{type}] {condition}\n";
            if (_log.Length > 5000)
            {
                _log = _log.Substring(_log.Length - 4000);
            }
        }

        private void Update()
        {
            if (Input.GetKeyDown(KeyCode.F1))
                _showConsole = !_showConsole;

            if (Input.GetKeyDown(KeyCode.F5))
                GameManager.Instance?.RestartLevel();

            if (Input.GetKeyDown(KeyCode.F6))
            {
                _selectedLevelIndex = (_selectedLevelIndex + 1) % _levelNames.Length;
                string nextId = ConfigManager.Instance.GetAllLevels()[_selectedLevelIndex].levelId;
                GameManager.Instance.LoadLevel(nextId);
                Debug.Log($"切换关卡: {nextId}");
            }
        }

        private void OnGUI()
        {
            if (!_showConsole)
            {
                if (GUILayout.Button("显示控制台 (F1)", GUILayout.Width(150))) return;
            }

            GUILayout.BeginVertical("box");
            GUILayout.Label("=== 茶园塔防 调试控制台 ===");
            GUILayout.Label($"按 F1 切换 | F5 重玩 | F6 下一关");
            GUILayout.Space(5);

            var gm = GameManager.Instance;
            if (gm != null)
            {
                GUILayout.Label($"状态: {gm.CurrentState}");
                GUILayout.Label($"关卡: {gm.CurrentLevel?.levelName ?? "无"}");
                GUILayout.Label($"波次: {gm.Waves?.CurrentWaveNumber}/{gm.Waves?.TotalWaves}");
                GUILayout.Label($"金币: {gm.Resources?.Gold}");
                GUILayout.Label($"基地: {gm.Resources?.BaseHealth}/{gm.Resources?.MaxBaseHealth}");
                GUILayout.Label($"塔: {gm.Towers?.TowerCount} | DPS: {gm.Towers?.GetTotalDPS()}");
                GUILayout.Label($"击杀: {gm.Enemies?.TotalKilled} | 漏怪: {gm.Enemies?.TotalPassed}");
                GUILayout.Label($"天气: {gm.Weather?.CurrentWeatherName}");
                GUILayout.Label($"FPS: {PerformanceStats.Instance?.CurrentFPS:F0}");
                GUILayout.Label($"用时: {gm.Resources?.ElapsedTime:F1}s");

                GUILayout.Space(5);

                GUILayout.BeginHorizontal();
                if (GUILayout.Button("开始波次", GUILayout.Width(80)))
                    gm.StartNextWave();
                if (GUILayout.Button("重玩", GUILayout.Width(60)))
                    gm.RestartLevel();
                if (GUILayout.Button("暂停", GUILayout.Width(60)))
                    gm.TogglePause();
                GUILayout.EndHorizontal();

                GUILayout.Space(5);

                GUILayout.Label("选择塔位ID:");
                _selectedLevelIndex = GUILayout.Toolbar(_selectedLevelIndex, _levelNames);
                if (GUILayout.Button("加载关卡", GUILayout.Width(100)))
                {
                    string id = ConfigManager.Instance.GetAllLevels()[_selectedLevelIndex].levelId;
                    gm.LoadLevel(id);
                }

                GUILayout.Space(5);

                if (GUILayout.Button("测试胜利", GUILayout.Width(100)))
                {
                    typeof(SettlementSystem).GetMethod("HandleVictory",
                        System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                        ?.Invoke(gm.Settlement, null);
                }

                GUILayout.Space(5);

                GUILayout.Label("=== 日志 ===");
                _scrollPos = GUILayout.BeginScrollView(_scrollPos, GUILayout.Height(200));
                GUILayout.Label(_log);
                GUILayout.EndScrollView();
            }

            GUILayout.EndVertical();
        }
    }
}
