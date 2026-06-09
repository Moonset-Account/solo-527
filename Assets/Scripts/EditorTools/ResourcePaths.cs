using UnityEngine;

namespace BeatRunner.EditorTools
{
    public static class ResourcePaths
    {
        public const string DataFolder = "Assets/Resources/Data/";
        public const string TrackLibraryPath = DataFolder + "DefaultTrackLibrary.asset";
        public const string SettingsFolder = "Assets/Resources/Settings/";
        public const string GameSettingsPath = SettingsFolder + "GameSettings.asset";
        public const string RuntimeDataPath = SettingsFolder + "RuntimeGameData.asset";
        public const string PrefabFolder = "Assets/Prefabs/";
        public const string UIPrefabFolder = PrefabFolder + "UI/";
        public const string GameplayPrefabFolder = PrefabFolder + "Gameplay/";

#if UNITY_EDITOR
        [UnityEditor.MenuItem("BeatRunner/Open Data Folder")]
        public static void OpenDataFolder()
        {
            System.IO.Directory.CreateDirectory(DataFolder.Replace("Assets/Resources/Data/", "Assets/Resources"));
            System.IO.Directory.CreateDirectory(DataFolder);
            UnityEditor.EditorUtility.RevealInFinder(DataFolder);
        }

        [UnityEditor.MenuItem("BeatRunner/Generate Project Folders")]
        public static void GenerateProjectFolders()
        {
            string[] folders =
            {
                "Assets/Resources",
                "Assets/Resources/Data",
                "Assets/Resources/Settings",
                "Assets/Prefabs",
                "Assets/Prefabs/UI",
                "Assets/Prefabs/Gameplay",
                "Assets/Scenes",
                "Assets/Scripts",
                "Assets/Art",
                "Assets/Art/Sprites",
                "Assets/Art/Materials",
                "Assets/Art/Models",
                "Assets/Audio",
                "Assets/Audio/Music",
                "Assets/Audio/SFX",
                "Assets/Editor"
            };

            foreach (var folder in folders)
            {
                if (!System.IO.Directory.Exists(folder))
                {
                    System.IO.Directory.CreateDirectory(folder);
                    Debug.Log($"Created folder: {folder}");
                }
            }

            UnityEditor.AssetDatabase.Refresh();
        }
#endif
    }
}
