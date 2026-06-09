using System;
using System.Collections.Generic;
using UnityEngine;

namespace DecorMatch3.Match3
{
    public struct MatchInfo
    {
        public List<Vector2Int> TilePositions;
        public TileType TileType;
        public int MatchCount;
        public bool IsHorizontal;
        public int ComboLevel;
    }

    public static class MatchDetector
    {
        private const int MinMatchCount = 3;

        public static List<MatchInfo> FindAllMatches(TileType[,] grid)
        {
            List<MatchInfo> matches = new List<MatchInfo>();
            int width = grid.GetLength(0);
            int height = grid.GetLength(1);

            HashSet<Vector2Int> matchedPositions = new HashSet<Vector2Int>();

            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    TileType type = grid[x, y];
                    if (type == TileType.None || type == TileType.Empty || type == TileType.Obstacle)
                        continue;

                    if (matchedPositions.Contains(new Vector2Int(x, y)))
                        continue;

                    MatchInfo horizontalMatch = FindHorizontalMatch(grid, x, y, type);
                    if (horizontalMatch.MatchCount >= MinMatchCount)
                    {
                        foreach (var pos in horizontalMatch.TilePositions)
                            matchedPositions.Add(pos);
                        matches.Add(horizontalMatch);
                    }

                    MatchInfo verticalMatch = FindVerticalMatch(grid, x, y, type);
                    if (verticalMatch.MatchCount >= MinMatchCount)
                    {
                        foreach (var pos in verticalMatch.TilePositions)
                            matchedPositions.Add(pos);
                        matches.Add(verticalMatch);
                    }
                }
            }

            List<MatchInfo> mergedMatches = MergeOverlappingMatches(matches);
            AssignComboLevels(mergedMatches);

            return mergedMatches;
        }

        private static MatchInfo FindHorizontalMatch(TileType[,] grid, int startX, int startY, TileType type)
        {
            List<Vector2Int> positions = new List<Vector2Int> { new Vector2Int(startX, startY) };
            int width = grid.GetLength(0);

            for (int x = startX + 1; x < width; x++)
            {
                if (grid[x, startY] == type)
                {
                    positions.Add(new Vector2Int(x, startY));
                }
                else
                {
                    break;
                }
            }

            return new MatchInfo
            {
                TilePositions = positions,
                TileType = type,
                MatchCount = positions.Count,
                IsHorizontal = true
            };
        }

        private static MatchInfo FindVerticalMatch(TileType[,] grid, int startX, int startY, TileType type)
        {
            List<Vector2Int> positions = new List<Vector2Int> { new Vector2Int(startX, startY) };
            int height = grid.GetLength(1);

            for (int y = startY + 1; y < height; y++)
            {
                if (grid[startX, y] == type)
                {
                    positions.Add(new Vector2Int(startX, y));
                }
                else
                {
                    break;
                }
            }

            return new MatchInfo
            {
                TilePositions = positions,
                TileType = type,
                MatchCount = positions.Count,
                IsHorizontal = false
            };
        }

        private static List<MatchInfo> MergeOverlappingMatches(List<MatchInfo> matches)
        {
            if (matches.Count <= 1) return matches;

            List<MatchInfo> merged = new List<MatchInfo>(matches);
            bool changed = true;

            while (changed)
            {
                changed = false;
                for (int i = 0; i < merged.Count; i++)
                {
                    for (int j = i + 1; j < merged.Count; j++)
                    {
                        if (HasOverlap(merged[i], merged[j]))
                        {
                            merged[i] = MergeMatches(merged[i], merged[j]);
                            merged.RemoveAt(j);
                            changed = true;
                            break;
                        }
                    }
                    if (changed) break;
                }
            }

            return merged;
        }

        private static bool HasOverlap(MatchInfo a, MatchInfo b)
        {
            foreach (var posA in a.TilePositions)
            {
                foreach (var posB in b.TilePositions)
                {
                    if (posA == posB) return true;
                }
            }
            return false;
        }

        private static MatchInfo MergeMatches(MatchInfo a, MatchInfo b)
        {
            HashSet<Vector2Int> combined = new HashSet<Vector2Int>();
            foreach (var pos in a.TilePositions) combined.Add(pos);
            foreach (var pos in b.TilePositions) combined.Add(pos);

            List<Vector2Int> positions = new List<Vector2Int>(combined);

            return new MatchInfo
            {
                TilePositions = positions,
                TileType = a.TileType,
                MatchCount = positions.Count,
                IsHorizontal = a.MatchCount >= b.MatchCount ? a.IsHorizontal : b.IsHorizontal
            };
        }

        private static void AssignComboLevels(List<MatchInfo> matches)
        {
            for (int i = 0; i < matches.Count; i++)
            {
                MatchInfo match = matches[i];
                if (match.MatchCount >= 5)
                    match.ComboLevel = 3;
                else if (match.MatchCount >= 4)
                    match.ComboLevel = 2;
                else
                    match.ComboLevel = 1;

                matches[i] = match;
            }
        }

        public static bool CanFormMatch(TileType[,] grid, Vector2Int posA, Vector2Int posB)
        {
            TileType[,] testGrid = (TileType[,])grid.Clone();
            (testGrid[posA.x, posA.y], testGrid[posB.x, posB.y]) = (testGrid[posB.x, posB.y], testGrid[posA.x, posA.y]);
            List<MatchInfo> matches = FindAllMatches(testGrid);
            return matches.Count > 0;
        }

        public static bool HasAnyPossibleMove(TileType[,] grid)
        {
            int width = grid.GetLength(0);
            int height = grid.GetLength(1);

            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    if (x + 1 < width)
                    {
                        if (CanFormMatch(grid, new Vector2Int(x, y), new Vector2Int(x + 1, y)))
                            return true;
                    }
                    if (y + 1 < height)
                    {
                        if (CanFormMatch(grid, new Vector2Int(x, y), new Vector2Int(x, y + 1)))
                            return true;
                    }
                }
            }

            return false;
        }
    }
}
