using System;
using System.Collections.Generic;

namespace BalloonPost.Core
{
    public static class MapGenerator
    {
        private static readonly string[] TownNames = new string[]
        {
            "云顶镇", "风车村", "晨雾港", "暮光城", "星语乡",
            "碧波湾", "翠林谷", "金穗镇", "银霜村", "翠影港",
            "朝阳镇", "落霞村", "晴空港", "幽谷城", "微风乡",
            "艳阳镇", "皓月村", "碧波城", "翠竹谷", "丹霞镇"
        };

        public static HexGrid GenerateStandardMap(int radius, int seed = 42)
        {
            var random = new Random(seed);
            var grid = new HexGrid(radius);

            GenerateTerrain(grid, random);
            GenerateTowns(grid, radius, random);
            GenerateMountains(grid, random, radius);
            GenerateForests(grid, random);
            GenerateLakes(grid, random);
            GenerateStorms(grid, random);

            return grid;
        }

        public static HexGrid GenerateTutorialMap1()
        {
            var grid = new HexGrid(3);

            grid.SetTerrain(AxialCoord.Zero, HexTerrain.PostOffice);
            grid.SetTownName(AxialCoord.Zero, "邮局总站");

            var eastTown = new AxialCoord(2, 0);
            grid.SetTerrain(eastTown, HexTerrain.Town);
            grid.SetTownName(eastTown, "云顶镇");

            var mid1 = new AxialCoord(1, 0);
            grid.SetTerrain(mid1, HexTerrain.Plains);

            return grid;
        }

        public static HexGrid GenerateTutorialMap2()
        {
            var grid = new HexGrid(4);

            grid.SetTerrain(AxialCoord.Zero, HexTerrain.PostOffice);
            grid.SetTownName(AxialCoord.Zero, "邮局总站");

            var town1 = new AxialCoord(3, 0);
            grid.SetTerrain(town1, HexTerrain.Town);
            grid.SetTownName(town1, "云顶镇");

            var town2 = new AxialCoord(0, -3);
            grid.SetTerrain(town2, HexTerrain.Town);
            grid.SetTownName(town2, "晨雾港");

            for (int q = 0; q <= 3; q++)
            {
                for (int r = 0; r <= 3; r++)
                {
                    if (Math.Abs(q + r) <= 4)
                    {
                        var coord = new AxialCoord(q, -r);
                        if (grid.TryGetCell(coord, out var cell) && cell.Terrain == HexTerrain.Plains)
                        {
                            if ((q + r) % 2 == 0 && q > 0 && r > 0)
                            {
                                grid.SetElevationRandom(coord);
                            }
                        }
                    }
                }
            }

            var storm = new AxialCoord(2, -1);
            grid.SetTerrain(storm, HexTerrain.Forest);

            return grid;
        }

        public static HexGrid GenerateTutorialMap3()
        {
            var grid = new HexGrid(5);

            grid.SetTerrain(AxialCoord.Zero, HexTerrain.PostOffice);
            grid.SetTownName(AxialCoord.Zero, "邮局总站");

            var positions = new (AxialCoord, string)[]
            {
                (new AxialCoord(4, -1), "风车村"),
                (new AxialCoord(-2, 3), "暮光城"),
                (new AxialCoord(0, -4), "晨雾港"),
            };

            foreach (var (pos, name) in positions)
            {
                grid.SetTerrain(pos, HexTerrain.Town);
                grid.SetTownName(pos, name);
            }

            var mountain = new AxialCoord(2, -2);
            grid.SetTerrain(mountain, HexTerrain.Mountain);
            grid.SetElevation(mountain, 4);

            var forest = new AxialCoord(-1, 1);
            grid.SetTerrain(forest, HexTerrain.Forest);

            return grid;
        }

        private static void GenerateTerrain(HexGrid grid, Random random)
        {
            foreach (var cell in grid.Cells.Values)
            {
                cell.Terrain = HexTerrain.Plains;
                int elevationNoise = random.Next(-1, 3);
                cell.Elevation = Math.Max(0, elevationNoise);
            }
        }

