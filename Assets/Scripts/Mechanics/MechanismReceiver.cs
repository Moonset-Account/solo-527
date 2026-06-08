using UnityEngine;
using System.Collections.Generic;

namespace ShadowPlatformer.Mechanics
{
    public class MechanismReceiver : MonoBehaviour
    {
        [Header("Receiver Config")]
        public string receiverId;
        public string[] requiredTriggerIds;
        public bool requireAllTriggers = true;

        [Header("Door")]
        public GameObject doorObject;
        public bool doorOpenByDefault = false;

        [Header("Moving Platform")]
        public Transform moveTarget;
        public float moveSpeed = 2f;
        public bool isMovingPlatform;

        private HashSet<string> _activeTriggers = new HashSet<string>();
        private bool _isActivated;
        private Vector3 _startPos;
        private Vector3 _endPos;

        public bool IsActivated => _isActivated;

        private void Start()
        {
            _startPos = transform.position;
            if (moveTarget != null)
                _endPos = moveTarget.position;

            if (doorObject != null)
                doorObject.SetActive(!doorOpenByDefault);
        }

        private void Update()
        {
            if (isMovingPlatform && _isActivated && moveTarget != null)
            {
                transform.position = Vector3.MoveTowards(
                    transform.position,
                    _endPos,
                    moveSpeed * Time.deltaTime
                );
            }
            else if (isMovingPlatform && !_isActivated)
            {
                transform.position = Vector3.MoveTowards(
                    transform.position,
                    _startPos,
                    moveSpeed * Time.deltaTime
                );
            }
        }

        public void OnTriggerActivated(MechanismTrigger trigger)
        {
            if (requiredTriggerIds == null || requiredTriggerIds.Length == 0) return;
            _activeTriggers.Add(trigger.triggerId);
            EvaluateState();
        }

        public void OnTriggerDeactivated(MechanismTrigger trigger)
        {
            _activeTriggers.Remove(trigger.triggerId);
            EvaluateState();
        }

        private void EvaluateState()
        {
            bool activated;
            if (requireAllTriggers)
            {
                activated = true;
                foreach (var id in requiredTriggerIds)
                {
                    if (!_activeTriggers.Contains(id))
                    {
                        activated = false;
                        break;
                    }
                }
            }
            else
            {
                activated = false;
                foreach (var id in requiredTriggerIds)
                {
                    if (_activeTriggers.Contains(id))
                    {
                        activated = true;
                        break;
                    }
                }
            }

            if (activated != _isActivated)
            {
                _isActivated = activated;
                ApplyState();
            }
        }

        private void ApplyState()
        {
            if (doorObject != null)
            {
                bool shouldOpen = _isActivated ^ doorOpenByDefault;
                doorObject.SetActive(!shouldOpen);
            }
        }
    }
}
