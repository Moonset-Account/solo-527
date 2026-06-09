using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using DecorMatch3.Utils;

namespace DecorMatch3.Match3
{
    public class BoardManager : MonoBehaviour
    {
        [SerializeField] private RectTransform _boardContainer;
        [SerializeField] private Tile _tilePrefab;
        [SerializeField] private RectTransform _tileParent;

        private LevelData _currentLevelData;
        private Tile[,] _tiles;
        private TileType[,] _gridData;
        private int _width;
        private int _height;
        private float _tileSize;
        private float _tileSpacing;

        private Tile _selectedTile;
        private bool _isProcessing;
        private ObjectPool<Tile> _tilePool;

        public event Action<Tile, Tile> OnTilesSwapped;
        public event Action<List<MatchInfo>> OnMatchesFound;
        public event Action OnBoardStabilized;

        public bool IsProcessing => _isProcessing;
        public TileType[,] GridData => _gridData;
        public Tile[,] Tiles => _tiles;
        public LevelData CurrentLevelData => _currentLevelData;

        public void Initialize(LevelData levelData)
        {
            _currentLevelData = levelData;
            _width = levelData.BoardWidth;
            _height = levelData.BoardHeight;
            _tileSize = levelData.TileSize;
            _tileSpacing = levelData.TileSpacing;

            _tiles = new Tile[_width, _height];
            _gridData = new TileType[_width, _height];

            _tilePool = new ObjectPool<Tile>(_tilePrefab, _tileParent, _width * _height * 2, _width * _height * 4);

            SetupBoardSize();
            GenerateInitialBoard();
        }

        private void SetupBoardSize()
        {
            if (_boardContainer != null)
            {
                float totalWidth = _width * _tileSize + (_width + 1) * _tileSpacing;
                float totalHeight = _height * _tileSize + (_height + 1) * _tileSpacing;
                _boardContainer.sizeDelta = new Vector2(totalWidth, totalHeight);
            }
        }

        private void GenerateInitialBoard()
        {
            for (int y = 0; y < _height; y++)
            {
                for (int x = 0; x < _width; x++)
                {
                    if (_currentLevelData.PredefinedObstacles.Contains(new Vector2Int(x, y)))
                    {
                        CreateTile(x, y, TileType.Obstacle);
                        continue;
                    }

                    if (UnityEngine.Random.value < _currentLevelData.ObstacleSpawnRate)
                    {
                        CreateTile(x, y, TileType.Obstacle);
                        continue;
                    }

                    TileType type = GetRandomValidTileType(x, y);
                    CreateTile(x, y, type);
                }
            }

            EnsureInitialBoardHasNoMatches();
            EnsurePossibleMovesExist();
        }

        private TileType GetRandomValidTileType(int x, int y)
        {
            List<TileType> validTypes = new List<TileType>(_currentLevelData.AvailableTileTypes);

            if (x >= 2)
            {
                TileType left1 = _gridData[x - 1, y];
                TileType left2 = _gridData[x - 2, y];
                if (left1 == left2 && validTypes.Contains(left1))
                {
                    validTypes.Remove(left1);
                }
            }

            if (y >= 2)
            {
                TileType below1 = _gridData[x, y - 1];
                TileType below2 = _gridData[x, y - 2];
                if (below1 == below2 && validTypes.Contains(below1))
                {
                    validTypes.Remove(below1);
                }
            }

            if (validTypes.Count == 0)
            {
                validTypes = new List<TileType>(_currentLevelData.AvailableTileTypes);
            }

            return validTypes[UnityEngine.Random.Range(0, validTypes.Count)];
        }

        private void CreateTile(int x, int y, TileType type)
        {
            Tile tile = _tilePool.Get();
            tile.transform.SetParent(_tileParent, false);
            tile.name = $"Tile_{x}_{y}";
            tile.Initialize(type, x, y);

            Vector2 position = GetTileWorldPosition(x, y);
            tile.RectTransform.localPosition = position;
            tile.RectTransform.sizeDelta = new Vector2(_tileSize, _tileSize);

            tile.OnTilePointerDown += HandleTilePointerDown;
            tile.OnTilePointerEnter += HandleTilePointerEnter;

            _tiles[x, y] = tile;
            _gridData[x, y] = type;
        }

