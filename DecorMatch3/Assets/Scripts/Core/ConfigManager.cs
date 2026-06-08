using System.Linq;
using UnityEngine;

namespace DecorMatch3
{
    public class ConfigManager : MonoBehaviour
    {
        public static ConfigManager Instance { get; private set; }

        public LevelConfigData[] Levels { get; private set; }
        public FurnitureData[] FurnitureCatalog { get; private set; }
        public CustomerData[] Customers { get; private set; }
        public ColorPaletteData[] ColorPalettes { get; private set; }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        public void Init()
        {
            LoadConfig<LevelConfigData>("Configs/levels", data => Levels = data);
            LoadConfig<FurnitureData>("Configs/furniture_catalog", data => FurnitureCatalog = data);
            LoadConfig<CustomerData>("Configs/customers", data => Customers = data);
            LoadConfig<ColorPaletteData>("Configs/color_palettes", data => ColorPalettes = data);
        }

        private void LoadConfig<T>(string path, System.Action<T[]> onLoaded)
        {
            var asset = Resources.Load<TextAsset>(path);
            if (asset != null)
            {
                if (JsonHelper.TryDeserializeArray<T>(asset.text, out T[] data))
                {
                    onLoaded(data);
                }
                else
                {
                    Debug.LogWarning($"Failed to parse config: {path}");
                    onLoaded(new T[0]);
                }
            }
            else
            {
                Debug.LogWarning($"Config not found: {path}");
                onLoaded(new T[0]);
            }
        }

        public LevelConfigData GetLevel(int id)
        {
            if (Levels == null) return null;
            return Levels.FirstOrDefault(l => l.levelId == id);
        }

        public FurnitureData GetFurniture(string id)
        {
            if (FurnitureCatalog == null) return null;
            return FurnitureCatalog.FirstOrDefault(f => f.furnitureId == id);
        }

        public CustomerData GetCustomer(string id)
        {
            if (Customers == null) return null;
            return Customers.FirstOrDefault(c => c.customerId == id);
        }

        public ColorPaletteData GetColorPalette(string id)
        {
            if (ColorPalettes == null) return null;
            return ColorPalettes.FirstOrDefault(p => p.paletteId == id);
        }

        public FurnitureData[] GetFurnitureByCategory(string category)
        {
            if (FurnitureCatalog == null) return new FurnitureData[0];
            return FurnitureCatalog.Where(f => f.category == category).ToArray();
        }

        public FurnitureData[] GetFurnitureByStyle(string style)
        {
            if (FurnitureCatalog == null) return new FurnitureData[0];
            return FurnitureCatalog.Where(f => f.style == style).ToArray();
        }
    }
}
