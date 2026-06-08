using UnityEngine;
using System.Collections.Generic;

namespace InkMountainBridge
{
    public class ReplayRecorder : MonoBehaviour
    {
        public bool isRecording;
        public List<ReplayAction> recordedActions = new List<ReplayAction>();
        public float startTime;

        private void OnEnable()
        {
            GameEvents.OnInputRecorded += OnInputRecorded;
        }

        private void OnDisable()
        {
            GameEvents.OnInputRecorded -= OnInputRecorded;
        }

        public void StartRecording()
        {
            isRecording = true;
            startTime = Time.time;
            recordedActions.Clear();
        }

        public void StopRecording()
        {
            isRecording = false;
        }

        public void RecordAction(string actionType, Vector2 position, MaterialType materialType)
        {
            if (!isRecording) return;

            ReplayAction action = new ReplayAction
            {
                timestamp = Time.time - startTime,
                actionType = actionType,
                position = position,
                materialType = materialType
            };

            recordedActions.Add(action);
        }

        public List<ReplayAction> GetRecording()
        {
            return new List<ReplayAction>(recordedActions);
        }

        public void ClearRecording()
        {
            recordedActions.Clear();
        }

        private void OnInputRecorded(InputRecord input)
        {
            RecordAction(input.action, input.position, input.materialType);
        }
    }
}
