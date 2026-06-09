using System;
using UnityEngine;
using UnityEngine.UI;

namespace PixelPlantLab
{
    public class ParameterSlider : MonoBehaviour
    {
        public Slider SliderComponent;
        public Text LabelText;
        public Text ValueText;
        public string ParameterLabel;
        public string ParameterFormat = "F2";
        public float CurrentValue => SliderComponent.value;

        public event Action<float> OnValueChangedEvent;

        private void Awake()
        {
            SliderComponent = GetComponent<Slider>();
            if (SliderComponent != null)
            {
                SliderComponent.onValueChanged.AddListener(OnSliderValueChanged);
            }
        }

        private void Start()
        {
            UpdateDisplay();
        }

        private void OnSliderValueChanged(float value)
        {
            UpdateDisplay();
            OnValueChangedEvent?.Invoke(value);
        }

        private void UpdateDisplay()
        {
            if (LabelText != null) LabelText.text = ParameterLabel;
            if (ValueText != null) ValueText.text = SliderComponent.value.ToString(ParameterFormat);
        }

        public void SetValue(float value, bool notify = true)
        {
            if (SliderComponent == null) return;
            SliderComponent.value = Mathf.Clamp01(value);
            UpdateDisplay();
            if (notify) OnValueChangedEvent?.Invoke(SliderComponent.value);
        }

        public void SetRange(float min, float max)
        {
            SliderComponent.minValue = min;
            SliderComponent.maxValue = max;
        }

        private void OnDestroy()
        {
            if (SliderComponent != null)
            {
                SliderComponent.onValueChanged.RemoveListener(OnSliderValueChanged);
            }
        }
    }
}
