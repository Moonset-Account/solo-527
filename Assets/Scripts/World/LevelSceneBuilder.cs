using UnityEngine;
using KitchenChaos.Config;
using KitchenChaos.Core;
using KitchenChaos.UI;

namespace KitchenChaos.World
{
    public class LevelSceneBuilder : MonoBehaviour
    {
        [SerializeField] StationSpawner _stationSpawner;
        [SerializeField] Transform _worldRoot;
        [SerializeField] GameObject _floorPrefab;
        [SerializeField] GameObject _wallPrefab;

        LevelConfig _current;

        void OnEnable()
        {
            EventBus.Subscribe<LevelStartedEvent>(OnLevelStart);
            EventBus.Subscribe<LevelEndedEvent>(OnLevelEnd);
        }

        void OnDisable()
        {
            EventBus.Unsubscribe<LevelStartedEvent>(OnLevelStart);
            EventBus.Unsubscribe<LevelEndedEvent>(OnLevelEnd);
        }

        void Start()
        {
            if (_worldRoot == null) _worldRoot = transform;
            if (_stationSpawner == null)
                _stationSpawner = gameObject.AddComponent<StationSpawner>();
        }

        void OnLevelStart(LevelStartedEvent e)
        {
            var gm = ServiceLocator.Get<GameManager>();
            _current = gm?.CurrentLevelConfig;
            ClearWorld();
            BuildEnvironment();
            BuildStations();
        }

        void OnLevelEnd(LevelEndedEvent e)
        {
            // 可以在这里添加延迟清理或特效
        }

        void ClearWorld()
        {
            if (_worldRoot == null) return;
            for (int i = _worldRoot.childCount - 1; i >= 0; i--)
                Destroy(_worldRoot.GetChild(i).gameObject);
        }

        void BuildEnvironment()
        {
            if (_worldRoot == null) return;
            var floor = _floorPrefab != null ? Instantiate(_floorPrefab, _worldRoot) : new GameObject("Floor");
            floor.transform.SetParent(_worldRoot, false);
            floor.transform.localPosition = Vector3.zero;
            var fr = floor.GetComponent<SpriteRenderer>() ?? floor.AddComponent<SpriteRenderer>();
            fr.color = new Color(0.38f, 0.3f, 0.25f);
            fr.sortingOrder = -10;
            fr.transform.localScale = new Vector3(22, 14, 1);

            BuildWall(new Vector3(0, 6.5f, 0), new Vector3(22, 1, 1));
            BuildWall(new Vector3(0, -6.5f, 0), new Vector3(22, 1, 1));
            BuildWall(new Vector3(-11, 0, 0), new Vector3(1, 14, 1));
            BuildWall(new Vector3(11, 0, 0), new Vector3(1, 14, 1));
        }

        void BuildWall(Vector3 pos, Vector3 scale)
        {
            var w = _wallPrefab != null ? Instantiate(_wallPrefab, _worldRoot) : new GameObject("Wall");
            w.transform.SetParent(_worldRoot, false);
            w.transform.localPosition = pos;
            w.transform.localScale = scale;
            var sr = w.GetComponent<SpriteRenderer>() ?? w.AddComponent<SpriteRenderer>();
            sr.color = new Color(0.25f, 0.2f, 0.18f);
            sr.sortingOrder = -5;
            var bc = w.GetComponent<BoxCollider2D>() ?? w.AddComponent<BoxCollider2D>();
            bc.size = Vector2.one;
        }

        void BuildStations()
        {
            if (_current == null || _stationSpawner == null || _current.StationPlacements == null) return;
            foreach (var p in _current.StationPlacements)
            {
                var st = _stationSpawner.SpawnStation(p);
                if (st != null && _worldRoot != null)
                    st.transform.SetParent(_worldRoot, true);
            }
        }
    }
}
