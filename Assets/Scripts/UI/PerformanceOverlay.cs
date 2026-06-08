using Kitchen.Performance;
using Kitchen.Save;
using TMPro;
using UnityEngine;

namespace Kitchen.UI
{
    public class PerformanceOverlay : MonoBehaviour
    {
        [Header("References")]
        public GameObject overlayPanel;
        public TextMeshProUGUI statsText;
        public TextMeshProUGUI fpsText;
        public TextMeshProUGUI memoryText;
        public TextMeshProUGUI playerCountText;

        [Header("Colors")]
        public Color goodColor = Color.green;
        public Color warnColor = Color.yellow;
        public Color badColor = Color.red;

        [Header("Settings")]
        public int fpsGoodThreshold = 55;
        public int fpsWarnThreshold = 30;

        private void Update()
        {
            bool shouldShow = SaveManager.Instance != null &&
                              SaveManager.Instance.GetSettings().showPerformanceStats;
            if (overlayPanel != null) overlayPanel.SetActive(shouldShow);
            if (!shouldShow) return;

            UpdateStats();
        }

        private void UpdateStats()
        {
            PerformanceStats ps = PerformanceStats.Instance;
            if (ps == null) return;

            if (fpsText != null)
            {
                fpsText.text = $"FPS: {ps.CurrentFPS:F0}";
                fpsText.color = ps.CurrentFPS >= fpsGoodThreshold ? goodColor :
                                ps.CurrentFPS >= fpsWarnThreshold ? warnColor : badColor;
            }

            if (memoryText != null)
            {
                memoryText.text = $"内存: {ps.AllocatedMemoryKB / 1024}MB";
            }

            if (statsText != null)
            {
                statsText.text =
                    $"FPS 范围: {ps.MinFPS:F0} - {ps.MaxFPS:F0}\n" +
                    $"平均: {ps.AverageFPS:F1}  帧耗时: {ps.MsPerFrame:F2}ms\n" +
                    $"预约内存: {ps.ReservedMemoryKB / 1024}MB";
            }

            if (playerCountText != null)
            {
                int count = Kitchen.Core.PlayerManager.Instance?.Players.Count ?? 0;
                playerCountText.text = $"玩家: {count}";
            }
        }
    }
}