        private static void GenerateTowns(HexGrid grid, int radius, Random random)
        {
            int townCount = Math.Min(8, radius + 5);
            var usedCoords = new HashSet<AxialCoord> { AxialCoord.Zero };

            grid.SetTerrain(AxialCoord.Zero, HexTerrain.PostOffice);
            grid.SetTownName(AxialCoord.Zero, "中央邮局");

            int townIndex = 0;
            int attempts = 0;
            int maxAttempts = townCount * 20;

            while (townIndex < townCount && attempts < maxAttempts)
            {
                attempts++;
                int q = random.Next(-radius, radius + 1);
                int r = random.Next(-radius, radius + 1);
                var coord = new AxialCoord(q, r);

                if (!grid.Contains(coord)) continue;
                if (usedCoords.Contains(coord)) continue;

                bool tooClose = false;
                foreach (var used in usedCoords)
                {
                    if (coord.DistanceTo(used) < 2)
                    {
                        tooClose = true;
                        break;
                    }
                }
                if (tooClose) continue;

                usedCoords.Add(coord);
                grid.SetTerrain(coord, HexTerrain.Town);
                grid.SetTownName(coord, TownNames[townIndex % TownNames.Length]);
                townIndex++;
            }
        }

        private static void GenerateMountains(HexGrid grid, Random random, int radius)
        {
            int mountainCount = radius * 2;
            for (int i = 0; i < mountainCount; i++)
            {
                int q = random.Next(-radius, radius + 1);
                int r = random.Next(-radius, radius + 1);
                var coord = new AxialCoord(q, r);

                if (!grid.Contains(coord)) continue;
                if (grid.TryGetCell(coord, out var cell) && cell.Terrain == HexTerrain.Plains)
                {
                    grid.SetTerrain(coord, HexTerrain.Mountain);
                    grid.SetElevation(coord, random.Next(3, 6));
                }
            }
        }

        private static void GenerateForests(HexGrid grid, Random random)
        {
            int forestCount = grid.Count / 8;
            foreach (var cell in new List<HexCell>(grid.Cells.Values))
            {
                if (cell.Terrain == HexTerrain.Plains && random.Next(0, 100) < 15)
                {
                    grid.SetTerrain(cell.Coord, HexTerrain.Forest);
                }
            }
        }

        private static void GenerateLakes(HexGrid grid, Random random)
        {
            int lakeSeed = random.Next(2, 5);
            for (int i = 0; i < lakeSeed; i++)
            {
                var keys = new List<AxialCoord>(grid.Cells.Keys);
                if (keys.Count == 0) break;
                var center = keys[random.Next(keys.Count)];
                if (!grid.TryGetCell(center, out var cell) || cell.Terrain != HexTerrain.Plains) continue;

                grid.SetTerrain(center, HexTerrain.Lake);
                int lakeSize = random.Next(1, 4);
                var currentLake = new List<AxialCoord> { center };

                for (int j = 0; j < lakeSize; j++)
                {
                    var neighbors = new List<AxialCoord>();
                    foreach (var c in currentLake)
                    {
                        neighbors.AddRange(grid.GetNeighborCoords(c));
                    }
                    foreach (var n in neighbors)
                    {
                        if (grid.TryGetCell(n, out var nc) && nc.Terrain == HexTerrain.Plains && random.Next(0, 3) == 0)
                        {
                            grid.SetTerrain(n, HexTerrain.Lake);
                            currentLake.Add(n);
                        }
                    }
                }
            }
        }

        private static void GenerateStorms(HexGrid grid, Random random)
        {
            int stormCount = random.Next(1, 3);
            for (int i = 0; i < stormCount; i++)
            {
                var keys = new List<AxialCoord>(grid.Cells.Keys);
                if (keys.Count == 0) break;
                var coord = keys[random.Next(keys.Count)];
                if (grid.TryGetCell(coord, out var cell) && cell.Terrain == HexTerrain.Plains)
                {
                    grid.SetTerrain(coord, HexTerrain.Storm);
                }
            }
        }

        private static void SetElevation(this HexGrid grid, AxialCoord coord, int elevation)
        {
            if (grid.TryGetCell(coord, out var cell))
            {
                cell.Elevation = elevation;
            }
        }

        private static void SetElevationRandom(this HexGrid grid, AxialCoord coord)
        {
            if (grid.TryGetCell(coord, out var cell))
            {
                cell.Elevation = new Random().Next(0, 3);
            }
        }
    }
}
