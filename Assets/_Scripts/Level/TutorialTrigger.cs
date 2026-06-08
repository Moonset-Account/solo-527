using System.Collections;
using UnityEngine;

namespace LightShadowPlatformer
{
    public class TutorialTrigger : MonoBehaviour
    {
        public enum TriggerType { OnEnter, OnInteract, OnLightSwitch, OnActionComplete }
        public enum DismissType { Auto, OnLeave, OnInput }

        [Header("Tutorial Settings")]
        public string tutorialId = "tut_01";
        public TriggerType triggerType = TriggerType.OnEnter;
        public DismissType dismissType = DismissType.OnLeave;
        [TextArea(3, 10)] public string message = "";
        public bool showOnlyOnce = true;
        public bool hasShown;
        public float displayDuration = 4f;
        public float delayBeforeShow = 0.2f;

        [Header("Visual")]
        public SpriteRenderer hintSprite;
        public Color glowColor = new Color(1f, 0.9f, 0.4f);
        public float pulseSpeed = 2f;
        public float pulseAmount = 0.2f;

        [Header("Requirements")]
        public string requiredActionId = "";

        private bool _playerInRange;
        private Coroutine _displayCoroutine;
        private bool _isDisplayed;

        private void Start()
        {
            if (showOnlyOnce &&
                LightShadowPlatformer.Core.SettingsManager.Instance != null &&
                !LightShadowPlatformer.Core.SettingsManager.Instance.CurrentSettings.tutorialEnabled)
            {
                gameObject.SetActive(false);
            }
        }

        private void Update()
        {
            if (hintSprite != null)
            {
                float t = 1f + Mathf.Sin(Time.time * pulseSpeed) * pulseAmount;
                hintSprite.transform.localScale = Vector3.one * t;
                Color c = glowColor;
                c.a = 0.5f + Mathf.Sin(Time.time * pulseSpeed) * 0.3f;
                hintSprite.color = c;
            }

            if (_playerInRange && triggerType == TriggerType.OnInteract && Input.GetButtonDown("Interact"))
            {
                ShowTutorial();
            }
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (!other.CompareTag("Player")) return;

            _playerInRange = true;

            if (triggerType == TriggerType.OnEnter)
            {
                ShowTutorial();
            }
        }

        private void OnTriggerExit2D(Collider2D other)
        {
            if (!other.CompareTag("Player")) return;

            _playerInRange = false;

            if (dismissType == DismissType.OnLeave && _isDisplayed)
            {
                HideTutorial();
            }
        }

        public void ShowTutorial()
        {
            if (showOnlyOnce && hasShown) return;
            if (string.IsNullOrEmpty(message)) return;

            hasShown = true;
            _isDisplayed = true;

            if (_displayCoroutine != null) StopCoroutine(_displayCoroutine);
            _displayCoroutine = StartCoroutine(DisplayRoutine());
        }

        private IEnumerator DisplayRoutine()
        {
            yield return new WaitForSeconds(delayBeforeShow);

            LightShadowPlatformer.Core.EventManager.Instance.TriggerTutorialTriggered(tutorialId, message);
            LightShadowPlatformer.Core.AudioManager.Instance?.PlaySfx(
                LightShadowPlatformer.Core.AudioManager.SfxType.Tutorial);

            if (dismissType == DismissType.Auto)
            {
                float elapsed = 0f;
                while (elapsed < displayDuration)
                {
                    elapsed += Time.deltaTime;
                    if (dismissType == DismissType.OnInput &&
                        (Input.anyKeyDown || Input.GetAxisRaw("Horizontal") != 0 || Input.GetAxisRaw("Vertical") != 0))
                    {
                        break;
                    }
                    yield return null;
                }
                HideTutorial();
            }
            else if (dismissType == DismissType.OnInput)
            {
                while (!Input.anyKeyDown)
                {
                    yield return null;
                }
                HideTutorial();
            }
        }

        public void HideTutorial()
        {
            _isDisplayed = false;
            LightShadowPlatformer.UI.UIManager.Instance?.HideTutorial();
        }

        public void MarkActionComplete(string actionId)
        {
            if (triggerType == TriggerType.OnActionComplete && requiredActionId == actionId)
            {
                ShowTutorial();
            }
        }
    }
}
