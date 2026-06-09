using System;
using System.Collections;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
using DecorMatch3.Utils;

namespace DecorMatch3.Match3
{
    [RequireComponent(typeof(RectTransform))]
    public class Tile : MonoBehaviour, IPointerDownHandler, IPointerUpHandler, IPointerEnterHandler
    {
        [SerializeField] private Image _tileImage;
        [SerializeField] private Image _highlightImage;
        [SerializeField] private CanvasGroup _canvasGroup;
        [SerializeField] private Text _materialCountText;

        private TileType _tileType = TileType.None;
        private TileState _state = TileState.Idle;
        private int _gridX;
        private int _gridY;
        private bool _isPointerDown;
        private bool _isInteractable = true;

        public TileType TileType => _tileType;
        public TileState State => _state;
        public int GridX => _gridX;
        public int GridY => _gridY;
        public bool IsInteractable => _isInteractable;
        public Vector2Int GridPosition => new Vector2Int(_gridX, _gridY);

        public event Action<Tile> OnTilePointerDown;
        public event Action<Tile> OnTilePointerUp;
        public event Action<Tile> OnTilePointerEnter;

        public RectTransform RectTransform
        {
            get
            {
                if (_rectTransform == null) _rectTransform = GetComponent<RectTransform>();
                return _rectTransform;
            }
        }
        private RectTransform _rectTransform;

        public void SetupReferences(Image tileImage, Image highlightImage, CanvasGroup canvasGroup)
        {
            _tileImage = tileImage;
            _highlightImage = highlightImage;
            _canvasGroup = canvasGroup;
        }

        public void Initialize(TileType type, int x, int y)
        {
            _tileType = type;
            _gridX = x;
            _gridY = y;
            _state = TileState.Idle;
            UpdateVisuals();
        }

        public void SetPosition(int x, int y)
        {
            _gridX = x;
            _gridY = y;
        }

        public void SetTileType(TileType type)
        {
            _tileType = type;
            UpdateVisuals();
        }

        public void SetState(TileState newState)
        {
            _state = newState;
            UpdateStateVisuals();
        }

        public void SetInteractable(bool interactable)
        {
            _isInteractable = interactable;
            _canvasGroup.blocksRaycasts = interactable;
        }

        public void SetSelected(bool selected)
        {
            if (_highlightImage != null)
            {
                _highlightImage.enabled = selected;
                if (selected)
                {
                    StartCoroutine(_highlightImage.transform.DoScale(Vector3.one * 1.1f, 0.15f));
                }
                else
                {
                    StartCoroutine(_highlightImage.transform.DoScale(Vector3.one, 0.15f));
                }
            }
            _state = selected ? TileState.Selected : TileState.Idle;
        }

        public IEnumerator AnimateSwap(Vector2 targetPosition, float duration, Action onComplete = null)
        {
            _state = TileState.Swapping;
            yield return StartCoroutine(RectTransform.DoMove(targetPosition, duration));
            _state = TileState.Idle;
            onComplete?.Invoke();
        }

        public IEnumerator AnimateFall(Vector2 targetPosition, float duration, Action onComplete = null)
        {
            _state = TileState.Falling;
            yield return StartCoroutine(RectTransform.DoMove(targetPosition, duration));
            _state = TileState.Idle;
            onComplete?.Invoke();
        }

        public IEnumerator AnimateRemove(float duration, Action onComplete = null)
        {
            _state = TileState.Removing;
            yield return StartCoroutine(RectTransform.DoScale(Vector3.zero, duration));
            yield return StartCoroutine(_canvasGroup.DoFade(0f, duration * 0.5f));
            onComplete?.Invoke();
            gameObject.SetActive(false);
        }

        public IEnumerator AnimateSpawn(float duration, Action onComplete = null)
        {
            gameObject.SetActive(true);
            RectTransform.localScale = Vector3.zero;
            _canvasGroup.alpha = 0f;
            _state = TileState.Idle;

            yield return StartCoroutine(RectTransform.DoScale(Vector3.one, duration));
            yield return StartCoroutine(_canvasGroup.DoFade(1f, duration * 0.5f));

            onComplete?.Invoke();
        }

        public IEnumerator AnimateShake(float duration, float intensity)
        {
            Vector3 originalPos = RectTransform.localPosition;
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float offsetX = UnityEngine.Random.Range(-intensity, intensity);
                float offsetY = UnityEngine.Random.Range(-intensity, intensity);
                RectTransform.localPosition = originalPos + new Vector3(offsetX, offsetY, 0);
                yield return null;
            }

            RectTransform.localPosition = originalPos;
        }

        private void UpdateVisuals()
        {
            if (_tileImage != null)
            {
                _tileImage.color = _tileType.GetTileColor();
                _tileImage.enabled = _tileType != TileType.None && _tileType != TileType.Empty;
            }

            if (_highlightImage != null)
            {
                _highlightImage.enabled = false;
            }

            MaterialCategory? category = _tileType.GetMaterialCategory();
            if (_materialCountText != null)
            {
                _materialCountText.enabled = category.HasValue;
            }
        }

        private void UpdateStateVisuals()
        {
            switch (_state)
            {
                case TileState.Disabled:
                    _canvasGroup.alpha = 0.5f;
                    SetInteractable(false);
                    break;
                default:
                    _canvasGroup.alpha = 1f;
                    break;
            }
        }

        public void OnPointerDown(PointerEventData eventData)
        {
            if (!_isInteractable || _state == TileState.Disabled) return;
            _isPointerDown = true;
            OnTilePointerDown?.Invoke(this);
        }

        public void OnPointerUp(PointerEventData eventData)
        {
            if (!_isInteractable) return;
            _isPointerDown = false;
            OnTilePointerUp?.Invoke(this);
        }

        public void OnPointerEnter(PointerEventData eventData)
        {
            if (!_isInteractable) return;
            if (_isPointerDown)
            {
                OnTilePointerEnter?.Invoke(this);
            }
        }
    }
}
