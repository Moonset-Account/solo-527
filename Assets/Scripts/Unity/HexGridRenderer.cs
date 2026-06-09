using System;
using System.Collections.Generic;
using UnityEngine;

namespace BalloonPost.Unity
{
    using BalloonPost.Core;

    public class HexGridRenderer : MonoBehaviour
    {
        public float HexSize = 1.0f;
        public Vector3 OriginOffset = Vector3.zero;
        public GameObject HexPrefab;
        public Transform GridParent;
        public GameManager Game;

        public Dictionary<AxialCoord, GameObject> RenderedCells;
        public Dictionary<AxialCoord, HexCellView> CellViews;

        public event Action<AxialCoord> OnCellClicked;

        public void Initialize(GameManager game)
        {
            Game = game;
            RenderedCells = new Dictionary<AxialCoord, GameObject>();
            CellViews = new Dictionary<AxialCoord, HexCellView>();
            if (GridParent == null) GridParent = transform;

            RenderGrid();
        }

        public void RenderGrid()
        {
            ClearGrid();

            foreach (var cell in Game.Grid.Cells.Values)
            {
                CreateCellView(cell);
            }
        }

        public void ClearGrid()
        {
            if (RenderedCells == null) return;
            foreach (var go in RenderedCells.Values)
            {
                if (go != null) Destroy(go);
            }
            RenderedCells.Clear();
            CellViews.Clear();
        }

        private void CreateCellView(HexCell cell)
        {
            GameObject go = null;
            if (HexPrefab != null)
            {
                go = Instantiate(HexPrefab, GridParent);
            }
            else
            {
                go = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                go.transform.SetParent(GridParent);
                go.name = $"Hex_{cell.Coord.Q}_{cell.Coord.R}";
            }

            Vector3 worldPos = AxialToWorld(cell.Coord);
            go.transform.position = worldPos + OriginOffset;
            go.transform.localScale = Vector3.one * HexSize * 0.9f;

            var view = go.GetComponent<HexCellView>();
            if (view == null) view = go.AddComponent<HexCellView>();
            view.Initialize(cell, worldPos, this);

            RenderedCells[cell.Coord] = go;
            CellViews[cell.Coord] = view;

            ApplyTerrainAppearance(view, cell);
        }

        public Vector3 AxialToWorld(AxialCoord coord)
        {
            float x = HexSize * (3.0f / 2.0f * coord.Q);
            float z = HexSize * (Mathf.Sqrt(3) / 2.0f * coord.Q + Mathf.Sqrt(3) * coord.R);
            return new Vector3(x, 0, z);
        }

        public AxialCoord WorldToAxial(Vector3 worldPos)
        {
            Vector3 p = worldPos - OriginOffset;
            float q = (2.0f / 3.0f * p.x) / HexSize;
            float r = (-1.0f / 3.0f * p.x + Mathf.Sqrt(3) / 3.0f * p.z) / HexSize;
            return AxialRound(q, r);
        }

        public static AxialCoord AxialRound(float q, float r)
        {
            float s = -q - r;
            int rq = Mathf.RoundToInt(q);
            int rr = Mathf.RoundToInt(r);
            int rs = Mathf.RoundToInt(s);

            float qDiff = Mathf.Abs(rq - q);
            float rDiff = Mathf.Abs(rr - r);
            float sDiff = Mathf.Abs(rs - s);

            if (qDiff > rDiff && qDiff > sDiff)
                rq = -rr - rs;
            else if (rDiff > sDiff)
                rr = -rq - rs;

            return new AxialCoord(rq, rr);
        }

        private void ApplyTerrainAppearance(HexCellView view, HexCell cell)
        {
            Color baseColor;
            switch (cell.Terrain)
            {
                case HexTerrain.Plains: baseColor = new Color(0.75f, 0.9f, 0.65f); break;
                case HexTerrain.Forest: baseColor = new Color(0.3f, 0.65f, 0.35f); break;
                case HexTerrain.Mountain: baseColor = new Color(0.55f, 0.5f, 0.45f); break;
                case HexTerrain.Lake: baseColor = new Color(0.3f, 0.55f, 0.85f); break;
                case HexTerrain.Town: baseColor = new Color(0.95f, 0.85f, 0.55f); break;
                case HexTerrain.PostOffice: baseColor = new Color(1.0f, 0.7f, 0.3f); break;
                case HexTerrain.Storm: baseColor = new Color(0.35f, 0.3f, 0.45f); break;
                default: baseColor = Color.gray; break;
            }

            float elevationBoost = cell.Elevation * 0.05f;
            view.SetColor(baseColor);
            view.SetHeight(elevationBoost);
            view.SetLabel(cell);
        }

        public void HighlightCells(IEnumerable<AxialCoord> coords, Color color)
        {
            foreach (var coord in coords)
            {
                if (CellViews.TryGetValue(coord, out var view))
                {
                    view.Highlight(color);
                }
            }
        }

        public void ClearHighlights()
        {
            foreach (var view in CellViews.Values)
            {
                view.ClearHighlight();
            }
        }

        public void NotifyCellClicked(AxialCoord coord)
        {
            OnCellClicked?.Invoke(coord);
        }

        public void UpdateRouteVisual(RoutePlan plan)
        {
            ClearRouteVisual();
            if (plan == null) return;

            for (int i = 0; i < plan.Steps.Count; i++)
            {
                var step = plan.Steps[i];
                if (CellViews.TryGetValue(step.To, out var view))
                {
                    Color c = step.IsLocked ? new Color(1, 0.5f, 0.2f) : new Color(1, 0.8f, 0.2f);
                    view.ShowRouteMarker(i + 1, c);
                }
            }

            if (CellViews.TryGetValue(plan.StartPosition, out var startView))
            {
                startView.ShowStartMarker();
            }
        }

        public void ClearRouteVisual()
        {
            foreach (var view in CellViews.Values)
            {
                view.ClearMarkers();
            }
        }

        public void UpdatePlayerPosition(AxialCoord position)
        {
            foreach (var kv in CellViews)
            {
                kv.Value.ShowPlayer(kv.Key == position);
            }
        }
    }
}
