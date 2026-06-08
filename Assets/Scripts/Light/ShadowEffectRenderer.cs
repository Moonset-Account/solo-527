using UnityEngine;

namespace ShadowPlatformer.Light
{
    [ExecuteInEditMode]
    public class ShadowEffectRenderer : MonoBehaviour
    {
        public Material shadowMaterial;
        public Color shadowColor = new Color(0.1f, 0.1f, 0.3f, 0.8f);
        public float shadowOffset = 0.1f;

        private SpriteRenderer _sr;
        private GameObject _shadowObject;
        private SpriteRenderer _shadowSr;

        private void Awake()
        {
            _sr = GetComponent<SpriteRenderer>();
            CreateShadowObject();
        }

        private void CreateShadowObject()
        {
            if (_shadowObject != null) return;

            _shadowObject = new GameObject("Shadow");
            _shadowObject.transform.SetParent(transform);
            _shadowObject.transform.localPosition = new Vector3(shadowOffset, -shadowOffset, 0.01f);
            _shadowObject.transform.localRotation = Quaternion.identity;
            _shadowObject.transform.localScale = Vector3.one;

            _shadowSr = _shadowObject.AddComponent<SpriteRenderer>();
            _shadowSr.sprite = _sr != null ? _sr.sprite : null;
            _shadowSr.color = shadowColor;
            _shadowSr.sortingLayerID = _sr != null ? _sr.sortingLayerID : 0;
            _shadowSr.sortingOrder = _sr != null ? _sr.sortingOrder - 1 : -1;

            if (shadowMaterial != null)
                _shadowSr.material = shadowMaterial;
        }

        private void LateUpdate()
        {
            if (_shadowSr == null || _sr == null) return;
            _shadowSr.sprite = _sr.sprite;
            _shadowSr.flipX = _sr.flipX;
            _shadowSr.flipY = _sr.flipY;

            var dir = LightManager.Instance != null
                ? LightManager.Instance.currentDirection.ToVector2()
                : Vector2.right;

            _shadowObject.transform.localPosition = new Vector3(
                -dir.x * shadowOffset,
                -dir.y * shadowOffset,
                0.01f
            );
        }

        public void SetShadowVisible(bool visible)
        {
            if (_shadowObject != null)
                _shadowObject.SetActive(visible);
        }
    }
}
