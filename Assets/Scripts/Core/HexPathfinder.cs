using System;
using System.Collections.Generic;

namespace BalloonPost.Core
{
    public static class HexPathfinder
    {
        public class PathResult
        {
            public bool Success;
            public List<AxialCoord> Path;
            public int TotalCost;
            public int Steps;

            public PathResult()
            {
                Path = new List<AxialCoord>();
            }
        }

        public class PathNode : IComparable<PathNode>
        {
            public AxialCoord Coord;
            public PathNode Parent;
            public int G;
            public int H;
            public int F;

            public PathNode(AxialCoord coord, PathNode parent = null)
            {
                Coord = coord;
                Parent = parent;
                G = 0;
                H = 0;
                F = 0;
            }

            public int CompareTo(PathNode other)
            {
                return F.CompareTo(other.F);
            }
        }

        public static PathResult FindPath(
            HexGrid grid,
            AxialCoord start,
            AxialCoord goal,
            WindInfo windInfo = null,
            bool considerTerrain = true,
            HashSet<AxialCoord> blocked = null)
        {
            var result = new PathResult();

            if (!grid.Contains(start) || !grid.Contains(goal))
            {
                result.Success = false;
                return result;
            }

            if (start == goal)
            {
                result.Success = true;
                result.Path.Add(start);
                result.TotalCost = 0;
                result.Steps = 0;
                return result;
            }

            var openSet = new SortedSet<PathNode>(Comparer<PathNode>.Create((a, b) =>
            {
                int f = a.F.CompareTo(b.F);
                if (f != 0) return f;
                int h = a.H.CompareTo(b.H);
                if (h != 0) return h;
                return a.Coord.GetHashCode().CompareTo(b.Coord.GetHashCode());
            }));

            var openDict = new Dictionary<AxialCoord, PathNode>();
            var closedSet = new HashSet<AxialCoord>();

            var startNode = new PathNode(start);
            startNode.H = start.DistanceTo(goal);
            startNode.F = startNode.H;
            openSet.Add(startNode);
            openDict[start] = startNode;

            int maxIterations = grid.Count * 10;
            int iterations = 0;

            while (openSet.Count > 0 && iterations < maxIterations)
            {
                iterations++;
                var current = openSet.Min;
                openSet.Remove(current);
                openDict.Remove(current.Coord);
                closedSet.Add(current.Coord);

                if (current.Coord == goal)
                {
                    result.Success = true;
                    ReconstructPath(current, result);
                    return result;
                }

                var neighbors = grid.GetNeighborCoords(current.Coord);
                int stepNumber = closedSet.Count;

                foreach (var neighborCoord in neighbors)
                {
                    if (closedSet.Contains(neighborCoord)) continue;
                    if (blocked != null && blocked.Contains(neighborCoord)) continue;
                    if (!grid.TryGetCell(neighborCoord, out var neighborCell)) continue;
                    if (!neighborCell.IsPassable) continue;

                    int moveDir = AxialCoord.DirectionIndex(current.Coord, neighborCoord);
                    int moveCost = considerTerrain ? neighborCell.MoveCost : 1;
                    int fuelCost = considerTerrain ? neighborCell.FuelCost : 1;

                    if (windInfo != null)
                    {
                        int windMod = windInfo.GetModifier(moveDir);
                        moveCost = Math.Max(1, moveCost - windMod);
                        if (windMod < 0)
                        {
                            moveCost += Math.Abs(windMod);
                        }
                    }

                    int tentativeG = current.G + moveCost;

                    if (openDict.TryGetValue(neighborCoord, out var existingNode))
                    {
                        if (tentativeG < existingNode.G)
                        {
                            openSet.Remove(existingNode);
                            existingNode.Parent = current;
                            existingNode.G = tentativeG;
                            existingNode.H = neighborCoord.DistanceTo(goal);
                            existingNode.F = tentativeG + existingNode.H;
                            openSet.Add(existingNode);
                        }
                    }
                    else
                    {
                        var neighborNode = new PathNode(neighborCoord, current);
                        neighborNode.G = tentativeG;
                        neighborNode.H = neighborCoord.DistanceTo(goal);
                        neighborNode.F = tentativeG + neighborNode.H;
                        openSet.Add(neighborNode);
                        openDict[neighborCoord] = neighborNode;
                    }
                }
            }

            result.Success = false;
            return result;
        }