        private Vector2 GetTileWorldPosition(int x, int y)
        {
            float startX = -(_width * _tileSize + (_width - 1) * _tileSpacing) / 2f + _tileSize / 2f;
            float startY = -(_height * _tileSize + (_height - 1) * _tileSpacing) / 2f + _tileSize / 2f;

            float posX = startX + x * (_tileSize + _tileSpacing);
            float posY = startY + y * (_tileSize + _tileSpacing);

            return new Vector2(posX, posY);
        }

        private void EnsureInitialBoardHasNoMatches()
        {
            int maxIterations = 100;
            int iteration = 0;

            while (iteration < maxIterations)
            {
                List<MatchInfo> matches = MatchDetector.FindAllMatches(_gridData);
                if (matches.Count == 0) break;

                foreach (MatchInfo match in matches)
                {
                    foreach (Vector2Int pos in match.TilePositions)
                    {
                        if (_gridData[pos.x, pos.y] != TileType.Obstacle)
                        {
                            TileType newType = _currentLevelData.AvailableTileTypes[
                                UnityEngine.Random.Range(0, _currentLevelData.AvailableTileTypes.Count)];

                            while (newType == _gridData[pos.x, pos.y])
                            {
                                newType = _currentLevelData.AvailableTileTypes[
                                    UnityEngine.Random.Range(0, _currentLevelData.AvailableTileTypes.Count)];
                            }

                            _gridData[pos.x, pos.y] = newType;
                            _tiles[pos.x, pos.y].SetTileType(newType);
                        }
                    }
                }

                iteration++;
            }
        }

        private void EnsurePossibleMovesExist()
        {
            int maxIterations = 50;
            int iteration = 0;

            while (!MatchDetector.HasAnyPossibleMove(_gridData) && iteration < maxIterations)
            {
                ShuffleBoard();
                iteration++;
            }
        }

        private void HandleTilePointerDown(Tile tile)
        {
            if (_isProcessing || tile.State == TileState.Disabled) return;

            if (_selectedTile == null)
            {
                SelectTile(tile);
            }
            else if (_selectedTile == tile)
            {
                DeselectTile();
            }
            else
            {
                if (IsAdjacent(_selectedTile, tile))
                {
                    TrySwapTiles(_selectedTile, tile);
                }
                else
                {
                    DeselectTile();
                    SelectTile(tile);
                }
            }
        }

        private void HandleTilePointerEnter(Tile tile)
        {
            if (_isProcessing || _selectedTile == null) return;
            if (tile == _selectedTile) return;

            if (IsAdjacent(_selectedTile, tile))
            {
                TrySwapTiles(_selectedTile, tile);
            }
        }

        private void SelectTile(Tile tile)
        {
            _selectedTile = tile;
            tile.SetSelected(true);
        }

        private void DeselectTile()
        {
            if (_selectedTile != null)
            {
                _selectedTile.SetSelected(false);
                _selectedTile = null;
            }
        }

        private bool IsAdjacent(Tile a, Tile b)
        {
            Vector2Int diff = a.GridPosition - b.GridPosition;
            return Mathf.Abs(diff.x) + Mathf.Abs(diff.y) == 1;
        }

        public void TrySwapTiles(Tile tileA, Tile tileB)
        {
            StartCoroutine(SwapTilesRoutine(tileA, tileB));
        }

        private IEnumerator SwapTilesRoutine(Tile tileA, Tile tileB)
        {
            _isProcessing = true;
            DeselectTile();
            SetAllTilesInteractable(false);

            Vector2 posA = tileA.RectTransform.localPosition;
            Vector2 posB = tileB.RectTransform.localPosition;

            bool swapFinished = false;
            tileA.StartCoroutine(tileA.AnimateSwap(posB, 0.2f, () => { if (tileB.State == TileState.Swapping) swapFinished = true; }));
            yield return tileB.StartCoroutine(tileB.AnimateSwap(posA, 0.2f, () => { if (tileA.State == TileState.Idle) swapFinished = true; }));

            while (!swapFinished) yield return null;

            SwapGridData(tileA, tileB);
            SwapTileReferences(tileA, tileB);

            DecorMatch3.Core.AnalyticsSystem.Instance?.RecordTileSwap(
                tileA.GridX, tileA.GridY,
                tileB.GridX, tileB.GridY,
                true);

            List<MatchInfo> matches = MatchDetector.FindAllMatches(_gridData);

            if (matches.Count > 0)
            {
                OnTilesSwapped?.Invoke(tileA, tileB);
                yield return ProcessMatchesRoutine(matches);
            }
            else
            {
                DecorMatch3.Core.AnalyticsSystem.Instance?.RecordTileSwap(
                    tileA.GridX, tileA.GridY,
                    tileB.GridX, tileB.GridY,
                    false);

                swapFinished = false;
                tileA.StartCoroutine(tileA.AnimateSwap(posA, 0.2f, () => swapFinished = true));
                yield return tileB.StartCoroutine(tileB.AnimateSwap(posB, 0.2f, () => { }));

                while (!swapFinished) yield return null;

                SwapGridData(tileA, tileB);
                SwapTileReferences(tileA, tileB);
            }

            SetAllTilesInteractable(true);
            _isProcessing = false;
            OnBoardStabilized?.Invoke();
        }

