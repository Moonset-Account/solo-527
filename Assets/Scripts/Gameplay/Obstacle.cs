using UnityEngine;

namespace BeatRunner.Gameplay
{
    public class Obstacle : MonoBehaviour
    {
        public enum ObstacleHeight
        {
            Low,
            High
        }

        [SerializeField] private ObstacleHeight _height = ObstacleHeight.Low;
        [SerializeField] private float _damageRadius = 1f;
        [SerializeField] private ParticleSystem _destroyEffect;
        [SerializeField] private AudioClip _hitSfx;

        public ObstacleHeight Height => _height;

        public bool RequiresJump => _height == ObstacleHeight.Low;
        public bool RequiresSlide => _height == ObstacleHeight.High;

        public void DestroyObstacle()
        {
            if (_destroyEffect != null)
            {
                var effect = Instantiate(_destroyEffect, transform.position, Quaternion.identity);
                Destroy(effect.gameObject, 2f);
            }

            if (Audio.AudioManager.Instance != null && _hitSfx != null)
            {
                Audio.AudioManager.Instance.PlaySfx(_hitSfx);
            }

            Destroy(gameObject);
        }
    }
}
