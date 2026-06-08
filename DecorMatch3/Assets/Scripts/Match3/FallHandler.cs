using UnityEngine;
using System.Collections.Generic;

namespace DecorMatch3
{
    public class FallInfo
    {
        public int fromRow;
        public int fromCol;
        public int toRow;
        public int toCol;
        public bool isNew;
    }

    public class FallHandler
    {
        public static List<FallInfo> CalculateFalls(TileType[,] board, int width, int height, bool[,] removed)
        {
            List<FallInfo> falls = new List<FallInfo>();

            for (int col = 0; col < width; col++)
            {
                int writeRow = height - 1;

                for (int row = height - 1; row >= 0; row--)
                {
                    if (!removed[row, col])
                    {
                        if (row != writeRow)
                        {
                            FallInfo info = new FallInfo();
                            info.fromRow = row;
                            info.fromCol = col;
                            info.toRow = writeRow;
                            info.toCol = col;
                            info.isNew = false;
                            falls.Add(info);
                        }
                        writeRow--;
                    }
                }

                for (int i = writeRow; i >= 0; i--)
                {
                    FallInfo info = new FallInfo();
                    info.fromRow = -1;
                    info.fromCol = col;
                    info.toRow = i;
                    info.toCol = col;
                    info.isNew = true;
                    falls.Add(info);
                }
            }

            return falls;
        }

        public static TileType[,] ApplyFalls(TileType[,] board, List<FallInfo> falls)
        {
            TileType[,] result = (TileType[,])board.Clone();

            for (int i = falls.Count - 1; i >= 0; i--)
            {
                FallInfo fall = falls[i];
                if (!fall.isNew)
                {
                    result[fall.toRow, fall.toCol] = result[fall.fromRow, fall.fromCol];
                    result[fall.fromRow, fall.fromCol] = TileType.None;
                }
            }

            foreach (FallInfo fall in falls)
            {
                if (fall.isNew)
                {
                    result[fall.toRow, fall.toCol] = TileType.None;
                }
            }

            return result;
        }

        public static List<Vector2Int> GetEmptySpaces(TileType[,] board, int width, int height)
        {
            List<Vector2Int> empty = new List<Vector2Int>();

            for (int row = 0; row < height; row++)
            {
                for (int col = 0; col < width; col++)
                {
                    if (board[row, col] == TileType.None)
                    {
                        empty.Add(new Vector2Int(col, row));
                    }
                }
            }

            return empty;
        }
    }
}
