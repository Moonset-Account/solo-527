using UnityEngine;
using System;
using System.Collections;
using System.Collections.Generic;
using PuppetTheater.Data;

namespace PuppetTheater.Stage
{
    public enum StagePosition
    {
        Left,
        Center,
        Right,
        UpstageLeft,
        UpstageRight
    }

    [Serializable]
    public class PuppetState
    {
        public int positionIndex;
        public PuppetActionType currentAction;
        public bool isActive;
        public bool isCollapsed;
        public LightColor zoneColor;
    }

    [Serializable]
    public class PuppetSlot
    {
        public Transform targetPosition;
        public LightColor zoneColor;
        public bool isCritical;
        public PuppetState state;
    }

    [Serializable]
    public class StageProp
    {
        public string propId;
        public GameObject propObject;
        public float remainingDuration;
        public bool isActive;
    }

    public class StageMechanism : MonoBehaviour
    {
        [SerializeField] private float puppetMoveDuration = 0.5f;
        [SerializeField] private LightColor currentStageLight = LightColor.White;

        private readonly Dictionary<int, PuppetSlot> _puppetSlots = new Dictionary<int, PuppetSlot>();
        private readonly Dictionary<StagePosition, LightColor> _spotlightZones = new Dictionary<StagePosition, LightColor>();
        private readonly Dictionary<string, StageProp> _props = new Dictionary<string, StageProp>();
        private readonly List<PuppetState> _allStates = new List<PuppetState>();
        private readonly Dictionary<int, Coroutine> _moveCoroutines = new Dictionary<int, Coroutine>();

        public event Action<int, PuppetActionType, bool> OnPuppetActionCompleted;
        public event Action<int> OnPuppetCollapsed;

        public LightColor CurrentStageLight
        {
            get => currentStageLight;
            set => currentStageLight = value;
        }

        public void RegisterPuppet(int positionIndex, Transform targetPosition, LightColor zoneColor, bool isCritical = false)
        {
            var slot = new PuppetSlot
            {
                targetPosition = targetPosition,
                zoneColor = zoneColor,
                isCritical = isCritical,
                state = new PuppetState
                {
                    positionIndex = positionIndex,
                    currentAction = PuppetActionType.Idle,
                    isActive = true,
                    isCollapsed = false,
                    zoneColor = zoneColor
                }
            };

            _puppetSlots[positionIndex] = slot;

            if (!_spotlightZones.ContainsKey(PositionFromIndex(positionIndex)))
            {
                _spotlightZones[PositionFromIndex(positionIndex)] = zoneColor;
            }

            RebuildStateList();
        }

        public void TriggerPuppetAction(int positionIndex, PuppetActionType action, LightColor requiredLight)
        {
            if (!_puppetSlots.TryGetValue(positionIndex, out PuppetSlot slot))
            {
                OnPuppetActionCompleted?.Invoke(positionIndex, action, false);
                return;
            }

            if (slot.state.isCollapsed || !slot.state.isActive)
            {
                OnPuppetActionCompleted?.Invoke(positionIndex, action, false);
                return;
            }

            if (currentStageLight != requiredLight)
            {
                OnPuppetActionCompleted?.Invoke(positionIndex, action, false);
                return;
            }

            slot.state.currentAction = action;
            OnPuppetActionCompleted?.Invoke(positionIndex, action, true);
        }

        public void MovePuppet(int positionIndex, StagePosition targetPosition)
        {
            if (!_puppetSlots.TryGetValue(positionIndex, out PuppetSlot slot))
                return;

            if (slot.state.isCollapsed)
                return;

            if (_moveCoroutines.TryGetValue(positionIndex, out Coroutine existing))
            {
                StopCoroutine(existing);
                _moveCoroutines.Remove(positionIndex);
            }

            _moveCoroutines[positionIndex] = StartCoroutine(AnimatePuppetMove(positionIndex, slot, targetPosition));
        }

        public void CollapsePuppet(int positionIndex)
        {
            if (!_puppetSlots.TryGetValue(positionIndex, out PuppetSlot slot))
                return;

            if (slot.state.isCollapsed)
                return;

            slot.state.isCollapsed = true;
            slot.state.isActive = false;
            slot.state.currentAction = PuppetActionType.Collapse;

            OnPuppetCollapsed?.Invoke(positionIndex);
        }

