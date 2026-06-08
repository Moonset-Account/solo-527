using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using RainAlley.Core;
using RainAlley.GameFlow;
using RainAlley.Track;

namespace RainAlley.Gameplay
{
    public class GameplaySceneVisuals : MonoBehaviour
    {
        public static GameplaySceneVisuals Instance { get; private set; }

        public Transform LeftTrackAnchor;
        public Transform RightTrackAnchor;
        public Transform PlayerVisual;
        public SpriteRenderer PlayerUmbrellaRenderer;
        public Transform ObstacleSpawnRoot;
        public Transform LaneLeft;
        public Transform LaneRight;

        private Dictionary<int, GameObject> _obstacleVisuals = new Dictionary<int, GameObject>();
        private GameManager _gm;

        private const float LaneSpacing = 2.2f;
        private const float ObstacleZStart = 12f;
        private const float ObstacleZEnd = -1.5f;
        private const float JudgeLineZ = -1.0f;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            BuildScene();
        }

        private void Start()
        {
            _gm = GameManager.Instance;
            if (_gm == null) return;
            Attach();
        }

        public void Attach()
        {
            if (_gm.TrackMgr != null)
            {
                _gm.TrackMgr.OnObstacleEnterWindow -= SpawnObstacleVisual;
                _gm.TrackMgr.OnObstacleEnterWindow += SpawnObstacleVisual;
                _gm.TrackMgr.OnObstacleJudged -= UpdateObstacleVisualOnJudge;
                _gm.TrackMgr.OnObstacleJudged += UpdateObstacleVisualOnJudge;
                _gm.TrackMgr.OnObstacleExited -= RemoveObstacleVisual;
                _gm.TrackMgr.OnObstacleExited += RemoveObstacleVisual;
            }

            if (_gm.ColorState != null)
            {
                _gm.ColorState.OnColorChanged -= OnColorChanged;
                _gm.ColorState.OnColorChanged += OnColorChanged;
                UpdateUmbrellaColor(_gm.ColorState.CurrentColor);
                UpdateTrackVisual(_gm.ColorState.CurrentTrack);
                _gm.ColorState.OnTrackChanged -= OnTrackChanged;
                _gm.ColorState.OnTrackChanged += OnTrackChanged;
            }

            _gm.OnStateChanged += HandleStateChanged;
        }

        private void HandleStateChanged(GameState oldS, GameState newS)
        {
            if (newS == GameState.Countdown) ClearAllObstacleVisuals();
        }

        private void BuildScene()
        {
            var bg = new GameObject("Background");
            bg.transform.SetParent(transform, false);
            var bgSprite = bg.AddComponent<SpriteRenderer>();
            bgSprite.color = new Color(0.08f, 0.1f, 0.16f, 1f);
            bgSprite.sprite = CreateSolidSprite();
            bgSprite.sortingOrder = -100;
            bg.transform.localScale = new Vector3(40, 30, 1);
            bg.transform.position = new Vector3(0, 0, 10);

            var ground = new GameObject("Ground");
            ground.transform.SetParent(transform, false);
            var groundSprite = ground.AddComponent<SpriteRenderer>();
            groundSprite.color = new Color(0.12f, 0.16f, 0.24f, 1f);
            groundSprite.sprite = CreateSolidSprite();
            groundSprite.sortingOrder = -50;
            ground.transform.localScale = new Vector3(20, 6, 1);
            ground.transform.position = new Vector3(0, -3.5f, 0);

            LaneLeft = new GameObject("LaneLeft").transform;
            LaneLeft.SetParent(transform, false);
            LaneLeft.localPosition = new Vector3(-LaneSpacing / 2, -3f, 0);
            BuildLaneVisual(LaneLeft, new Color(0.18f, 0.24f, 0.36f, 0.9f));

            LaneRight = new GameObject("LaneRight").transform;
            LaneRight.SetParent(transform, false);
            LaneRight.localPosition = new Vector3(LaneSpacing / 2, -3f, 0);
            BuildLaneVisual(LaneRight, new Color(0.18f, 0.24f, 0.36f, 0.9f));

            LeftTrackAnchor = LaneLeft;
            RightTrackAnchor = LaneRight;

            var judgeLine = new GameObject("JudgeLine");
            judgeLine.transform.SetParent(transform, false);
            var jlSprite = judgeLine.AddComponent<SpriteRenderer>();
            jlSprite.color = new Color(1f, 0.85f, 0.4f, 0.9f);
            jlSprite.sprite = CreateSolidSprite();
            jlSprite.sortingOrder = 10;
            judgeLine.transform.localScale = new Vector3(8, 0.08f, 1);
            judgeLine.transform.localPosition = new Vector3(0, -2.2f, JudgeLineZ);

            var playerRoot = new GameObject("Player");
            playerRoot.transform.SetParent(transform, false);
            PlayerVisual = playerRoot.transform;
            PlayerVisual.localPosition = new Vector3(-LaneSpacing / 2, -2.5f, -0.5f);
            BuildPlayerVisual();

            ObstacleSpawnRoot = new GameObject("Obstacles").transform;
            ObstacleSpawnRoot.SetParent(transform, false);
        }