        private void SwapGridData(Tile tileA, Tile tileB)
        {
            (_gridData[tileA.GridX, tileA.GridY], _gridData[tileB.GridX, tileB.GridY]) =
                (_gridData[tileB.GridX, tileB.GridY], _gridData[tileA.GridX, tileA.GridY]);
        }

        private void SwapTileReferences(Tile tileA, Tile tileB)
        {
            (_tiles[tileA.GridX, tileA.GridY], _tiles[tileB.GridX, tileB.GridY]) =
                (_tiles[tileB.GridX, tileB.GridY], _tiles[tileA.GridX, tileA.GridY]);

            int tempX = tileA.GridX;
            int tempY = tileA.GridY;
            tileA.SetPosition(tileB.GridX, tileB.GridY);
            tileB.SetPosition(tempX, tempY);
        }

        private IEnumerator ProcessMatchesRoutine(List<MatchInfo> matches)
        {
            int cascadeCount = 0;

            while (matches.Count > 0)
            {
                cascadeCount++;
                OnMatchesFound?.Invoke(matches);

                foreach (MatchInfo match in matches)
                {
                    DecorMatch3.Core.AnalyticsSystem.Instance?.RecordMatchDetected(
                        match.MatchCount,
                        (int)match.TileType,
                        match.ComboLevel + (cascadeCount > 1 ? cascadeCount : 0));
                }

                yield return RemoveMatchesRoutine(matches);
                yield return ApplyGravityRoutine();
                yield return FillEmptySpacesRoutine();

                matches = MatchDetector.FindAllMatches(_gridData);
            }
        }

        private IEnumerator RemoveMatchesRoutine(List<MatchInfo> matches)
        {
            List<Coroutine> removeCoroutines = new List<Coroutine>();

            foreach (MatchInfo match in matches)
            {
                foreach (Vector2Int pos in match.TilePositions)
                {
                    Tile tile = _tiles[pos.x, pos.y];
                    if (tile != null && tile.TileType != TileType.Obstacle)
                    {
                        tile.SetInteractable(false);
                        removeCoroutines.Add(StartCoroutine(tile.AnimateRemove(0.25f, () =>
                        {
                            _tilePool.Return(tile);
                        })));

                        _tiles[pos.x, pos.y] = null;
                        _gridData[pos.x, pos.y] = TileType.Empty;
                    }
                }
            }

            foreach (Coroutine coroutine in removeCoroutines)
            {
                yield return coroutine;
            }
        }

        private IEnumerator ApplyGravityRoutine()
        {
            List<Coroutine> fallCoroutines = new List<Coroutine>();

            for (int x = 0; x < _width; x++)
            {
                int writePos = 0;

                for (int y = 0; y < _height; y++)
                {
                    if (_gridData[x, y] == TileType.Empty || _gridData[x, y] == TileType.Obstacle)
                        continue;

                    if (y != writePos)
                    {
                        Tile tile = _tiles[x, y];
                        if (tile != null)
                        {
                            Vector2 newWorldPos = GetTileWorldPosition(x, writePos);
                            fallCoroutines.Add(StartCoroutine(tile.AnimateFall(newWorldPos, 0.3f)));

                            _tiles[x, writePos] = tile;
                            _tiles[x, y] = null;
                            _gridData[x, writePos] = _gridData[x, y];
                            _gridData[x, y] = TileType.Empty;

                            tile.SetPosition(x, writePos);
                        }
                    }

                    writePos++;
                }
            }

            foreach (Coroutine coroutine in fallCoroutines)
            {
                yield return coroutine;
            }
        }

