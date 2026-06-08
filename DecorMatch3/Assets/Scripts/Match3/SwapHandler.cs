using UnityEngine;
using System.Collections;
using System.Collections.Generic;

namespace DecorMatch3
{
    public class SwapHandler : MonoBehaviour
    {
        private Board _board;
        private Tile _selectedTile;
        private bool _isProcessing;

        private Vector2 _touchStartPos;
        private bool _isDragging;
        private float _dragThreshold = 30f;

        public void Initialize(Board board)
        {
            _board = board;
            _selectedTile = null;
            _isProcessing = false;
        }

        private void Update()
        {
            if (_board == null || _board.IsAnimating || _isProcessing)
            {
                return;
            }

            if (Input.GetMouseButtonDown(0))
            {
                _touchStartPos = Input.mousePosition;
                _isDragging = false;

                Tile clickedTile = RaycastToTile(Input.mousePosition);
                if (clickedTile != null)
                {
                    HandleTileClick(clickedTile);
                }
            }

            if (Input.GetMouseButton(0) && _selectedTile != null)
            {
                Vector2 delta = (Vector2)Input.mousePosition - _touchStartPos;
                if (delta.magnitude > _dragThreshold)
                {
                    _isDragging = true;
                    Vector2 direction = delta.normalized;
                    int targetRow = _selectedTile.Row;
                    int targetCol = _selectedTile.Col;

                    if (Mathf.Abs(direction.x) > Mathf.Abs(direction.y))
                    {
                        targetCol += direction.x > 0 ? 1 : -1;
                    }
                    else
                    {
                        targetRow += direction.y > 0 ? 1 : -1;
                    }

                    if (IsValidPosition(targetRow, targetCol))
                    {
                        Tile targetTile = _board.Tiles[targetRow, targetCol];
                        if (targetTile != null)
                        {
                            ProcessSwap(_selectedTile, targetTile);
                        }
                    }

                    ResetSelection();
                }
            }

            if (Input.GetMouseButtonUp(0))
            {
                _isDragging = false;
            }
        }

        public void HandleTileClick(Tile clickedTile)
        {
            if (_isProcessing || _board.IsAnimating) return;

            if (_selectedTile == null)
            {
                _selectedTile = clickedTile;
            }
            else if (_selectedTile == clickedTile)
            {
                ResetSelection();
            }
            else if (IsAdjacent(_selectedTile, clickedTile))
            {
                ProcessSwap(_selectedTile, clickedTile);
                ResetSelection();
            }
            else
            {
                _selectedTile = clickedTile;
            }
        }

        public bool IsAdjacent(Tile a, Tile b)
        {
            int manhattanDist = Mathf.Abs(a.Row - b.Row) + Mathf.Abs(a.Col - b.Col);
            return manhattanDist == 1;
        }

        public void ProcessSwap(Tile a, Tile b)
        {
            if (!_board.TrySwap(a.Row, a.Col, b.Row, b.Col))
            {
                return;
            }

            _isProcessing = true;

            if (a != null)
            {
                a.PlaySwapAnimation(GridToWorldPosition(a.Row, a.Col));
            }
            if (b != null)
            {
                b.PlaySwapAnimation(GridToWorldPosition(b.Row, b.Col));
            }

            StartCoroutine(ProcessAfterSwap());
        }

        private IEnumerator ProcessAfterSwap()
        {
            yield return new WaitForSeconds(0.15f);
            StartCoroutine(_board.ProcessBoardCoroutine());
            _isProcessing = false;
        }

        public void ResetSelection()
        {
            _selectedTile = null;
        }

        private Tile RaycastToTile(Vector2 screenPos)
        {
            Vector2 worldPos = Camera.main.ScreenToWorldPoint(screenPos);
            RaycastHit2D hit = Physics2D.Raycast(worldPos, Vector2.zero);
            if (hit.collider != null)
            {
                return hit.collider.GetComponent<Tile>();
            }
            return null;
        }

        private bool IsValidPosition(int row, int col)
        {
            return row >= 0 && row < _board.Height && col >= 0 && col < _board.Width;
        }

        private Vector3 GridToWorldPosition(int row, int col)
        {
            float cellSize = 1f;
            return new Vector3(col * cellSize, -row * cellSize, 0f);
        }
    }
}
