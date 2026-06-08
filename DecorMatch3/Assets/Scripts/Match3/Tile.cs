using UnityEngine;
using System.Collections;
using System.Collections.Generic;

namespace DecorMatch3
{
    public class Tile : MonoBehaviour
    {
        public TileType TileType { get; set; }
        public int Row { get; set; }
        public int Col { get; set; }
        public bool IsMatched { get; set; }
        public bool IsFalling { get; set; }
        public bool IsSwapping { get; set; }

        private SpriteRenderer _spriteRenderer;

        private static readonly Dictionary<TileType, Color> TileColors = new Dictionary<TileType, Color>
        {
            { TileType.Paint, Color.red },
            { TileType.Wallpaper, Color.green },
            { TileType.Fabric, Color.blue },
            { TileType.Wood, new Color(0.6f, 0.3f, 0.1f) },
            { TileType.Metal, new Color(0.75f, 0.75f, 0.75f) },
            { TileType.Ceramic, Color.white }
        };

        private void Awake()
        {
            _spriteRenderer = GetComponent<SpriteRenderer>();
            if (_spriteRenderer == null)
            {
                _spriteRenderer = gameObject.AddComponent<SpriteRenderer>();
            }
        }

        public void Initialize(TileType type, int row, int col)
        {
            TileType = type;
            Row = row;
            Col = col;
            IsMatched = false;
            IsFalling = false;
            IsSwapping = false;
            transform.localScale = Vector3.one;
            UpdateVisual();
        }

        public void SetPosition(Vector3 pos, bool animate = false)
        {
            if (animate)
            {
                StartCoroutine(AnimatePosition(pos, 0.2f));
            }
            else
            {
                transform.position = pos;
            }
        }

        public void PlayMatchAnimation()
        {
            StartCoroutine(ScaleAnimation(Vector3.zero, 0.3f));
        }

        public void PlayFallAnimation(Vector3 target)
        {
            StartCoroutine(AnimatePosition(target, 0.2f));
        }

        public void PlaySwapAnimation(Vector3 target)
        {
            StartCoroutine(AnimatePosition(target, 0.15f));
        }

        public void UpdateVisual()
        {
            if (_spriteRenderer != null)
            {
                if (TileType == TileType.None)
                {
                    _spriteRenderer.enabled = false;
                    return;
                }
                _spriteRenderer.enabled = true;
                if (TileColors.TryGetValue(TileType, out Color color))
                {
                    _spriteRenderer.color = color;
                }
            }
        }

        public void Reset()
        {
            TileType = TileType.None;
            Row = 0;
            Col = 0;
            IsMatched = false;
            IsFalling = false;
            IsSwapping = false;
            transform.localScale = Vector3.one;
            gameObject.SetActive(false);
        }

        private IEnumerator AnimatePosition(Vector3 target, float duration)
        {
            Vector3 start = transform.position;
            float elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.Clamp01(elapsed / duration);
                transform.position = Vector3.Lerp(start, target, t);
                yield return null;
            }
            transform.position = target;
        }

        private IEnumerator ScaleAnimation(Vector3 targetScale, float duration)
        {
            Vector3 startScale = transform.localScale;
            float elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.Clamp01(elapsed / duration);
                transform.localScale = Vector3.Lerp(startScale, targetScale, t);
                yield return null;
            }
            transform.localScale = targetScale;
        }
    }
}