        private IEnumerator FillEmptySpacesRoutine()
        {
            List<Coroutine> spawnCoroutines = new List<Coroutine>();
            Dictionary<int, int> spawnCountByColumn = new Dictionary<int, int>();

            for (int x = 0; x < _width; x++)
            {
                int emptyCount = 0;
                for (int y = 0; y < _height; y++)
                {
                    if (_gridData[x, y] == TileType.Empty)
                    {
                        TileType newType = _currentLevelData.AvailableTileTypes[
                            UnityEngine.Random.Range(0, _currentLevelData.AvailableTileTypes.Count)];

                        Tile newTile = _tilePool.Get();
                        newTile.transform.SetParent(_tileParent, false);
                        newTile.RectTransform.sizeDelta = new Vector2(_tileSize, _tileSize);

                        float spawnY = (_height * _tileSize + _height * _tileSpacing) / 2f + _tileSize + emptyCount * (_tileSize + _tileSpacing);
                        Vector2 spawnPos = new Vector2(GetTileWorldPosition(x, y).x, spawnY);
                        newTile.RectTransform.localPosition = spawnPos;
                        newTile.Initialize(newType, x, y);
                        newTile.SetTileType(newType);
                        newTile.OnTilePointerDown += HandleTilePointerDown;
                        newTile.OnTilePointerEnter += HandleTilePointerEnter;

                        _tiles[x, y] = newTile;
                        _gridData[x, y] = newType;

                        Vector2 targetPos = GetTileWorldPosition(x, y);
                        spawnCoroutines.Add(StartCoroutine(newTile.AnimateFall(targetPos, 0.35f)));

                        emptyCount++;
                    }
                }
                if (emptyCount > 0) spawnCountByColumn[x] = emptyCount;
            }

            foreach (Coroutine coroutine in spawnCoroutines)
            {
                yield return coroutine;
            }
        }

        public void ShuffleBoard()
        {
            StartCoroutine(ShuffleBoardRoutine());
        }

        private IEnumerator ShuffleBoardRoutine()
        {
            _isProcessing = true;
            SetAllTilesInteractable(false);

            List<(Vector2Int pos, TileType type, Tile tile)> tileData = new List<(Vector2Int, TileType, Tile)>();

            for (int x = 0; x < _width; x++)
            {
                for (int y = 0; y < _height; y++)
                {
                    if (_gridData[x, y] != TileType.Obstacle)
                    {
                        tileData.Add((new Vector2Int(x, y), _gridData[x, y], _tiles[x, y]));
                    }
                }
            }

            List<TileType> shuffledTypes = new List<TileType>();
            foreach (var data in tileData) shuffledTypes.Add(data.type);

            for (int i = shuffledTypes.Count - 1; i > 0; i--)
            {
                int j = UnityEngine.Random.Range(0, i + 1);
                (shuffledTypes[i], shuffledTypes[j]) = (shuffledTypes[j], shuffledTypes[i]);
            }

            List<Coroutine> shuffleCoroutines = new List<Coroutine>();

            for (int i = 0; i < tileData.Count; i++)
            {
                Vector2Int pos = tileData[i].pos;
                Tile tile = tileData[i].tile;
                TileType newType = shuffledTypes[i];

                _gridData[pos.x, pos.y] = newType;
                tile.SetTileType(newType);

                shuffleCoroutines.Add(StartCoroutine(tile.AnimateShake(0.3f, 8f)));
            }

            foreach (Coroutine coroutine in shuffleCoroutines)
            {
                yield return coroutine;
            }

            SetAllTilesInteractable(true);
            _isProcessing = false;
        }

        private void SetAllTilesInteractable(bool interactable)
        {
            for (int x = 0; x < _width; x++)
            {
                for (int y = 0; y < _height; y++)
                {
                    if (_tiles[x, y] != null)
                    {
                        _tiles[x, y].SetInteractable(interactable);
                    }
                }
            }
        }

        public Dictionary<int, int> GetTileTypeCounts()
        {
            Dictionary<int, int> counts = new Dictionary<int, int>();

            for (int x = 0; x < _width; x++)
            {
                for (int y = 0; y < _height; y++)
                {
                    TileType type = _gridData[x, y];
                    int id = type.GetMaterialId();
                    MaterialCategory? category = type.GetMaterialCategory();

                    if (category.HasValue)
                    {
                        if (!counts.ContainsKey(id)) counts[id] = 0;
                        counts[id]++;
                    }
                }
            }

            return counts;
        }

        public void ClearBoard()
        {
            StopAllCoroutines();

            for (int x = 0; x < _width; x++)
            {
                for (int y = 0; y < _height; y++)
                {
                    if (_tiles[x, y] != null)
                    {
                        _tilePool?.Return(_tiles[x, y]);
                        _tiles[x, y] = null;
                    }
                }
            }

            _tilePool?.Clear();
        }
    }
}