        private void BuildLaneVisual(Transform lane, Color color)
        {
            var laneBg = new GameObject("LaneBg");
            laneBg.transform.SetParent(lane, false);
            var sr = laneBg.AddComponent<SpriteRenderer>();
            sr.color = color;
            sr.sprite = CreateSolidSprite();
            sr.sortingOrder = -40;
            laneBg.transform.localScale = new Vector3(1.8f, 0.2f, 1);
            laneBg.transform.localPosition = new Vector3(0, 0, 5);

            for (int i = 0; i < 20; i++)
            {
                var step = new GameObject("Step_" + i);
                step.transform.SetParent(lane, false);
                var ssr = step.AddComponent<SpriteRenderer>();
                ssr.color = new Color(1, 1, 1, 0.05f + (i % 2) * 0.03f);
                ssr.sprite = CreateSolidSprite();
                ssr.sortingOrder = -39;
                step.transform.localScale = new Vector3(1.6f, 0.15f, 1);
                step.transform.localPosition = new Vector3(0, 0, 10 - i);
            }
        }

        private void BuildPlayerVisual()
        {
            var body = new GameObject("Body");
            body.transform.SetParent(PlayerVisual, false);
            var bSr = body.AddComponent<SpriteRenderer>();
            bSr.color = new Color(0.9f, 0.85f, 0.75f);
            bSr.sprite = CreateSolidSprite();
            bSr.sortingOrder = 20;
            body.transform.localScale = new Vector3(0.4f, 0.7f, 1);
            body.transform.localPosition = new Vector3(0, 0, 0);

            var head = new GameObject("Head");
            head.transform.SetParent(PlayerVisual, false);
            var hSr = head.AddComponent<SpriteRenderer>();
            hSr.color = new Color(0.95f, 0.82f, 0.7f);
            hSr.sprite = CreateSolidSprite();
            hSr.sortingOrder = 21;
            head.transform.localScale = new Vector3(0.3f, 0.3f, 1);
            head.transform.localPosition = new Vector3(0, 0.55f, 0);

            var umbrella = new GameObject("Umbrella");
            umbrella.transform.SetParent(PlayerVisual, false);
            PlayerUmbrellaRenderer = umbrella.AddComponent<SpriteRenderer>();
            PlayerUmbrellaRenderer.color = UmbrellaColor.BlueColor;
            PlayerUmbrellaRenderer.sprite = CreateUmbrellaSprite();
            PlayerUmbrellaRenderer.sortingOrder = 25;
            umbrella.transform.localScale = new Vector3(1.4f, 0.85f, 1);
            umbrella.transform.localPosition = new Vector3(0, 1.1f, -0.1f);
        }

        private void SpawnObstacleVisual(ActiveObstacle obs)
        {
            if (obs == null || ObstacleSpawnRoot == null) return;
            if (_obstacleVisuals.ContainsKey(obs.Index)) return;

            var go = new GameObject($"Obstacle_{obs.Index}_{obs.Data.Type}");
            go.transform.SetParent(ObstacleSpawnRoot, false);

            Color c = UmbrellaColor.ToUnityColor(obs.Data.RequiredColor);
            Sprite spr = GetObstacleSprite(obs.Data.Type);

            var sr = go.AddComponent<SpriteRenderer>();
            sr.sprite = spr;
            sr.sortingOrder = 15;

            float x = obs.Data.Track == TrackPosition.Left ? -LaneSpacing / 2 : LaneSpacing / 2;
            go.transform.localScale = obs.Data.Type == ObstacleType.LanternGate
                ? new Vector3(1.3f, 1.8f, 1)
                : new Vector3(0.9f, 0.9f, 1);

            var mover = go.AddComponent<ObstacleMover>();
            mover.Initialize(sr, c, x, obs.Data.BeatTimeMs, obs.Data.RequiredColor);

            _obstacleVisuals[obs.Index] = go;
            obs.VisualObject = go;
        }

        private void UpdateObstacleVisualOnJudge(ActiveObstacle obs, JudgeResult r)
        {
            if (obs == null || obs.VisualObject == null) return;
            var mover = obs.VisualObject.GetComponent<ObstacleMover>();
            if (mover != null) mover.OnJudged(r);
        }

        private void RemoveObstacleVisual(ActiveObstacle obs)
        {
            if (obs == null) return;
            if (_obstacleVisuals.TryGetValue(obs.Index, out var go) && go != null)
            {
                Destroy(go, 0.35f);
                _obstacleVisuals.Remove(obs.Index);
            }
            obs.VisualObject = null;
        }

