using System;
using UnityEngine;
using DecorMatch3.Data;

namespace DecorMatch3.Gameplay.Match3
{
    public class Gem : MonoBehaviour
    {
        [SerializeField] private SpriteRenderer spriteRenderer;
        [SerializeField] private Sprite[] gemSprites;

        public int X { get; private set; }
        public int Y { get; private set; }
        public GemType GemType { get; private set; }
        public bool IsMatched { get; set; }
        public bool IsMoving { get; set; }
        public bool IsSelected { get; private set; }

        public event Action<Gem> OnGemClicked;
        public event Action<Gem> OnGemDestroyed;

        private Vector3 _targetPosition;
        private float _moveSpeed = 10f;
        private bool _isAnimating;

        public void Initialize(int x, int y, GemType gemType)
        {
            X = x;
            Y = y;
            GemType = gemType;
            IsMatched = false;
            IsMoving = false;
            IsSelected = false;
            UpdateVisual();
            UpdatePositionFromGrid();
        }

        public void SetPosition(int x, int y)
        {
            X = x;
            Y = y;
            UpdatePositionFromGrid();
        }

        public void MoveToPosition(Vector3 target, float speed = 10f)
        {
            _targetPosition = target;
            _moveSpeed = speed;
            IsMoving = true;
            _isAnimating = true;
        }

        public void MoveToGridPosition(int x, int y, float speed = 10f)
        {
            X = x;
            Y = y;
            Vector3 target = Board.Instance.GridToWorldPosition(x, y);
            MoveToPosition(target, speed);
        }

        private void UpdatePositionFromGrid()
        {
            if (Board.Instance != null)
            {
                transform.localPosition = Board.Instance.GridToWorldPosition(X, Y);
            }
        }

        private void Update()
        {
            if (_isAnimating)
            {
                transform.localPosition = Vector3.Lerp(
                    transform.localPosition,
                    _targetPosition,
                    Time.deltaTime * _moveSpeed
                );

                if (Vector3.Distance(transform.localPosition, _targetPosition) < 0.01f)
                {
                    transform.localPosition = _targetPosition;
                    _isAnimating = false;
                    IsMoving = false;
                }
            }
        }

        private void UpdateVisual()
        {
            if (spriteRenderer == null)
            {
                spriteRenderer = GetComponent<SpriteRenderer>();
            }

            if (spriteRenderer != null && gemSprites != null && gemSprites.Length > (int)GemType && (int)GemType >= 0)
            {
                spriteRenderer.sprite = gemSprites[(int)GemType];
            }
            else if (spriteRenderer != null)
            {
                spriteRenderer.color = GetColorForGem(GemType);
            }
        }

        public static Color GetColorForGem(GemType type)
        {
            switch (type)
            {
                case GemType.Red: return new Color(0.95f, 0.30f, 0.30f);
                case GemType.Blue: return new Color(0.30f, 0.55f, 0.95f);
                case GemType.Green: return new Color(0.30f, 0.85f, 0.40f);
                case GemType.Yellow: return new Color(0.98f, 0.85f, 0.30f);
                case GemType.Purple: return new Color(0.75f, 0.40f, 0.95f);
                case GemType.Orange: return new Color(0.98f, 0.55f, 0.25f);
                case GemType.Rainbow: return Color.white;
                default: return Color.gray;
            }
        }

        public void SetSelected(bool selected)
        {
            IsSelected = selected;
            if (spriteRenderer != null)
            {
                transform.localScale = selected ? new Vector3(1.2f, 1.2f, 1.2f) : Vector3.one;
                spriteRenderer.sortingOrder = selected ? 10 : 0;
            }
        }

        public void DestroyGem(float delay = 0f, float scaleDuration = 0.2f)
        {
            StartCoroutine(DestroyCoroutine(delay, scaleDuration));
        }

        private System.Collections.IEnumerator DestroyCoroutine(float delay, float scaleDuration)
        {
            if (delay > 0)
            {
                yield return new WaitForSeconds(delay);
            }

            float timer = 0f;
            Vector3 startScale = transform.localScale;
            Vector3 targetScale = Vector3.zero;

            while (timer < scaleDuration)
            {
                timer += Time.deltaTime;
                transform.localScale = Vector3.Lerp(startScale, targetScale, timer / scaleDuration);
                yield return null;
            }

            OnGemDestroyed?.Invoke(this);
            Destroy(gameObject);
        }

        public void OnMouseDown()
        {
            if (Board.Instance != null && !Board.Instance.IsProcessing && !IsMoving)
            {
                OnGemClicked?.Invoke(this);
            }
        }

        public void SpawnAnimation(float delay = 0f)
        {
            StartCoroutine(SpawnCoroutine(delay));
        }

        private System.Collections.IEnumerator SpawnCoroutine(float delay)
        {
            transform.localScale = Vector3.zero;
            yield return new WaitForSeconds(delay);

            float timer = 0f;
            float duration = 0.15f;
            Vector3 targetScale = Vector3.one;

            while (timer < duration)
            {
                timer += Time.deltaTime;
                float t = timer / duration;
                transform.localScale = Vector3.one * Mathf.Sin(t * Mathf.PI);
                yield return null;
            }

            transform.localScale = targetScale;
        }
    }
}
