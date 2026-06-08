using UnityEngine;

namespace InkMountainBridge
{
    public class AudioEventListener : MonoBehaviour
    {
        private void OnEnable()
        {
            GameEvents.OnBridgeCollapsed += OnBridgeCollapsed;
            GameEvents.OnStressWarning += OnStressWarning;
            GameEvents.OnCaravanArrived += OnCaravanArrived;
            GameEvents.OnCaravanFailed += OnCaravanFailed;
            GameEvents.OnMaterialUsed += OnMaterialUsed;
            GameEvents.OnBudgetExceeded += OnBudgetExceeded;
            GameEvents.OnInputRecorded += OnInputRecorded;
        }

        private void OnDisable()
        {
            GameEvents.OnBridgeCollapsed -= OnBridgeCollapsed;
            GameEvents.OnStressWarning -= OnStressWarning;
            GameEvents.OnCaravanArrived -= OnCaravanArrived;
            GameEvents.OnCaravanFailed -= OnCaravanFailed;
            GameEvents.OnMaterialUsed -= OnMaterialUsed;
            GameEvents.OnBudgetExceeded -= OnBudgetExceeded;
            GameEvents.OnInputRecorded -= OnInputRecorded;
        }

        private void OnBridgeCollapsed(Vector2 position)
        {
            PlayEvent(AudioEventType.BridgeSnap);
        }

        private void OnStressWarning(float stressLevel)
        {
            PlayEvent(AudioEventType.StressWarning);
        }

        private void OnCaravanArrived()
        {
            PlayEvent(AudioEventType.SuccessFanfare);
        }

        private void OnCaravanFailed(string reason)
        {
            PlayEvent(AudioEventType.FailureDrum);
        }

        private void OnMaterialUsed(MaterialType type, int remaining)
        {
            switch (type)
            {
                case MaterialType.Beam:
                    PlayEvent(AudioEventType.BeamPlace);
                    break;
                case MaterialType.Rope:
                    PlayEvent(AudioEventType.RopePlace);
                    break;
                case MaterialType.StonePier:
                    PlayEvent(AudioEventType.PierPlace);
                    break;
            }
        }

        private void OnBudgetExceeded()
        {
            PlayEvent(AudioEventType.BudgetWarning);
        }

        private void OnInputRecorded(InputRecord record)
        {
            if (record.action == "RemoveElement")
            {
                PlayEvent(AudioEventType.BridgeCreak);
            }
        }

        private void PlayEvent(AudioEventType eventType)
        {
            if (AudioManager.Instance != null)
                AudioManager.Instance.PlayAudioEvent(eventType);
        }
    }
}
