using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using DecorMatch3.Core;
using DecorMatch3.Data;
using DecorMatch3.InputSystem;
using DecorMatch3.Audio;

namespace DecorMatch3.Gameplay.Match3
{
    public class Board : Singleton<Board>
    {
        [Header("Board Settings")]
        [SerializeField] private int width = 8;
        [SerializeField] private int height = 8;
        [SerializeField] private float cellSize = 1f;
        [SerializeField] private Vector2 boardOffset = Vector2.zero;

        [Header("Gem Prefab")]
        [SerializeField] private Gem gemPrefab;

        [Header("Timing")]
        [SerializeField] private float swapDuration = 0.2f;
        [SerializeField] private float matchCheckDelay = 0.05f;
        [SerializeField] private float gemFallSpeed = 15f;
        [SerializeField] private float cascadeDelay = 0.05f;

        [Header("Scoring")]
        [SerializeField] private int baseMatchScore = 50;
        [SerializeField] private int comboBonusMultiplier = 25;

        public Gem[,] Gems { get; private set; }
        public int Width => width;
        public int Height => height;
        public bool IsProcessing { get; private set; }

        private Gem _selectedGem;
        private Vector2Int _selectedPosition;
        private int _currentCombo = 0;
        private int _totalGemsClearedThisTurn = 0;

        public event Action<int, int> OnScoreAdded;
        public event Action<GemType, int> OnGemsCleared;
        public event Action<int> OnComboTriggered;
        public event Action OnSwapStarted;
        public event Action OnSwapCompleted;
        public event Action OnBoardStable;
        public event Action OnMoveMade;

        private List<LevelObjective> _objectives;
        private InputManager _inputManager;

        protected override void Awake()
        {
            base.Awake();
            _inputManager = InputManager.Instance;
        }

        private void OnEnable()
        {
            if (_inputManager != null)
            {
                _inputManager.OnInput += HandleInput;
            }
        }

        private void OnDisable()
        {
            if (_inputManager != null)
            {
                _inputManager.OnInput -= HandleInput;
            }
        }

        public void InitializeBoard(int boardWidth, int boardHeight, List<GemType> availableGems, List<LevelObjective> objectives)
        {
            width = boardWidth;
            height = boardHeight;
            _objectives = objectives;
            Gems = new Gem[width, height];

            ClearBoard();
            FillBoard(availableGems);
            EnsureInitialMatches();
        }

        private void ClearBoard()
        {
            if (Gems == null) return;

            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    if (Gems[x, y] != null)
                    {
                        Destroy(Gems[x, y].gameObject);
                        Gems[x, y] = null;
                    }
                }
            }