        public bool IsCriticalPuppet(int positionIndex)
        {
            return _puppetSlots.TryGetValue(positionIndex, out PuppetSlot slot) && slot.isCritical;
        }

        public void ActivateProp(string propId, float duration)
        {
            if (!_props.TryGetValue(propId, out StageProp prop))
            {
                prop = new StageProp
                {
                    propId = propId,
                    propObject = null,
                    isActive = false,
                    remainingDuration = 0f
                };
                _props[propId] = prop;
            }

            prop.isActive = true;
            prop.remainingDuration = duration;

            if (prop.propObject != null)
                prop.propObject.SetActive(true);

            if (duration > 0f)
                StartCoroutine(DeactivatePropAfterDelay(propId, duration));
        }

        public void DeactivateProp(string propId)
        {
            if (!_props.TryGetValue(propId, out StageProp prop))
                return;

            prop.isActive = false;
            prop.remainingDuration = 0f;

            if (prop.propObject != null)
                prop.propObject.SetActive(false);
        }

        public void SetSpotlightZone(StagePosition position, LightColor zoneColor)
        {
            _spotlightZones[position] = zoneColor;

            foreach (var kvp in _puppetSlots)
            {
                StagePosition puppetPos = PositionFromIndex(kvp.Key);
                if (puppetPos == position)
                {
                    kvp.Value.zoneColor = zoneColor;
                    kvp.Value.state.zoneColor = zoneColor;
                }
            }
        }

        public bool IsSpotlightLit(StagePosition position)
        {
            if (!_spotlightZones.TryGetValue(position, out LightColor zoneColor))
                return false;

            return currentStageLight == zoneColor;
        }

        public PuppetState GetPuppetState(int positionIndex)
        {
            if (!_puppetSlots.TryGetValue(positionIndex, out PuppetSlot slot))
                return null;

            return slot.state;
        }

        public PuppetState[] GetAllPuppetStates()
        {
            RebuildStateList();
            return _allStates.ToArray();
        }

        private void RebuildStateList()
        {
            _allStates.Clear();
            foreach (var kvp in _puppetSlots)
            {
                _allStates.Add(kvp.Value.state);
            }
        }

        private IEnumerator AnimatePuppetMove(int positionIndex, PuppetSlot slot, StagePosition targetPosition)
        {
            if (slot.targetPosition == null)
            {
                _moveCoroutines.Remove(positionIndex);
                yield break;
            }

            Vector3 startPos = slot.targetPosition.position;
            Vector3 endPos = GetWorldPositionForStagePosition(targetPosition);
            float elapsed = 0f;

            while (elapsed < puppetMoveDuration)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.Clamp01(elapsed / puppetMoveDuration);
                float eased = t * t * (3f - 2f * t);

                if (slot.targetPosition != null)
                    slot.targetPosition.position = Vector3.Lerp(startPos, endPos, eased);

                yield return null;
            }

            if (slot.targetPosition != null)
                slot.targetPosition.position = endPos;

            _moveCoroutines.Remove(positionIndex);
        }

        private IEnumerator DeactivatePropAfterDelay(string propId, float delay)
        {
            yield return new WaitForSeconds(delay);
            DeactivateProp(propId);
        }

        private static StagePosition PositionFromIndex(int index)
        {
            return index switch
            {
                0 => StagePosition.Left,
                1 => StagePosition.Center,
                2 => StagePosition.Right,
                3 => StagePosition.UpstageLeft,
                4 => StagePosition.UpstageRight,
                _ => StagePosition.Center
            };
        }

        private Vector3 GetWorldPositionForStagePosition(StagePosition position)
        {
            return position switch
            {
                StagePosition.Left => new Vector3(-3f, 0f, 0f),
                StagePosition.Center => new Vector3(0f, 0f, 0f),
                StagePosition.Right => new Vector3(3f, 0f, 0f),
                StagePosition.UpstageLeft => new Vector3(-2f, 0f, -2f),
                StagePosition.UpstageRight => new Vector3(2f, 0f, -2f),
                _ => Vector3.zero
            };
        }

        private void Update()
        {
            foreach (var kvp in _props)
            {
                if (kvp.Value.isActive && kvp.Value.remainingDuration > 0f)
                {
                    kvp.Value.remainingDuration -= Time.deltaTime;
                    if (kvp.Value.remainingDuration <= 0f)
                    {
                        kvp.Value.remainingDuration = 0f;
                        DeactivateProp(kvp.Key);
                    }
                }
            }
        }
    }
}
