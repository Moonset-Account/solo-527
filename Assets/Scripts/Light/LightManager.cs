using UnityEngine;
using System;
using System.Collections.Generic;

namespace ShadowPlatformer.Light
{
    public class LightManager : MonoBehaviour
    {
        public static LightManager Instance { get; private set; }

        [Header("Current State")]
        public LightDirection currentDirection = LightDirection.Right;

        [Header("Visual")]
        public GameObject directionalLightObject;
        public float lightRotationSpeed = 5f;

        public event Action<LightDirection> OnDirectionChanged;

        private Dictionary<LightDirection, float> _rotationMap = new Dictionary<LightDirection, float>
        {
            { LightDirection.Right, 0f },
            { LightDirection.Left, 180f },
            { LightDirection.Up, 90f },
            { LightDirection.Down, 270f }
        };

        private LightDirection _prevDirection;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void Start()
        {
            _prevDirection = currentDirection;
            ApplyDirectionImmediate();
        }

        private void Update()
        {
            if (directionalLightObject != null && currentDirection != _prevDirection)
            {
                float targetZ = _rotationMap[currentDirection];
                Quaternion targetRot = Quaternion.Euler(0f, 0f, targetZ);
                directionalLightObject.transform.rotation = Quaternion.Slerp(
                    directionalLightObject.transform.rotation,
                    targetRot,
                    lightRotationSpeed * Time.deltaTime
                );

                if (Quaternion.Angle(directionalLightObject.transform.rotation, targetRot) < 0.5f)
                {
                    directionalLightObject.transform.rotation = targetRot;
                    _prevDirection = currentDirection;
                }
            }
        }

        public void SetDirection(LightDirection dir)
        {
            if (currentDirection == dir) return;
            currentDirection = dir;
            OnDirectionChanged?.Invoke(currentDirection);
        }

        public void CycleDirection()
        {
            SetDirection(currentDirection.Next());
        }

        private void ApplyDirectionImmediate()
        {
            if (directionalLightObject != null)
            {
                float targetZ = _rotationMap[currentDirection];
                directionalLightObject.transform.rotation = Quaternion.Euler(0f, 0f, targetZ);
                _prevDirection = currentDirection;
            }
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
        }
    }
}
