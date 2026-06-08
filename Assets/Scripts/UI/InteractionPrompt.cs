using UnityEngine;
using TMPro;

namespace ShadowPlatformer.UI
{
    public class InteractionPrompt : MonoBehaviour
    {
        public TMP_Text promptText;
        public Vector2 offset = new Vector2(0f, 1.5f);
        public float showRadius = 2f;

        private Transform _player;
        private string _currentPrompt;

        private void Start()
        {
            var playerObj = GameObject.FindGameObjectWithTag("Player");
            if (playerObj != null) _player = playerObj.transform;
        }

        private void Update()
        {
            if (_player == null || promptText == null) return;

            float dist = Vector2.Distance(transform.position, _player.position);
            bool show = dist <= showRadius && !string.IsNullOrEmpty(_currentPrompt);

            promptText.gameObject.SetActive(show);
            if (show)
                promptText.transform.position = (Vector2)transform.position + offset;
        }

        public void SetPrompt(string text)
        {
            _currentPrompt = text;
            if (promptText != null)
                promptText.text = text;
        }

        public void ClearPrompt()
        {
            _currentPrompt = null;
            if (promptText != null)
                promptText.gameObject.SetActive(false);
        }
    }
}
