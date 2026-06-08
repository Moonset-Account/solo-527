using UnityEngine;
using System.Collections.Generic;
using ShadowPlatformer.Core;
using ShadowPlatformer.Player;

namespace ShadowPlatformer.Mechanics
{
    public class LevelExit : MonoBehaviour
    {
        public string nextLevelId;
        public string currentLevelId;
        public bool requireAllTriggers;
        public string[] requiredTriggerIds;

        private HashSet<string> _activatedTriggers = new HashSet<string>();

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (!other.CompareTag("Player")) return;

            if (requireAllTriggers && requiredTriggerIds != null)
            {
                foreach (var id in requiredTriggerIds)
                {
                    if (!_activatedTriggers.Contains(id)) return;
                }
            }

            Core.EventBus.Instance.RaiseLevelCompleted(currentLevelId);
        }

        public void NotifyTriggerActivated(string triggerId)
        {
            _activatedTriggers.Add(triggerId);
        }
    }
}