        private void ClearAllObstacleVisuals()
        {
            foreach (var kv in _obstacleVisuals)
                if (kv.Value != null) Destroy(kv.Value);
            _obstacleVisuals.Clear();
            if (ObstacleSpawnRoot != null)
            {
                for (int i = ObstacleSpawnRoot.childCount - 1; i >= 0; i--)
                    Destroy(ObstacleSpawnRoot.GetChild(i).gameObject);
            }
        }

        private void OnColorChanged(UmbrellaColorType oldC, UmbrellaColorType newC)
        {
            UpdateUmbrellaColor(newC);
        }

        private void OnTrackChanged(TrackPosition oldT, TrackPosition newT)
        {
            UpdateTrackVisual(newT);
        }

        private void UpdateUmbrellaColor(UmbrellaColorType c)
        {
            if (PlayerUmbrellaRenderer != null)
                PlayerUmbrellaRenderer.color = UmbrellaColor.ToUnityColor(c);
        }

        private void UpdateTrackVisual(TrackPosition t)
        {
            if (PlayerVisual == null) return;
            float x = t == TrackPosition.Left ? -LaneSpacing / 2 : LaneSpacing / 2;
            StartCoroutine(SmoothMove(PlayerVisual, new Vector3(x, -2.5f, -0.5f), 0.18f));
        }

        private System.Collections.IEnumerator SmoothMove(Transform t, Vector3 target, float dur)
        {
            Vector3 from = t.localPosition;
            float e = 0;
            while (e < dur)
            {
                e += Time.deltaTime;
                float k = Mathf.Clamp01(e / dur);
                float eased = 1f - Mathf.Pow(1f - k, 3);
                t.localPosition = Vector3.Lerp(from, target, eased);
                yield return null;
            }
            t.localPosition = target;
        }

        private void Update()
        {
            if (_gm == null || _gm.CurrentState != GameState.Playing && _gm.CurrentState != GameState.Replay) return;
            if (_gm.Clock == null) return;

            double msPerBeat = _gm.Clock.MsPerBeat;
            double latency = _gm.Calibration != null ? _gm.Calibration.Settings.TotalLatencyMs : 0;
            double now = _gm.Clock.ElapsedMs + latency;

            foreach (var kv in _obstacleVisuals)
            {
                if (kv.Value == null) continue;
                var mover = kv.Value.GetComponent<ObstacleMover>();
                if (mover != null) mover.TickMovement(now, msPerBeat, ObstacleZStart, ObstacleZEnd, JudgeLineZ);
            }
        }

