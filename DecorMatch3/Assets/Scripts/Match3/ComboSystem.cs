using UnityEngine;
using System.Collections.Generic;

namespace DecorMatch3
{
    public class ComboSystem : MonoBehaviour
    {
        public int CurrentCombo { get; private set; }
        public float ComboMultiplier => 1f + (CurrentCombo - 1) * 0.5f;

        private float _comboTimer;
        private float _comboTimeout = 2f;

        private void Update()
        {
            if (CurrentCombo > 0)
            {
                _comboTimer += Time.deltaTime;
                if (_comboTimer >= _comboTimeout)
                {
                    ResetCombo();
                }
            }
        }

        public void StartCombo()
        {
            CurrentCombo = 1;
            _comboTimer = 0f;
        }

        public void IncrementCombo()
        {
            CurrentCombo++;
            _comboTimer = 0f;
            GameEvents.TriggerComboHit(CurrentCombo);
        }

        public void ResetCombo()
        {
            CurrentCombo = 0;
            _comboTimer = 0f;
        }

        public int CalculateScore(int baseScore)
        {
            return Mathf.RoundToInt(baseScore * ComboMultiplier);
        }

        public void OnMatchFound(int matchCount)
        {
            if (CurrentCombo == 0)
            {
                StartCombo();
            }
            else
            {
                IncrementCombo();
            }
        }
    }
}
