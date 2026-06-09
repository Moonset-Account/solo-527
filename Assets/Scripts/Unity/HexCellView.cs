using UnityEngine;

namespace BalloonPost.Unity
{
    using BalloonPost.Core;

    public class HexCellView : MonoBehaviour
    {
        public HexCell Cell;
        public AxialCoord Coord;
        public Vector3 WorldPos;
        public HexGridRenderer Grid;

        public Renderer CellRenderer;
        public TextMesh LabelMesh;
        public GameObject RouteMarker;
        public GameObject PlayerMarker;
        public GameObject HighlightObj;

        private Color _originalColor;
        private Color _currentColor;
        private bool _isHighlighted;

        public void Initialize(HexCell cell, Vector3 worldPos, HexGridRenderer grid)
        {
            Cell = cell;
            Coord = cell.Coord;
            WorldPos = worldPos;
            Grid = grid;

            CellRenderer = GetComponent<Renderer>();
            if (CellRenderer == null)
            {
                var mr = GetComponentInChildren<MeshRenderer>();
                CellRenderer = mr;
            }
            if (CellRenderer != null)
            {
                _originalColor = CellRenderer.material.color;
            }

            CreateLabelIfNeeded();
        }

        private void CreateLabelIfNeeded()
        {
            var labelGO = new GameObject("Label");
            labelGO.transform.SetParent(transform);
            labelGO.transform.localPosition = new Vector3(0, 1.2f, 0);
            labelGO.transform.localScale = Vector3.one * 0.05f;
            labelGO.transform.rotation = Quaternion.Euler(90, 0, 0);
            LabelMesh = labelGO.AddComponent<TextMesh>();
            LabelMesh.anchor = TextAnchor.MiddleCenter;
            LabelMesh.fontSize = 16;
            LabelMesh.characterSize = 1f;
            LabelMesh.color = Color.black;
        }

        public void SetColor(Color color)
        {
            _currentColor = color;
            if (CellRenderer != null)
            {
                var mat = new Material(CellRenderer.material);
                mat.color = color;
                CellRenderer.material = mat;
                _originalColor = color;
            }
        }

        public void SetHeight(float height)
        {
            var pos = transform.localPosition;
            pos.y = height;
            transform.localPosition = pos;
        }

        public void SetLabel(HexCell cell)
        {
            if (LabelMesh == null) return;
            string label = "";
            switch (cell.Terrain)
            {
                case HexTerrain.PostOffice: label = "✉"; break;
                case HexTerrain.Town: label = "🏘"; break;
                case HexTerrain.Mountain: label = "⛰"; break;
                case HexTerrain.Forest: label = "🌲"; break;
                case HexTerrain.Lake: label = "💧"; break;
                case HexTerrain.Storm: label = "🌪"; break;
                default: label = ""; break;
            }
            if (!string.IsNullOrEmpty(cell.TownName))
            {
                label += "\n" + cell.TownName;
            }
            LabelMesh.text = label;
        }

        public void Highlight(Color color)
        {
            _isHighlighted = true;
            if (HighlightObj == null)
            {
                HighlightObj = GameObject.CreatePrimitive(PrimitiveType.Quad);
                HighlightObj.transform.SetParent(transform);
                HighlightObj.transform.localPosition = new Vector3(0, 0.1f, 0);
                HighlightObj.transform.localRotation = Quaternion.Euler(90, 0, 0);
                HighlightObj.transform.localScale = Vector3.one * 1.8f;
                Destroy(HighlightObj.GetComponent<Collider>());
                var hr = HighlightObj.GetComponent<Renderer>();
                var hm = new Material(Shader.Find("Unlit/Transparent"));
                hm.color = new Color(color.r, color.g, color.b, 0.35f);
                hr.material = hm;
            }
        }

        public void ClearHighlight()
        {
            _isHighlighted = false;
            if (HighlightObj != null)
            {
                Destroy(HighlightObj);
                HighlightObj = null;
            }
        }

        public void ShowRouteMarker(int stepNumber, Color color)
        {
            if (RouteMarker == null)
            {
                RouteMarker = new GameObject("RouteMarker");
                RouteMarker.transform.SetParent(transform);
                RouteMarker.transform.localPosition = new Vector3(0, 0.3f, 0);
                var mr = RouteMarker.AddComponent<TextMesh>();
                mr.anchor = TextAnchor.MiddleCenter;
                mr.characterSize = 0.15f;
                mr.fontSize = 32;
                mr.color = color;
                RouteMarker.transform.localScale = Vector3.one * 0.5f;
                RouteMarker.transform.rotation = Quaternion.Euler(90, 0, 0);
            }
            var tm = RouteMarker.GetComponent<TextMesh>();
            if (tm != null) tm.text = stepNumber.ToString();
        }

        public void ShowStartMarker()
        {
            if (RouteMarker == null)
            {
                RouteMarker = new GameObject("StartMarker");
                RouteMarker.transform.SetParent(transform);
                RouteMarker.transform.localPosition = new Vector3(0, 0.3f, 0);
                var tm = RouteMarker.AddComponent<TextMesh>();
                tm.anchor = TextAnchor.MiddleCenter;
                tm.characterSize = 0.2f;
                tm.fontSize = 36;
                tm.color = Color.green;
                tm.text = "START";
                RouteMarker.transform.localScale = Vector3.one * 0.5f;
                RouteMarker.transform.rotation = Quaternion.Euler(90, 0, 0);
            }
        }

        public void ShowPlayer(bool show)
        {
            if (show)
            {
                if (PlayerMarker == null)
                {
                    PlayerMarker = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                    PlayerMarker.name = "Player";
                    PlayerMarker.transform.SetParent(transform);
                    PlayerMarker.transform.localPosition = new Vector3(0, 0.6f, 0);
                    PlayerMarker.transform.localScale = Vector3.one * 0.4f;
                    Destroy(PlayerMarker.GetComponent<Collider>());
                    var pr = PlayerMarker.GetComponent<Renderer>();
                    var pm = new Material(pr.material);
                    pm.color = new Color(1, 0.3f, 0.3f);
                    pr.material = pm;
                }
                PlayerMarker.SetActive(true);
            }
            else if (PlayerMarker != null)
            {
                PlayerMarker.SetActive(false);
            }
        }

        public void ClearMarkers()
        {
            if (RouteMarker != null) Destroy(RouteMarker);
            if (PlayerMarker != null) Destroy(PlayerMarker);
            RouteMarker = null;
            PlayerMarker = null;
        }

        private void OnMouseDown()
        {
            Grid?.NotifyCellClicked(Coord);
        }
    }
}
