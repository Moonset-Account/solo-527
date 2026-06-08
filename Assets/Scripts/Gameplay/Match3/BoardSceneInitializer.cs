using UnityEngine;
using UnityEngine.UI;
using DecorMatch3.Gameplay.Match3;
using DecorMatch3.Core;
using DecorMatch3.Audio;

namespace DecorMatch3
{
    [RequireComponent(typeof(Board))]
    public class BoardSceneInitializer : MonoBehaviour
    {
        [SerializeField] private Camera boardCamera;
        [SerializeField] private Transform boardTransform;

        [Header("Board Visuals")]
        [SerializeField] private Sprite backgroundGridSprite;
        [SerializeField] private Color backgroundColor = new Color(0.15f, 0.12f, 0.2f);

        private Board _board;

        private void Awake()
        {
            _board = GetComponent<Board>();
            InitializeScene();
        }

        private void Start()
        {
            if (LevelManager.Instance?.CurrentLevel != null && Board.Instance != null && !Board.Instance.IsProcessing)
            {
                int levelId = LevelManager.Instance.CurrentLevel.LevelId;
                LevelManager.Instance.StartLevel(levelId);
            }
        }

        private void InitializeScene()
        {
            if (boardCamera == null)
            {
                boardCamera = Camera.main;
            }

            if (boardCamera != null)
            {
                boardCamera.clearFlags = CameraClearFlags.SolidColor;
                boardCamera.backgroundColor = backgroundColor;
                boardCamera.orthographic = true;

                if (_board != null)
                {
                    float verticalSize = Mathf.Max(_board.Width, _board.Height) * 0.6f;
                    boardCamera.orthographicSize = Mathf.Max(6, verticalSize);
                }
            }

            if (boardTransform != null)
            {
                boardTransform.localPosition = Vector3.zero;
            }

            CreateBackgroundGrid();
            CreateUIRoot();
        }

        private void CreateBackgroundGrid()
        {
            if (_board == null) return;

            GameObject gridGO = new GameObject("BackgroundGrid");
            gridGO.transform.SetParent(transform, false);
            gridGO.transform.localPosition = new Vector3(0, 0, 1);

            SpriteRenderer gridSR = gridGO.AddComponent<SpriteRenderer>();
            gridSR.sortingOrder = -100;

            if (backgroundGridSprite != null)
            {
                gridSR.sprite = backgroundGridSprite;
                gridSR.drawMode = SpriteDrawMode.Tiled;
                gridSR.size = new Vector2(_board.Width * 1.05f, _board.Height * 1.05f);
            }
            else
            {
                gridSR.color = new Color(0.2f, 0.18f, 0.25f, 0.8f);
                gridGO.transform.localScale = new Vector3(_board.Width * 1.05f, _board.Height * 1.05f, 1);
            }

            CreateCellBackgrounds();
        }

        private void CreateCellBackgrounds()
        {
            GameObject cellsParent = new GameObject("CellBackgrounds");
            cellsParent.transform.SetParent(transform, false);

            for (int x = 0; x < _board.Width; x++)
            {
                for (int y = 0; y < _board.Height; y++)
                {
                    GameObject cellGO = GameObject.CreatePrimitive(PrimitiveType.Quad);
                    Destroy(cellGO.GetComponent<MeshCollider>());
                    cellGO.transform.SetParent(cellsParent.transform, false);
                    cellGO.transform.localPosition = Board.Instance.GridToWorldPosition(x, y);
                    cellGO.transform.localScale = Vector3.one * 0.9f;
                    cellGO.name = $"Cell_{x}_{y}";

                    MeshRenderer mr = cellGO.GetComponent<MeshRenderer>();
                    Material mat = new Material(Shader.Find("Sprites/Default"));
                    mr.material = mat;
                    mr.sortingOrder = -50;

                    Color cellColor = (x + y) % 2 == 0
                        ? new Color(0.25f, 0.22f, 0.3f, 0.6f)
                        : new Color(0.22f, 0.20f, 0.28f, 0.6f);
                    mat.color = cellColor;
                }
            }
        }

        private void CreateUIRoot()
        {
            if (FindObjectOfType<Canvas>() != null) return;

            GameObject canvasGO = new GameObject("UICanvas");
            Canvas canvas = canvasGO.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;

            CanvasScaler scaler = canvasGO.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;

            canvasGO.AddComponent<GraphicRaycaster>();

            if (FindObjectOfType<UnityEngine.EventSystems.EventSystem>() == null)
            {
                GameObject esGO = new GameObject("EventSystem");
                esGO.AddComponent<UnityEngine.EventSystems.EventSystem>();
                esGO.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();
            }
        }
    }
}
