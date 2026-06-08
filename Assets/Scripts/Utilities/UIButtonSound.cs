using UnityEngine;
using UnityEngine.UI;
using DecorMatch3.Core;
using DecorMatch3.Audio;
using DecorMatch3.Data;

namespace DecorMatch3
{
    [RequireComponent(typeof(Button))]
    public class UIButtonSound : MonoBehaviour
    {
        [SerializeField] private SFXType clickSound = SFXType.ButtonClick;
        [SerializeField] private float volumeScale = 1f;
        [SerializeField] private float pitch = 1f;

        private Button _button;

        private void Awake()
        {
            _button = GetComponent<Button>();
            if (_button != null)
            {
                _button.onClick.AddListener(PlayClickSound);
            }
        }

        private void PlayClickSound()
        {
            AudioManager.Instance?.PlaySFX(clickSound, volumeScale, pitch);
        }

        private void OnDestroy()
        {
            if (_button != null)
            {
                _button.onClick.RemoveListener(PlayClickSound);
            }
        }
    }
}
