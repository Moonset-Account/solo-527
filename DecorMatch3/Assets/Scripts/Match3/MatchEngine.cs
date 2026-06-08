using UnityEngine;
using System.Collections.Generic;

namespace DecorMatch3
{
    public class MatchGroup
    {
        public List<Vector2Int> positions;
        public TileType type;
        public int count;

        public MatchGroup()
        {
            positions = new List<Vector2Int>();
        }
    }

    public class MatchEngine
    {
        public static List<MatchGroup> FindMatches(TileType[,] board, int width, int height)
        {
            List<MatchGroup> matches = new List<MatchGroup>();

            for (int row = 0; row < height; row++)
            {
                int col = 0;
                while (col < width)
                {
                    TileType type = board[row, col];
                    int startCol = col;
                    while (col < width && board[row, col] == type)
                    {
                        col++;
                    }
                    if (col - startCol >= 3)
                    {
                        MatchGroup group = new MatchGroup();
                        group.type = type;
                        group.count = col - startCol;
                        for (int c = startCol; c < col; c++)
                        {
                            group.positions.Add(new Vector2Int(c, row));
                        }
                        matches.Add(group);
                    }
                }
            }

            for (int col = 0; col < width; col++)
            {
                int row = 0;
                while (row < height)
                {
                    TileType type = board[row, col];
                    int startRow = row;
                    while (row < height && board[row, col] == type)
                    {
                        row++;
                    }
                    if (row - startRow >= 3)
                    {
                        MatchGroup group = new MatchGroup();
                        group.type = type;
                        group.count = row - startRow;
                        for (int r = startRow; r < row; r++)
                        {
                            group.positions.Add(new Vector2Int(col, r));
                        }
                        matches.Add(group);
                    }
                }
            }

            return matches;
        }

        public static bool HasValidMoves(TileType[,] board, int width, int height)
        {
            for (int row = 0; row < height; row++)
            {
                for (int col = 0; col < width; col++)
                {
                    if (col + 1 < width && WouldMatch(board, row, col, row, col + 1, width, height))
                    {
                        return true;
                    }
                    if (row + 1 < height && WouldMatch(board, row, col, row + 1, col, width, height))
                    {
                        return true;
                    }
                }
            }
            return false;
        }

        public static bool WouldMatch(TileType[,] board, int r1, int c1, int r2, int c2, int width, int height)
        {
            if (r1 < 0 || r1 >= height || c1 < 0 || c1 >= width)
                return false;
            if (r2 < 0 || r2 >= height || c2 < 0 || c2 >= width)
                return false;

            TileType temp = board[r1, c1];
            board[r1, c1] = board[r2, c2];
            board[r2, c2] = temp;

            bool result = HasMatchAt(board, r1, c1, width, height) || HasMatchAt(board, r2, c2, width, height);

            board[r2, c2] = board[r1, c1];
            board[r1, c1] = temp;

            return result;
        }

        public static List<MatchGroup> FindMatchesAt(TileType[,] board, int row, int col, int width, int height)
        {
            List<MatchGroup> allMatches = FindMatches(board, width, height);
            List<MatchGroup> result = new List<MatchGroup>();

            foreach (MatchGroup group in allMatches)
            {
                foreach (Vector2Int pos in group.positions)
                {
                    if (pos.x == col && pos.y == row)
                    {
                        result.Add(group);
                        break;
                    }
                }
            }

            return result;
        }

        private static bool HasMatchAt(TileType[,] board, int row, int col, int width, int height)
        {
            TileType type = board[row, col];

            int horizontalCount = 1;
            int c = col - 1;
            while (c >= 0 && board[row, c] == type) { horizontalCount++; c--; }
            c = col + 1;
            while (c < width && board[row, c] == type) { horizontalCount++; c++; }
            if (horizontalCount >= 3) return true;

            int verticalCount = 1;
            int r = row - 1;
            while (r >= 0 && board[r, col] == type) { verticalCount++; r--; }
            r = row + 1;
            while (r < height && board[r, col] == type) { verticalCount++; r++; }
            if (verticalCount >= 3) return true;

            return false;
        }
    }
}
