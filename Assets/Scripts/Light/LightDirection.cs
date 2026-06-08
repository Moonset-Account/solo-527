using UnityEngine;

namespace ShadowPlatformer.Light
{
    public enum LightDirection
    {
        Right,
        Left,
        Up,
        Down
    }

    public static class LightDirectionExtensions
    {
        public static Vector2 ToVector2(this LightDirection dir)
        {
            return dir switch
            {
                LightDirection.Right => Vector2.right,
                LightDirection.Left => Vector2.left,
                LightDirection.Up => Vector2.up,
                LightDirection.Down => Vector2.down,
                _ => Vector2.right
            };
        }

        public static LightDirection Next(this LightDirection dir)
        {
            return dir switch
            {
                LightDirection.Right => LightDirection.Left,
                LightDirection.Left => LightDirection.Up,
                LightDirection.Up => LightDirection.Down,
                LightDirection.Down => LightDirection.Right,
                _ => LightDirection.Right
            };
        }
    }
}
