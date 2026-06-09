using UnityEngine;
using UnityEditor;
using DecorMatch3.Match3;
using DecorMatch3.Decoration;
using DecorMatch3.Progression;
using DecorMatch3.Data;
using System.IO;

namespace DecorMatch3.EditorTools
{
    public static class ScriptableObjectGenerator
    {
        private const string SO_DIR = "Assets/Resources/ScriptableObjects";

        [MenuItem("DecorMatch3/Generate All Data Assets")]
        public static void GenerateAllDataAssets()
        {
            EnsureDirectory(SO_DIR + "/Levels");
            EnsureDirectory(SO_DIR + "/Materials");
            EnsureDirectory(SO_DIR + "/Customers");
            EnsureDirectory(SO_DIR + "/Furniture");
            EnsureDirectory(SO_DIR + "/Palettes");
            EnsureDirectory(SO_DIR + "/Orders");
            EnsureDirectory(SO_DIR + "/Achievements");
            EnsureDirectory(SO_DIR + "/DailyChallenges");

            DataManager dataManager = DataManager.Instance;

            foreach (LevelData level in dataManager.Levels)
            {
                string path = $"{SO_DIR}/Levels/{level.name}.asset";
                if (!File.Exists(path))
                {
                    AssetDatabase.CreateAsset(level, path);
                    Debug.Log($"[Generator] Created Level: {level.name}");
                }
            }

            foreach (MaterialData mat in dataManager.Materials)
            {
                string path = $"{SO_DIR}/Materials/{mat.name}.asset";
                if (!File.Exists(path))
                {
                    AssetDatabase.CreateAsset(mat, path);
                    Debug.Log($"[Generator] Created Material: {mat.name}");
                }
            }

            foreach (CustomerProfile customer in dataManager.Customers)
            {
                string path = $"{SO_DIR}/Customers/{customer.name}.asset";
                if (!File.Exists(path))
                {
                    AssetDatabase.CreateAsset(customer, path);
                    Debug.Log($"[Generator] Created Customer: {customer.name}");
                }
            }

            foreach (FurnitureItem furniture in dataManager.Furniture)
            {
                string path = $"{SO_DIR}/Furniture/{furniture.name}.asset";
                if (!File.Exists(path))
                {
                    AssetDatabase.CreateAsset(furniture, path);
                    Debug.Log($"[Generator] Created Furniture: {furniture.name}");
                }
            }

            foreach (ColorPalette palette in dataManager.Palettes)
            {
                string path = $"{SO_DIR}/Palettes/{palette.name}.asset";
                if (!File.Exists(path))
                {
                    AssetDatabase.CreateAsset(palette, path);
                    Debug.Log($"[Generator] Created Palette: {palette.name}");
                }
            }

            foreach (DecorationOrder order in dataManager.Orders)
            {
                string path = $"{SO_DIR}/Orders/{order.name}.asset";
                if (!File.Exists(path))
                {
                    AssetDatabase.CreateAsset(order, path);
                    Debug.Log($"[Generator] Created Order: {order.name}");
                }
            }

            foreach (AchievementData ach in dataManager.Achievements)
            {
                string path = $"{SO_DIR}/Achievements/{ach.name}.asset";
                if (!File.Exists(path))
                {
                    AssetDatabase.CreateAsset(ach, path);
                    Debug.Log($"[Generator] Created Achievement: {ach.name}");
                }
            }

            foreach (DailyChallengeData dc in dataManager.DailyChallenges)
            {
                string path = $"{SO_DIR}/DailyChallenges/{dc.name}.asset";
                if (!File.Exists(path))
                {
                    AssetDatabase.CreateAsset(dc, path);
                    Debug.Log($"[Generator] Created DailyChallenge: {dc.name}");
                }
            }

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();

            Debug.Log("[Generator] All data assets generated successfully!");
        }

        [MenuItem("DecorMatch3/Clear All Generated Data")]
        public static void ClearAllData()
        {
            string[] dirs = Directory.GetDirectories(SO_DIR, "*", SearchOption.AllDirectories);
            foreach (string dir in dirs)
            {
                string[] files = Directory.GetFiles(dir, "*.asset");
                foreach (string file in files)
                {
                    File.Delete(file);
                    if (File.Exists(file + ".meta")) File.Delete(file + ".meta");
                    Debug.Log($"[Clear] Deleted: {Path.GetFileName(file)}");
                }
            }
            AssetDatabase.Refresh();
        }

        private static void EnsureDirectory(string path)
        {
            if (!Directory.Exists(path))
            {
                Directory.CreateDirectory(path);
            }
        }
    }
}
