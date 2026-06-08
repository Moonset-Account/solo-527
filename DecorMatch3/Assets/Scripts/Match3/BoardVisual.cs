using UnityEngine;
using System.Collections;
using System.Collections.Generic;

namespace DecorMatch3
{
    public class BoardVisual : MonoBehaviour
    {
        private Board _board;
        private ObjectPool<Tile> _tilePool;
        private float _cellSize = 0.9f;
        private List<GameObject> _activeEffects = new List<GameObject>();

        public void Initialize(Board board)
        {
            _board = board;
            _tilePool = new ObjectPool<Tile>(() =>
            {
                GameObject obj = new GameObject("Tile");
                obj.transform.SetParent(transform);
                SpriteRenderer sr = obj.AddComponent<SpriteRenderer>();
                sr.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f), 4f);
                obj.AddComponent<BoxCollider2D>();
                Tile tile = obj.AddComponent<Tile>();
                return tile;
            });

            CreateBoardVisuals();
        }

        private void CreateBoardVisuals()
        {
            for (int row = 0; row < _board.Height; row++)
            {
                for (int col = 0; col < _board.Width; col++)
                {
                    TileType type = _board.GetTileTypeAt(row, col);
                    if (type != TileType.None)
                    {
                        CreateTileVisual(type, row, col);
                    }
                }
            }
        }

        public void CreateTileVisual(TileType type, int row, int col)
        {
            Tile tile = _tilePool.Get();
            tile.gameObject.SetActive(true);
            tile.Initialize(type, row, col);
            tile.SetPosition(GridToWorldPosition(row, col));
            if (row >= 0 && row < _board.Height && col >= 0 && col < _board.Width)
            {
                _board.Tiles[row, col] = tile;
            }
        }

        public void UpdateBoardVisual()
        {
            for (int row = 0; row < _board.Height; row++)
            {
                for (int col = 0; col < _board.Width; col++)
                {
                    Tile tile = _board.Tiles[row, col];
                    TileType type = _board.GetTileTypeAt(row, col);

                    if (tile != null && tile.IsMatched)
                    {
                        tile.PlayMatchAnimation();
                        _board.Tiles[row, col] = null;
                        StartCoroutine(ReturnTileToPool(tile, 0.3f));
                        continue;
                    }

                    if (tile != null && tile.IsFalling)
                    {
                        tile.PlayFallAnimation(GridToWorldPosition(tile.Row, tile.Col));
                        tile.IsFalling = false;
                        continue;
                    }

                    if (tile == null && type != TileType.None)
                    {
                        CreateTileVisual(type, row, col);
                        Tile newTile = _board.Tiles[row, col];
                        if (newTile != null)
                        {
                            Vector3 targetPos = GridToWorldPosition(row, col);
                            newTile.SetPosition(targetPos + Vector3.up * 2f);
                            newTile.PlayFallAnimation(targetPos);
                        }
                    }
                    else if (tile != null)
                    {
                        tile.UpdateVisual();
                    }
                }
            }
        }

        public void OnTileMatched(int count, TileType type)
        {
            SpawnMatchEffect(type);
        }

        public void OnBoardReset()
        {
            for (int row = 0; row < _board.Height; row++)
            {
                for (int col = 0; col < _board.Width; col++)
                {
                    Tile tile = _board.Tiles[row, col];
                    if (tile != null)
                    {
                        tile.Reset();
                        _tilePool.Return(tile);
                    }
                    _board.Tiles[row, col] = null;
                }
            }

            CreateBoardVisuals();
        }

        public Vector3 GridToWorldPosition(int row, int col)
        {
            float offsetX = -(_board.Width - 1) * _cellSize * 0.5f;
            float offsetY = (_board.Height - 1) * _cellSize * 0.5f;
            return new Vector3(col * _cellSize + offsetX, -row * _cellSize + offsetY, 0f);
        }

        private void SpawnMatchEffect(TileType type)
        {
            if (type == TileType.None) return;
            GameObject effect = new GameObject("MatchEffect");
            effect.transform.SetParent(transform);
            effect.transform.position = Vector3.zero;

            SpriteRenderer sr = effect.AddComponent<SpriteRenderer>();
            sr.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f), 4f);

            Color effectColor = Color.white;
            switch (type)
            {
                case TileType.Paint: effectColor = Color.red; break;
                case TileType.Wallpaper: effectColor = Color.green; break;
                case TileType.Fabric: effectColor = Color.blue; break;
                case TileType.Wood: effectColor = new Color(0.6f, 0.3f, 0.1f); break;
                case TileType.Metal: effectColor = new Color(0.75f, 0.75f, 0.75f); break;
                case TileType.Ceramic: effectColor = Color.white; break;
            }
            sr.color = effectColor;

            StartCoroutine(PlayParticleEffect(effect));
        }

        private IEnumerator PlayParticleEffect(GameObject effect)
        {
            _activeEffects.Add(effect);
            float duration = 0.5f;
            float elapsed = 0f;
            Vector3 startScale = Vector3.one;
            Vector3 endScale = Vector3.one * 2f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / duration;
                effect.transform.localScale = Vector3.Lerp(startScale, endScale, t);

                SpriteRenderer sr = effect.GetComponent<SpriteRenderer>();
                if (sr != null)
                {
                    Color c = sr.color;
                    c.a = 1f - t;
                    sr.color = c;
                }

                yield return null;
            }

            _activeEffects.Remove(effect);
            Destroy(effect);
        }

        private IEnumerator ReturnTileToPool(Tile tile, float delay)
        {
            yield return new WaitForSeconds(delay);
            tile.Reset();
            _tilePool.Return(tile);
        }
    }
}