            _selectedGem = null;
            IsProcessing = false;
        }

        private void FillBoard(List<GemType> availableGems)
        {
            System.Random rng = new System.Random();

            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    GemType gemType;
                    int maxAttempts = 10;
                    int attempts = 0;

                    do
                    {
                        int index = rng.Next(availableGems.Count);
                        gemType = availableGems[index];
                        attempts++;
                    }
                    while (WouldCreateInitialMatch(x, y, gemType) && attempts < maxAttempts);

                    CreateGem(x, y, gemType, y * 0.02f);
                }
            }
        }

        private bool WouldCreateInitialMatch(int x, int y, GemType type)
        {
            if (x >= 2 && Gems[x - 1, y] != null && Gems[x - 2, y] != null)
            {
                if (Gems[x - 1, y].GemType == type && Gems[x - 2, y].GemType == type)
                {
                    return true;
                }
            }

            if (y >= 2 && Gems[x, y - 1] != null && Gems[x, y - 2] != null)
            {
                if (Gems[x, y - 1].GemType == type && Gems[x, y - 2].GemType == type)
                {
                    return true;
                }
            }

            return false;
        }

        private void EnsureInitialMatches()
        {
            StartCoroutine(ProcessMatchesCoroutine());
        }

        private Gem CreateGem(int x, int y, GemType gemType, float spawnDelay = 0f)
        {
            if (gemPrefab == null) return null;

            Gem gem = Instantiate(gemPrefab, transform);
            gem.Initialize(x, y, gemType);
            gem.OnGemClicked += HandleGemClicked;
            gem.OnGemDestroyed += HandleGemDestroyed;
            Gems[x, y] = gem;
            gem.SpawnAnimation(spawnDelay);
            return gem;
        }

        private void HandleInput(InputEvent inputEvent)
        {
            if (IsProcessing) return;

            switch (inputEvent.ActionType)
            {
                case InputActionType.Tap:
                    HandleTap(inputEvent.WorldPosition);
                    break;
                case InputActionType.SwipeLeft:
                case InputActionType.SwipeRight:
                case InputActionType.SwipeUp:
                case InputActionType.SwipeDown:
                    HandleSwipe(inputEvent);
                    break;
            }
        }

        private void HandleTap(Vector2 worldPosition)
        {
            Vector2Int gridPos = WorldToGridPosition(worldPosition);
            if (IsValidPosition(gridPos.x, gridPos.y))
            {
                Gem gem = Gems[gridPos.x, gridPos.y];
                if (gem != null)
                {
                    HandleGemClicked(gem);
                }
            }
        }

        private void HandleSwipe(InputEvent inputEvent)
        {
            if (_selectedGem == null)
            {
                Vector2Int gridPos = WorldToGridPosition(inputEvent.WorldPosition);
                if (IsValidPosition(gridPos.x, gridPos.y) && Gems[gridPos.x, gridPos.y] != null)
                {
                    _selectedGem = Gems[gridPos.x, gridPos.y];
                    _selectedGem.SetSelected(true);
                    _selectedPosition = new Vector2Int(gridPos.x, gridPos.y);
                }
            }

            if (_selectedGem != null)
            {
                Vector2Int targetDir = Vector2Int.zero;

                switch (inputEvent.ActionType)
                {
                    case InputActionType.SwipeLeft: targetDir = Vector2Int.left; break;
                    case InputActionType.SwipeRight: targetDir = Vector2Int.right; break;
                    case InputActionType.SwipeUp: targetDir = Vector2Int.up; break;
                    case InputActionType.SwipeDown: targetDir = Vector2Int.down; break;
                }

                if (targetDir != Vector2Int.zero)
                {
                    Vector2Int targetPos = _selectedPosition + targetDir;
                    if (IsValidPosition(targetPos.x, targetPos.y) && Gems[targetPos.x, targetPos.y] != null)
                    {
                        TrySwap(_selectedPosition.x, _selectedPosition.y, targetPos.x, targetPos.y);
                    }
                    else
                    {
                        ClearSelection();
                    }
                }
            }
        }

        private void HandleGemClicked(Gem gem)
        {
            if (IsProcessing || gem == null) return;

            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);

            if (_selectedGem == null)
            {
                _selectedGem = gem;
                _selectedPosition = new Vector2Int(gem.X, gem.Y);
                gem.SetSelected(true);
            }
            else if (_selectedGem == gem)
            {
                ClearSelection();
            }
            else
            {
                int dx = Mathf.Abs(gem.X - _selectedGem.X);
                int dy = Mathf.Abs(gem.Y - _selectedGem.Y);

                if ((dx == 1 && dy == 0) || (dx == 0 && dy == 1))
                {
                    TrySwap(_selectedGem.X, _selectedGem.Y, gem.X, gem.Y);
                }
                else
                {
                    ClearSelection();
                    _selectedGem = gem;
                    _selectedPosition = new Vector2Int(gem.X, gem.Y);
                    gem.SetSelected(true);
                }
            }
        }

        private void ClearSelection()
        {
            if (_selectedGem != null)
            {
                _selectedGem.SetSelected(false);
                _selectedGem = null;
            }
        }

        private void HandleGemDestroyed(Gem gem)
        {
            if (IsValidPosition(gem.X, gem.Y) && Gems[gem.X, gem.Y] == gem)
            {
                Gems[gem.X, gem.Y] = null;
            }
        }

        public Vector2 GridToWorldPosition(int x, int y)
        {
            float worldX = (x - (width - 1) * 0.5f) * cellSize + boardOffset.x;
            float worldY = (y - (height - 1) * 0.5f) * cellSize + boardOffset.y;
            return new Vector2(worldX, worldY);
        }

        public Vector2Int WorldToGridPosition(Vector2 worldPosition)
        {
            Vector2 localPos = worldPosition - (Vector2)transform.position - boardOffset;
            int x = Mathf.RoundToInt(localPos.x / cellSize + (width - 1) * 0.5f);
            int y = Mathf.RoundToInt(localPos.y / cellSize + (height - 1) * 0.5f);
            return new Vector2Int(x, y);
        }

        public bool IsValidPosition(int x, int y)
        {
            return x >= 0 && x < width && y >= 0 && y < height;
        }

        public void TrySwap(int x1, int y1, int x2, int y2)
        {
            if (IsProcessing) return;

            StartCoroutine(SwapCoroutine(x1, y1, x2, y2));
        }

        private IEnumerator SwapCoroutine(int x1, int y1, int x2, int y2)
        {
            IsProcessing = true;
            ClearSelection();
            OnSwapStarted?.Invoke();

            AudioManager.Instance?.PlaySFX(SFXType.GemSwap);

            Gem gem1 = Gems[x1, y1];
            Gem gem2 = Gems[x2, y2];

            if (gem1 == null || gem2 == null)
            {
                IsProcessing = false;
                yield break;
            }

            Vector3 pos1 = Board.Instance.GridToWorldPosition(x1, y1);
            Vector3 pos2 = Board.Instance.GridToWorldPosition(x2, y2);

            gem1.MoveToPosition(pos2, 10f);
            gem2.MoveToPosition(pos1, 10f);

            while (gem1.IsMoving || gem2.IsMoving)
            {
                yield return null;
            }

            Gems[x1, y1] = gem2;
            Gems[x2, y2] = gem1;
            gem1.SetPosition(x2, y2);
            gem2.SetPosition(x1, y1);

            yield return new WaitForSeconds(matchCheckDelay);

            List<Gem> matches = FindAllMatches();

            if (matches.Count == 0)
            {
                AudioManager.Instance?.PlaySFX(SFXType.GemSwap, 0.7f, 0.8f);
                gem1.MoveToPosition(pos1, 10f);
                gem2.MoveToPosition(pos2, 10f);

                while (gem1.IsMoving || gem2.IsMoving)
                {
                    yield return null;
                }

                Gems[x1, y1] = gem1;
                Gems[x2, y2] = gem2;
                gem1.SetPosition(x1, y1);
                gem2.SetPosition(x2, y2);

                IsProcessing = false;
                OnSwapCompleted?.Invoke();
            }
            else
            {
                OnMoveMade?.Invoke();
                _currentCombo = 0;
                _totalGemsClearedThisTurn = 0;
                StartCoroutine(ProcessMatchesCoroutine());
            }
        }

        private IEnumerator ProcessMatchesCoroutine()
        {
            yield return null;

            bool hasMatches = true;
            _currentCombo = 0;

            while (hasMatches)
            {
                List<Gem> matches = FindAllMatches();

                if (matches.Count == 0)
                {
                    hasMatches = false;
                    break;
                }

                _currentCombo++;

                if (_currentCombo > 1)
                {
                    OnComboTriggered?.Invoke(_currentCombo);
                    AudioManager.Instance?.PlaySFX(SFXType.Combo, 0.8f + _currentCombo * 0.1f, 1f + _currentCombo * 0.05f);
                }

                int matchScore = CalculateScore(matches.Count, _currentCombo);
                OnScoreAdded?.Invoke(matchScore, _currentCombo);

                Dictionary<GemType, int> gemsByType = new Dictionary<GemType, int>();

                foreach (Gem gem in matches)
                {
                    if (gem == null) continue;

                    if (!gemsByType.ContainsKey(gem.GemType))
                    {
                        gemsByType[gem.GemType] = 0;
                    }
                    gemsByType[gem.GemType]++;

                    gem.IsMatched = true;
                }

                foreach (var kvp in gemsByType)
                {
                    OnGemsCleared?.Invoke(kvp.Key, kvp.Value);
                }

                if (gemsByType.Count > 0)
                {
                    AudioManager.Instance?.PlaySFX(SFXType.GemClear, 0.8f, 0.95f + _currentCombo * 0.05f);
                }

                int maxYDestroyed = 0;
                foreach (Gem gem in matches)
                {
                    if (gem != null)
                    {
                        gem.DestroyGem(gem.Y * 0.02f);
                        maxYDestroyed = Mathf.Max(maxYDestroyed, gem.Y);
                    }
                }

                float longestDestroy = maxYDestroyed * 0.02f + 0.25f;
                yield return new WaitForSeconds(longestDestroy);

                StartCoroutine(MakeGemsFallCoroutine());

                yield return new WaitForSeconds(0.3f + cascadeDelay);
            }

            OnBoardStable?.Invoke();
            OnSwapCompleted?.Invoke();
            IsProcessing = false;
        }

        private List<Gem> FindAllMatches()
        {
            HashSet<Gem> matchedGems = new HashSet<Gem>();

            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    if (Gems[x, y] == null || Gems[x, y].IsMatched) continue;

                    List<Gem> horizontalMatch = FindMatchInDirection(x, y, 1, 0);
                    if (horizontalMatch.Count >= 3)
                    {
                        foreach (Gem gem in horizontalMatch)
                        {
                            matchedGems.Add(gem);
                        }
                    }

                    List<Gem> verticalMatch = FindMatchInDirection(x, y, 0, 1);
                    if (verticalMatch.Count >= 3)
                    {
                        foreach (Gem gem in verticalMatch)
                        {
                            matchedGems.Add(gem);
                        }
                    }
                }
            }

            return new List<Gem>(matchedGems);
        }

        private List<Gem> FindMatchInDirection(int startX, int startY, int dx, int dy)
        {
            List<Gem> match = new List<Gem>();
            Gem startGem = Gems[startX, startY];
            if (startGem == null) return match;

            GemType matchType = startGem.GemType;
            match.Add(startGem);

            int x = startX + dx;
            int y = startY + dy;

            while (IsValidPosition(x, y) && Gems[x, y] != null && Gems[x, y].GemType == matchType && !Gems[x, y].IsMatched)
            {
                match.Add(Gems[x, y]);
                x += dx;
                y += dy;
            }

            return match;
        }

        private int CalculateScore(int gemCount, int combo)
        {
            int score = baseMatchScore * gemCount;
            if (combo > 1)
            {
                score += comboBonusMultiplier * (combo - 1) * gemCount;
            }
            if (gemCount > 3)
            {
                score += baseMatchScore * (gemCount - 3) * 2;
            }
            return score;
        }

        private IEnumerator MakeGemsFallCoroutine()
        {
            AudioManager.Instance?.PlaySFX(SFXType.GemFall, 0.5f);

            for (int x = 0; x < width; x++)
            {
                int emptySpaces = 0;

                for (int y = 0; y < height; y++)
                {
                    if (Gems[x, y] == null)
                    {
                        emptySpaces++;
                    }
                    else if (emptySpaces > 0)
                    {
                        Gem gem = Gems[x, y];
                        int newY = y - emptySpaces;
                        Gems[x, newY] = gem;
                        Gems[x, y] = null;
                        gem.MoveToGridPosition(x, newY, gemFallSpeed);
                    }
                }

                if (emptySpaces > 0)
                {
                    List<GemType> availableGems = GetAvailableGemTypes();
                    System.Random rng = new System.Random();

                    for (int i = 0; i < emptySpaces; i++)
                    {
                        int targetY = height - emptySpaces + i;
                        GemType type = availableGems[rng.Next(availableGems.Count)];

                        Vector3 spawnPos = GridToWorldPosition(x, height + i);
                        Gem newGem = CreateGem(x, targetY, type, 0f);
                        newGem.transform.localPosition = spawnPos;
                        newGem.MoveToGridPosition(x, targetY, gemFallSpeed);
                    }
                }
            }

            yield return null;
        }

        private List<GemType> GetAvailableGemTypes()
        {
            List<GemType> types = new List<GemType>();
            if (LevelManager.Instance?.CurrentLevel?.AvailableGems != null)
            {
                types.AddRange(LevelManager.Instance.CurrentLevel.AvailableGems);
            }
            if (types.Count == 0)
            {
                types = new List<GemType> { GemType.Red, GemType.Blue, GemType.Green, GemType.Yellow, GemType.Purple };
            }
            return types;
        }

        public int GetRemainingPossibleMoves()
        {
            int moves = 0;

            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    if (Gems[x, y] == null) continue;

                    if (x < width - 1 && Gems[x + 1, y] != null)
                    {
                        if (WouldCreateMatch(x, y, x + 1, y))
                        {
                            moves++;
                        }
                    }

                    if (y < height - 1 && Gems[x, y + 1] != null)
                    {
                        if (WouldCreateMatch(x, y, x, y + 1))
                        {
                            moves++;
                        }
                    }
                }
            }

            return moves;
        }

        private bool WouldCreateMatch(int x1, int y1, int x2, int y2)
        {
            SwapInArray(x1, y1, x2, y2);
            bool hasMatch = FindAllMatches().Count > 0;
            SwapInArray(x1, y1, x2, y2);
            return hasMatch;
        }

        private void SwapInArray(int x1, int y1, int x2, int y2)
        {
            Gem temp = Gems[x1, y1];
            Gems[x1, y1] = Gems[x2, y2];
            Gems[x2, y2] = temp;
        }

        public Vector2 BoardSize => new Vector2(width * cellSize, height * cellSize);
        public float CellSize => cellSize;
        public int CurrentCombo => _currentCombo;
    }
}
