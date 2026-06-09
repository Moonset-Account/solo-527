using System;
using System.Collections.Generic;

namespace BalloonPost.Core
{
    [Serializable]
    public class HexGrid
    {
        public Dictionary<AxialCoord, HexCell> Cells;
        public int Radius;
        public List<AxialCoord> Towns;
        public List<AxialCoord> PostOffices;

        public HexGrid()
        {
            Cells = new Dictionary<AxialCoord, HexCell>();
            Towns = new List<AxialCoord>();
            PostOffices = new List<AxialCoord>();
        }

        public HexGrid(int radius) : this()
        {
            Radius = radius;
            GenerateGrid();
        }

        public void GenerateGrid()
        {
            Cells.Clear();
            Towns.Clear();
            PostOffices.Clear();

            for (int q = -Radius; q <= Radius; q++)
            {
                for (int r = -Radius; r <= Radius; r++)
                {
                    if (Math.Abs(q + r) <= Radius)
                    {
                        var coord = new AxialCoord(q, r);
                        var cell = new HexCell(coord, HexTerrain.Plains, 0);
                        Cells[coord] = cell;
                    }
                }
            }
        }

        public bool TryGetCell(AxialCoord coord, out HexCell cell)
        {
            return Cells.TryGetValue(coord, out cell);
        }

        public HexCell GetCell(AxialCoord coord)
        {
            Cells.TryGetValue(coord, out var cell);
            return cell;
        }

        public bool Contains(AxialCoord coord)
        {
            return Cells.ContainsKey(coord);
        }

        public IEnumerable<HexCell> GetNeighbors(AxialCoord coord)
        {
            for (int i = 0; i < 6; i++)
            {
                var neighbor = coord.Neighbor(i);
                if (Cells.TryGetValue(neighbor, out var cell))
                {
                    yield return cell;
                }
            }
        }

        public List<AxialCoord> GetNeighborCoords(AxialCoord coord)
        {
            var result = new List<AxialCoord>();
            for (int i = 0; i < 6; i++)
            {
                var neighbor = coord.Neighbor(i);
                if (Cells.ContainsKey(neighbor))
                {
                    result.Add(neighbor);
                }
            }
            return result;
        }

        public void SetTerrain(AxialCoord coord, HexTerrain terrain)
        {
            if (Cells.TryGetValue(coord, out var cell))
            {
                cell.Terrain = terrain;
                if (terrain == HexTerrain.Town && !Towns.Contains(coord))
                {
                    Towns.Add(coord);
                }
                if (terrain == HexTerrain.PostOffice)
                {
                    cell.HasPostOffice = true;
                    if (!Towns.Contains(coord)) Towns.Add(coord);
                    if (!PostOffices.Contains(coord)) PostOffices.Add(coord);
                }
            }
        }

        public void SetElevation(AxialCoord coord, int elevation)
        {
            if (Cells.TryGetValue(coord, out var cell))
            {
                cell.Elevation = elevation;
            }
        }

        public void SetTownName(AxialCoord coord, string name)
        {
            if (Cells.TryGetValue(coord, out var cell))
            {
                cell.TownName = name;
            }
        }

        public HexCell FindTownByName(string name)
        {
            foreach (var town in Towns)
            {
                if (Cells.TryGetValue(town, out var cell) && cell.TownName == name)
                {
                    return cell;
                }
            }
            return null;
        }

        public AxialCoord FindTownCoordByName(string name)
        {
            foreach (var town in Towns)
            {
                if (Cells.TryGetValue(town, out var cell) && cell.TownName == name)
                {
                    return town;
                }
            }
            return AxialCoord.Zero;
        }

        public int Count => Cells.Count;
    }
}
