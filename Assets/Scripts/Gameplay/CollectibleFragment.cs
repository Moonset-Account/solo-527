using UnityEngine;

namespace BeatRunner.Gameplay
{
    public class CollectibleFragment : MonoBehaviour
    {
        [SerializeField] private int _value = 1;
        [SerializeField] private float _rotationSpeed = 180f;
        [SerializeField] private float _floatAmplitude = 0.2f;
        [SerializeField] private float _floatFrequency = 2f;

        [SerializeField] private ParticleSystem _collectEffect;
        [SerializeField] private AudioClip _collectSfx;

        private Vector3 _startPosition;
        private float _timeOffset;

        public int Value => _value;

        public void SetValue(int value)
        {
            _value = value;
        }

        private void Start()
        {
            _startPosition = transform.position;
            _timeOffset = Random.Range(0f, Mathf.PI * 2f);
        }

        private void Update()
        {
            transform.Rotate(Vector3.up, _rotationSpeed * Time.deltaTime, Space.World);
            var pos = _startPosition;
            pos.y += Mathf.Sin((Time.time + _timeOffset) * _floatFrequency) * _floatAmplitude;
            transform.position = pos;
        }

        public void Collect()
        {
            if (_collectEffect != null)
            {
                var effect = Instantiate(_collectEffect, transform.position, Quaternion.identity);
                Destroy(effect.gameObject, 2f);
            }

            if (Audio.AudioManager.Instance != null && _collectSfx != null)
            {
                Audio.AudioManager.Instance.PlaySfx(_collectSfx);
            }

            Destroy(gameObject);
        }
    }
}
