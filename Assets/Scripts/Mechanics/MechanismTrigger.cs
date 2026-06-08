using UnityEngine;
using System;

namespace ShadowPlatformer.Mechanics
{
    public enum TriggerType
    {
        PressurePlate,
        Lever,
        TimedSwitch,
        LightSensor
    }

    public class MechanismTrigger : MonoBehaviour
    {
        [Header("Trigger Config")]
        public TriggerType triggerType;
        public string triggerId;
        public bool isOneShot;
        public float timedDuration = 3f;

        [Header("Light Sensor")]
        public Light.LightDirection requiredLightDirection;

        public bool IsActivated { get; private set; }
        public event Action<MechanismTrigger> OnActivated;
        public event Action<MechanismTrigger> OnDeactivated;

        private bool _hasBeenUsed;
        private float _timedCounter;
        private int _entitiesInTrigger;

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (!other.CompareTag("Player")) return;
            _entitiesInTrigger++;
            EvaluateActivation();
        }

        private void OnTriggerExit2D(Collider2D other)
        {
            if (!other.CompareTag("Player")) return;
            _entitiesInTrigger--;
            if (triggerType == TriggerType.PressurePlate && _entitiesInTrigger <= 0)
                Deactivate();
        }

        private void Update()
        {
            if (triggerType == TriggerType.LightSensor && Light.LightManager.Instance != null)
            {
                bool matches = Light.LightManager.Instance.currentDirection == requiredLightDirection;
                if (matches && !IsActivated) Activate();
                else if (!matches && IsActivated) Deactivate();
            }

            if (triggerType == TriggerType.TimedSwitch && IsActivated)
            {
                _timedCounter -= Time.deltaTime;
                if (_timedCounter <= 0f) Deactivate();
            }
        }

        public void Interact()
        {
            if (triggerType == TriggerType.Lever)
            {
                if (IsActivated) Deactivate();
                else Activate();
            }
        }

        private void EvaluateActivation()
        {
            if (isOneShot && _hasBeenUsed) return;

            switch (triggerType)
            {
                case TriggerType.PressurePlate:
                    Activate();
                    break;
                case TriggerType.TimedSwitch:
                    _timedCounter = timedDuration;
                    Activate();
                    break;
            }
        }

        private void Activate()
        {
            IsActivated = true;
            _hasBeenUsed = true;
            OnActivated?.Invoke(this);
            Core.EventBus.Instance.RaiseMechanismActivated();
        }

        private void Deactivate()
        {
            IsActivated = false;
            OnDeactivated?.Invoke(this);
        }
    }
}
