using System;

namespace BalloonPost.Core
{
    public enum HexTerrain
    {
        Plains,
        Forest,
        Mountain,
        Lake,
        Town,
        PostOffice,
        Storm
    }

    [Serializable]
    public class HexCell
    {
        public AxialCoord Coord;
        public HexTerrain Terrain;
        public int Elevation;
        public string TownName;
        public bool HasPostOffice;

        public HexCell() { }

        public HexCell(AxialCoord coord, HexTerrain terrain = HexTerrain.Plains, int elevation = 0)
        {
            Coord = coord;
            Terrain = terrain;
            Elevation = elevation;
            HasPostOffice = terrain == HexTerrain.PostOffice;
        }

        public int MoveCost
        {
            get
            {
                switch (Terrain)
                {
                    case HexTerrain.Plains: return 1;
                    case HexTerrain.Forest: return 2;
                    case HexTerrain.Mountain: return 3;
                    case HexTerrain.Lake: return 2;
                    case HexTerrain.Town: return 1;
                    case HexTerrain.PostOffice: return 1;
                    case HexTerrain.Storm: return 4;
                    default: return 1;
                }
            }
        }

        public int FuelCost
        {
            get
            {
                int baseCost = MoveCost;
                if (Elevation > 0) baseCost += Elevation / 2;
                return baseCost;
            }
        }

        public bool IsPassable => Terrain != HexTerrain.Storm || Elevation < 5;

        public bool IsDeliveryPoint => Terrain == HexTerrain.Town || Terrain == HexTerrain.PostOffice;
    }
}
