using System;
using UnityEngine;
using System.Collections;
using System.Collections.Generic;

namespace DecorMatch3
{
    public class Board : MonoBehaviour
    {
        public Tile[,] Tiles { get; private set; }
        public int Width { get; private set; }
        public int Height { get; private set; }
        public LevelConfigData CurrentConfig { get; private set; }
        public bool IsAnimating { get; private set; }

        public event Action<List<MatchGroup>> OnBoardStabilized;
        public event Action OnVisualUpdateNeeded;

        private TileType[,] _boardData;
        private float _cellSize = 1f;
        private List<MatchGroup> _accumulatedMatches = new List<MatchGroup>();

        public void Initialize(LevelConfigData config)
        {
            CurrentConfig = config;
            Width = config.boardWidth;
            Height = config.boardHeight;
            Tiles = new Tile[Height, Width];
            _boardData = new TileType[Height, Width];
            IsAnimating = false;
            GenerateBoard();
        }

        public void GenerateBoard()
        {
            for (int row = 0; row < Height; row++)
            {
                for (int col = 0; col < Width; col++)
                {
                    TileType type = GetRandomTileType();
                    while (WouldCreateMatch(row, col, type))
                    {
                        type = GetRandomTileType();
                    }
                    _boardData[row, col] = type;
                }
            }
        }

        public TileType GetRandomTileType()
        {
            TileType[] available = CurrentConfig.availableTypes;
            return available[Random.Range(0, available.Length)];
        }

        private bool WouldCreateMatch(int row, int col, TileType type)
        {
            if (col >= 2 && _boardData[row, col - 1] == type && _boardData[row, col - 2] == type)
            {
                return true;
            }
            if (row >= 2 && _boardData[row - 1, col] == type && _boardData[row - 2, col] == type)
            {
                return true;
            }
            return false;
        }

        public bool TrySwap(int r1, int c1, int r2, int c2)
        {
            if (IsAnimating) return false;
            if (r1 < 0 || r1 >= Height || c1 < 0 || c1 >= Width) return false;
            if (r2 < 0 || r2 >= Height || c2 < 0 || c2 >= Width) return false;

            if (!MatchEngine.WouldMatch(_boardData, r1, c1, r2, c2, Width, Height))
            {
                return false;
            }

            TileType temp = _boardData[r1, c1];
            _boardData[r1, c1] = _boardData[r2, c2];
            _boardData[r2, c2] = temp;

            if (Tiles[r1, c1] != null)
            {
                Tiles[r1, c1].Row = r1;
                Tiles[r1, c1].Col = c1;
                Tiles[r1, c1].TileType = _boardData[r1, c1];
            }
            if (Tiles[r2, c2] != null)
            {
                Tiles[r2, c2].Row = r2;
                Tiles[r2, c2].Col = c2;
                Tiles[r2, c2].TileType = _boardData[r2, c2];
            }

            return true;
        }

        public List<MatchGroup> ProcessMatches()
        {
            return MatchEngine.FindMatches(_boardData, Width, Height);
        }

        public void RemoveMatches(List<MatchGroup> matches)
        {
            bool[,] removed = new bool[Height, Width];

            foreach (MatchGroup group in matches)
            {
                foreach (Vector2Int pos in group.positions)
                {
                    int row = pos.y;
                    int col = pos.x;
                    removed[row, col] = true;
                    _boardData[row, col] = TileType.None;

                    if (Tiles[row, col] != null)
                    {
                        Tiles[row, col].IsMatched = true;
                    }
                }
            }
        }

        public void ApplyGravity()
        {
            for (int col = 0; col < Width; col++)
            {
                int writeRow = Height - 1;

                for (int row = Height - 1; row >= 0; row--)
                {
                    if (_boardData[row, col] != TileType.None)
                    {
                        if (row != writeRow)
                        {
                            _boardData[writeRow, col] = _boardData[row, col];
                            _boardData[row, col] = TileType.None;

                            if (Tiles[row, col] != null)
                            {
                                Tile tile = Tiles[row, col];
                                Tiles[writeRow, col] = tile;
                                Tiles[row, col] = null;
                                tile.Row = writeRow;
                                tile.Col = col;
                                tile.IsFalling = true;
                            }
                        }
                        writeRow--;
                    }
                }
            }
        }

        public void FillEmptySpaces()
        {
            for (int col = 0; col < Width; col++)
            {
                for (int row = 0; row < Height; row++)
                {
                    if (_boardData[row, col] == TileType.None)
                    {
                        _boardData[row, col] = GetRandomTileType();
                    }
                }
            }
        }

        public IEnumerator ProcessBoardCoroutine()
        {
            IsAnimating = true;
            _accumulatedMatches.Clear();

            while (true)
            {
                List<MatchGroup> matches = ProcessMatches();
                if (matches == null || matches.Count == 0)
                {
                    break;
                }

                _accumulatedMatches.AddRange(matches);
                RemoveMatches(matches);
                OnVisualUpdateNeeded?.Invoke();
                yield return new WaitForSeconds(0.35f);

                ApplyGravity();
                OnVisualUpdateNeeded?.Invoke();
                yield return new WaitForSeconds(0.2f);

                FillEmptySpaces();
                OnVisualUpdateNeeded?.Invoke();
                yield return new WaitForSeconds(0.25f);
            }

            if (CheckDeadlock())
            {
                ShuffleBoard();
            }

            IsAnimating = false;
            OnBoardStabilized?.Invoke(_accumulatedMatches);
        }

        public bool CheckDeadlock()
        {
            return !MatchEngine.HasValidMoves(_boardData, Width, Height);
        }

        public void ShuffleBoard()
        {
            List<TileType> types = new List<TileType>();
            for (int row = 0; row < Height; row++)
            {
                for (int col = 0; col < Width; col++)
                {
                    types.Add(_boardData[row, col]);
                }
            }

            for (int i = types.Count - 1; i > 0; i--)
            {
                int j = Random.Range(0, i + 1);
                TileType temp = types[i];
                types[i] = types[j];
                types[j] = temp;
            }

            int index = 0;
            for (int row = 0; row < Height; row++)
            {
                for (int col = 0; col < Width; col++)
                {
                    _boardData[row, col] = types[index++];
                }
            }

            if (CheckDeadlock())
            {
                GenerateBoard();
            }

            GameEvents.TriggerBoardReset();
        }

        public TileType GetTileTypeAt(int row, int col)
        {
            if (row < 0 || row >= Height || col < 0 || col >= Width)
            {
                return TileType.None;
            }
            return _boardData[row, col];
        }
    }
}