        private static void ReconstructPath(PathNode endNode, PathResult result)
        {
            var path = new List<AxialCoord>();
            var current = endNode;
            int cost = 0;

            while (current != null)
            {
                path.Add(current.Coord);
                cost = current.G;
                current = current.Parent;
            }

            path.Reverse();
            result.Path = path;
            result.TotalCost = cost;
            result.Steps = path.Count - 1;
        }

        public static List<AxialCoord> GetReachableArea(
            HexGrid grid,
            AxialCoord start,
            int maxFuel,
            WindForecast forecast = null,
            int startTurn = 0)
        {
            var reachable = new List<AxialCoord>();
            var visited = new Dictionary<AxialCoord, int>();
            var queue = new Queue<(AxialCoord coord, int fuelUsed, int turn)>();

            queue.Enqueue((start, 0, startTurn));
            visited[start] = 0;
            reachable.Add(start);

            while (queue.Count > 0)
            {
                var (current, fuelUsed, turn) = queue.Dequeue();
                var neighbors = grid.GetNeighborCoords(current);

                for (int i = 0; i < neighbors.Count; i++)
                {
                    var neighbor = neighbors[i];
                    if (!grid.TryGetCell(neighbor, out var cell)) continue;
                    if (!cell.IsPassable) continue;

                    int moveDir = i;
                    int fuelCost = cell.FuelCost;

                    if (forecast != null)
                    {
                        var wind = forecast.GetWindForTurn(startTurn, turn);
                        if (wind != null)
                        {
                            int mod = wind.GetModifier(moveDir);
                            fuelCost = Math.Max(1, fuelCost - mod);
                        }
                    }

                    int newFuel = fuelUsed + fuelCost;
                    if (newFuel > maxFuel) continue;

                    if (!visited.TryGetValue(neighbor, out var prevFuel) || newFuel < prevFuel)
                    {
                        visited[neighbor] = newFuel;
                        reachable.Add(neighbor);
                        queue.Enqueue((neighbor, newFuel, turn + 1));
                    }
                }
            }

            return reachable;
        }

        public static int CalculateStepFuelCost(
            HexGrid grid,
            AxialCoord from,
            AxialCoord to,
            WindInfo windInfo = null)
        {
            if (!grid.TryGetCell(to, out var cell)) return 999;
            int fuelCost = cell.FuelCost;

            if (windInfo != null)
            {
                int moveDir = AxialCoord.DirectionIndex(from, to);
                if (moveDir >= 0)
                {
                    int mod = windInfo.GetModifier(moveDir);
                    fuelCost = Math.Max(1, fuelCost - mod);
                }
            }
            return fuelCost;
        }

        public static int CalculateStepDamage(
            HexGrid grid,
            AxialCoord from,
            AxialCoord to,
            WindInfo windInfo = null,
            List<Contract> fragileContracts = null)
        {
            if (fragileContracts == null || fragileContracts.Count == 0) return 0;

            int damage = 0;
            int moveDir = AxialCoord.DirectionIndex(from, to);

            if (windInfo != null && moveDir >= 0)
            {
                if (windInfo.IsHeadwind(moveDir) && windInfo.Strength >= WindStrength.Strong)
                {
                    damage += (int)windInfo.Strength - 1;
                }
            }

            if (grid.TryGetCell(to, out var cell))
            {
                if (cell.Terrain == HexTerrain.Mountain) damage += 1;
                if (cell.Terrain == HexTerrain.Storm) damage += 2;
            }

            if (grid.TryGetCell(from, out var fromCell))
            {
                if (fromCell.Elevation > 2) damage += 1;
            }

            return damage;
        }
    }
}
