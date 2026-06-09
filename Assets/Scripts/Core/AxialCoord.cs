using System;

namespace BalloonPost.Core
{
    [Serializable]
    public struct AxialCoord : IEquatable<AxialCoord>
    {
        public int Q;
        public int R;

        public AxialCoord(int q, int r)
        {
            Q = q;
            R = r;
        }

        public int S => -Q - R;

        public static readonly AxialCoord Zero = new AxialCoord(0, 0);

        public static readonly AxialCoord[] Directions = new AxialCoord[]
        {
            new AxialCoord(1, 0),
            new AxialCoord(1, -1),
            new AxialCoord(0, -1),
            new AxialCoord(-1, 0),
            new AxialCoord(-1, 1),
            new AxialCoord(0, 1),
        };

        public static AxialCoord operator +(AxialCoord a, AxialCoord b)
        {
            return new AxialCoord(a.Q + b.Q, a.R + b.R);
        }

        public static AxialCoord operator -(AxialCoord a, AxialCoord b)
        {
            return new AxialCoord(a.Q - b.Q, a.R - b.R);
        }

        public static AxialCoord operator *(AxialCoord a, int scalar)
        {
            return new AxialCoord(a.Q * scalar, a.R * scalar);
        }

        public static bool operator ==(AxialCoord a, AxialCoord b)
        {
            return a.Q == b.Q && a.R == b.R;
        }

        public static bool operator !=(AxialCoord a, AxialCoord b)
        {
            return !(a == b);
        }

        public bool Equals(AxialCoord other)
        {
            return Q == other.Q && R == other.R;
        }

        public override bool Equals(object obj)
        {
            return obj is AxialCoord other && Equals(other);
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(Q, R);
        }

        public override string ToString()
        {
            return $"({Q}, {R})";
        }

        public int DistanceTo(AxialCoord other)
        {
            return (Math.Abs(Q - other.Q) + Math.Abs(Q + R - other.Q - other.R) + Math.Abs(R - other.R)) / 2;
        }

        public AxialCoord Neighbor(int direction)
        {
            return this + Directions[((direction % 6) + 6) % 6];
        }

        public static int DirectionIndex(AxialCoord from, AxialCoord to)
        {
            var diff = to - from;
            for (int i = 0; i < Directions.Length; i++)
            {
                if (Directions[i] == diff) return i;
            }
            return -1;
        }
    }
}
