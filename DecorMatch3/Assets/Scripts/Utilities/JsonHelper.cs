using System;
using System.Collections.Generic;
using UnityEngine;

namespace DecorMatch3
{
    [Serializable]
    public class JsonArrayWrapper<T>
    {
        public T[] items;
    }

    public static class JsonHelper
    {
        public static string ToJson<T>(T obj, bool prettyPrint = false)
        {
            return JsonUtility.ToJson(obj, prettyPrint);
        }

        public static string ToJson<T>(List<T> list, bool prettyPrint = false)
        {
            var wrapper = new JsonArrayWrapper<T> { items = list.ToArray() };
            return JsonUtility.ToJson(wrapper, prettyPrint);
        }

        public static string ToJson<T>(T[] array, bool prettyPrint = false)
        {
            var wrapper = new JsonArrayWrapper<T> { items = array };
            return JsonUtility.ToJson(wrapper, prettyPrint);
        }

        public static bool TryDeserialize<T>(string json, out T result)
        {
            try
            {
                result = JsonUtility.FromJson<T>(json);
                return result != null;
            }
            catch
            {
                result = default;
                return false;
            }
        }

        public static bool TryDeserializeArray<T>(string json, out T[] result)
        {
            try
            {
                var wrapper = JsonUtility.FromJson<JsonArrayWrapper<T>>(json);
                result = wrapper?.items;
                return result != null;
            }
            catch
            {
                result = null;
                return false;
            }
        }

        public static void ToFile<T>(T obj, string filePath, bool prettyPrint = false)
        {
            string json = ToJson(obj, prettyPrint);
            System.IO.File.WriteAllText(filePath, json);
        }

        public static void ToFile<T>(List<T> list, string filePath, bool prettyPrint = false)
        {
            string json = ToJson(list, prettyPrint);
            System.IO.File.WriteAllText(filePath, json);
        }

        public static bool FromFile<T>(string filePath, out T result)
        {
            try
            {
                if (!System.IO.File.Exists(filePath))
                {
                    result = default;
                    return false;
                }
                string json = System.IO.File.ReadAllText(filePath);
                return TryDeserialize(json, out result);
            }
            catch
            {
                result = default;
                return false;
            }
        }

        public static bool FromFileArray<T>(string filePath, out T[] result)
        {
            try
            {
                if (!System.IO.File.Exists(filePath))
                {
                    result = null;
                    return false;
                }
                string json = System.IO.File.ReadAllText(filePath);
                return TryDeserializeArray(json, out result);
            }
            catch
            {
                result = null;
                return false;
            }
        }
    }
}