        private static Sprite CreateSolidSprite()
        {
            var tex = new Texture2D(4, 4, TextureFormat.RGBA32, false);
            var pix = new Color[16];
            for (int i = 0; i < 16; i++) pix[i] = Color.white;
            tex.SetPixels(pix);
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f), 4f);
        }

        private static Sprite CreateUmbrellaSprite()
        {
            int size = 128;
            var tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
            var pix = new Color[size * size];
            Vector2 c = new Vector2(size / 2f, size / 2.2f);
            float r = size * 0.42f;
            for (int y = 0; y < size; y++)
                for (int x = 0; x < size; x++)
                {
                    Vector2 p = new Vector2(x, y) - c;
                    float d = p.magnitude;
                    bool inCircle = d <= r && y >= c.y - r * 0.05f && p.y <= r * 0.85f;
                    bool rib = Mathf.Abs((Mathf.Atan2(p.y, p.x) * 180f / Mathf.PI + 90f) % 45f) < 3f && d < r && y >= c.y - 5;
                    bool shaft = x >= c.x - 3 && x <= c.x + 3 && y < c.y && y > c.y - r * 0.9f;
                    bool tip = Mathf.Abs(x - c.x) < 6 && Mathf.Abs(y - (c.y - r * 0.95f)) < 6;

                    if (inCircle || rib || shaft || tip)
                    {
                        pix[y * size + x] = Color.white;
                    }
                    else
                    {
                        pix[y * size + x] = new Color(0, 0, 0, 0);
                    }
                }
            tex.SetPixels(pix);
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f), size);
        }

        private static Sprite GetObstacleSprite(ObstacleType type)
        {
            int size = 96;
            var tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
            var pix = new Color[size * size];
            Vector2 c = new Vector2(size / 2f, size / 2f);

            switch (type)
            {
                case ObstacleType.Puddle:
                    for (int y = 0; y < size; y++)
                        for (int x = 0; x < size; x++)
                        {
                            Vector2 p = new Vector2(x, y) - c;
                            float nx = p.x / (size * 0.42f);
                            float ny = p.y / (size * 0.22f);
                            bool inEllipse = nx * nx + ny * ny <= 1;
                            bool ring = (nx * nx + ny * ny) > 0.78f && (nx * nx + ny * ny) < 1f;
                            pix[y * size + x] = inEllipse ? (ring ? new Color(1, 1, 1, 0.9f) : Color.white) : new Color(0, 0, 0, 0);
                        }
                    break;
                case ObstacleType.WindChime:
                    for (int y = 0; y < size; y++)
                        for (int x = 0; x < size; x++)
                        {
                            Vector2 p = new Vector2(x, y) - new Vector2(c.x, c.y + 8);
                            float dist = p.magnitude;
                            bool body = dist < size * 0.38f && dist > size * 0.28f && y < c.y + 5;
                            bool center = dist < size * 0.08f && y < c.y + 5;
                            bool string1 = Mathf.Abs(x - c.x) < 2 && y > c.y - size * 0.2f && y < c.y + size * 0.05f;
                            bool top = Mathf.Abs(x - c.x) < size * 0.25f && Mathf.Abs(y - (c.y + size * 0.38f)) < 4;
                            pix[y * size + x] = (body || center || string1 || top) ? Color.white : new Color(0, 0, 0, 0);
                        }
                    break;
                case ObstacleType.LanternGate:
                    for (int y = 0; y < size; y++)
                        for (int x = 0; x < size; x++)
                        {
                            Vector2 p = new Vector2(x, y) - c;
                            bool pillarL = x > size * 0.08f && x < size * 0.22f && y < size * 0.85f;
                            bool pillarR = x > size * 0.78f && x < size * 0.92f && y < size * 0.85f;
                            bool topBar = y > size * 0.82f && y < size * 0.94f && x > size * 0.05f && x < size * 0.95f;
                            bool lantern = (p - new Vector2(0, size * 0.25f)).magnitude < size * 0.13f;
                            pix[y * size + x] = (pillarL || pillarR || topBar || lantern) ? Color.white : new Color(0, 0, 0, 0);
                        }
                    break;
            }
            tex.SetPixels(pix);
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f), size);
        }
    }

    public class ObstacleMover : MonoBehaviour
    {
        private SpriteRenderer _sr;
        private Color _baseColor;
        private float _laneX;
        private double _targetBeatTimeMs;
        private UmbrellaColorType _colorType;
        private bool _judged = false;
        private JudgeResult _result;
        private float _judgeAnimT = 0f;
        private Vector3 _baseScale;

        public void Initialize(SpriteRenderer sr, Color color, float x, double targetMs, UmbrellaColorType cType)
        {
            _sr = sr;
            _baseColor = color;
            _sr.color = color;
            _laneX = x;
            _targetBeatTimeMs = targetMs;
            _colorType = cType;
            _baseScale = transform.localScale;
        }

        public void TickMovement(double currentTimeMs, double msPerBeat, float zStart, float zEnd, float judgeZ)
        {
            double lookAhead = 2200;
            double lead = _targetBeatTimeMs - currentTimeMs;
            float t = Mathf.Clamp01(1f - (float)(lead / lookAhead));
            float z = Mathf.Lerp(zStart, zEnd, t);
            float yScale = Mathf.Lerp(0.3f, 1f, t);
            float xJitter = Mathf.Sin((float)currentTimeMs * 0.005f + _targetBeatTimeMs * 0.001f) * 0.05f;
            transform.localPosition = new Vector3(_laneX + xJitter, Mathf.Lerp(-1.8f, -2.2f, t), z);
            transform.localScale = Vector3.Scale(_baseScale, new Vector3(Mathf.Lerp(0.35f, 1f, t), yScale, 1));

            if (_judged)
            {
                _judgeAnimT += Time.deltaTime;
                float k = Mathf.Clamp01(_judgeAnimT / 0.3f);
                if (_result.IsSuccessful)
                {
                    _sr.color = Color.Lerp(new Color(1, 1, 1, 1), new Color(1, 1, 1, 0), k);
                    transform.localScale *= (1f + k * 0.4f);
                }
                else
                {
                    float shake = Mathf.Sin(k * 60f) * 0.08f * (1 - k);
                    transform.localPosition += new Vector3(shake, 0, 0);
                    _sr.color = Color.Lerp(new Color(1, 0.3f, 0.3f, 1), new Color(1, 0.2f, 0.2f, 0), k);
                }
            }
            else
            {
                float pulse = 0.85f + Mathf.Sin((float)currentTimeMs * 0.01f + (float)_targetBeatTimeMs) * 0.15f;
                _sr.color = _baseColor * pulse;
            }
        }

        public void OnJudged(JudgeResult r)
        {
            _judged = true;
            _result = r;
            _judgeAnimT = 0f;
            if (_sr != null) _sr.color = r.IsSuccessful ? new Color(1, 1, 1) : new Color(1, 0.4f, 0.4f);
        }
    }
}
