using BeatRunner.Player;
using UnityEngine;

namespace BeatRunner.Gameplay
{
    public class GameplayController : MonoBehaviour
    {
        [SerializeField] private LevelManager _levelManager;
        [SerializeField] private PlayerController _player;

        private void OnEnable()
        {
            if (_player != null)
            {
                _player.OnStateChanged += OnPlayerStateChanged;
                _player.OnTrackChanged += OnPlayerTrackChanged;
            }
        }

        private void OnDisable()
        {
            if (_player != null)
            {
                _player.OnStateChanged -= OnPlayerStateChanged;
                _player.OnTrackChanged -= OnPlayerTrackChanged;
            }
        }

        private void Update()
        {
            _levelManager?.CheckCollisions();
        }

        private void OnPlayerStateChanged(PlayerState newState)
        {
            if (_levelManager == null || _player == null) return;

            switch (newState)
            {
                case PlayerState.Jumping:
                case PlayerState.Sliding:
                    _levelManager.TryJudgeAction(newState, _player.CurrentTrackIndex);
                    break;
            }
        }

        private void OnPlayerTrackChanged(int trackIndex)
        {
            if (_levelManager == null) return;
            _levelManager.TryJudgeAction(_player.State, trackIndex);
        }
    }
}
