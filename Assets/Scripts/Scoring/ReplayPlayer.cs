using UnityEngine;
using System.Collections;
using System.Collections.Generic;

namespace InkMountainBridge
{
    public class ReplayPlayer : MonoBehaviour
    {
        public bool isPlaying;
        public float playbackSpeed = 1.0f;
        public List<ReplayAction> actions = new List<ReplayAction>();
        public int currentActionIndex;

        [SerializeField] private BridgeBuilder bridgeBuilder;

        private Coroutine playbackCoroutine;

        public void StartPlayback(List<ReplayAction> recording)
        {
            if (isPlaying) StopPlayback();

            actions = new List<ReplayAction>(recording);
            currentActionIndex = 0;
            isPlaying = true;
            playbackCoroutine = StartCoroutine(PlaybackRoutine());
        }

        public void StopPlayback()
        {
            if (playbackCoroutine != null)
            {
                StopCoroutine(playbackCoroutine);
                playbackCoroutine = null;
            }

            isPlaying = false;
            currentActionIndex = 0;
        }

        public void SetPlaybackSpeed(float speed)
        {
            playbackSpeed = Mathf.Max(0.1f, speed);
        }

        private IEnumerator PlaybackRoutine()
        {
            float elapsed = 0f;

            while (currentActionIndex < actions.Count)
            {
                ReplayAction action = actions[currentActionIndex];
                float targetTime = action.timestamp * playbackSpeed;

                while (elapsed < targetTime)
                {
                    elapsed += Time.deltaTime;
                    yield return null;
                }

                ExecuteAction(action);
                currentActionIndex++;
            }

            isPlaying = false;
            playbackCoroutine = null;
        }

        private void ExecuteAction(ReplayAction action)
        {
            if (bridgeBuilder == null) return;

            switch (action.actionType)
            {
                case "PlaceElement":
                    bridgeBuilder.SelectMaterial(action.materialType);
                    bridgeBuilder.PlaceElement(action.position, action.position + Vector2.right);
                    break;
                case "RemoveElement":
                    break;
            }
        }
    }
}
