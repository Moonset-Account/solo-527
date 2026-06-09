#if !TMP_PRESENT
using UnityEngine;
using UnityEngine.UI;

namespace TMPro
{
    public class TMP_FontAsset : ScriptableObject
    {
    }

    public class TextMeshProUGUI : Text
    {
        [SerializeField] private TMP_FontAsset m_fontAsset;
        public TMP_FontAsset font
        {
            get => m_fontAsset;
            set => m_fontAsset = value;
        }

        public string text
        {
            get => base.text;
            set => base.text = value;
        }

        public bool enableWordWrapping
        {
            get => horizontalOverflow != HorizontalWrapMode.Overflow;
            set => horizontalOverflow = value ? HorizontalWrapMode.Wrap : HorizontalWrapMode.Overflow;
        }

        public TextAlignmentOptions alignment
        {
            get
            {
                switch (base.alignment)
                {
                    case TextAnchor.UpperLeft: return TextAlignmentOptions.TopLeft;
                    case TextAnchor.UpperCenter: return TextAlignmentOptions.Top;
                    case TextAnchor.UpperRight: return TextAlignmentOptions.TopRight;
                    case TextAnchor.MiddleLeft: return TextAlignmentOptions.MidlineLeft;
                    case TextAnchor.MiddleCenter: return TextAlignmentOptions.Center;
                    case TextAnchor.MiddleRight: return TextAlignmentOptions.MidlineRight;
                    case TextAnchor.LowerLeft: return TextAlignmentOptions.BottomLeft;
                    case TextAnchor.LowerCenter: return TextAlignmentOptions.Bottom;
                    case TextAnchor.LowerRight: return TextAlignmentOptions.BottomRight;
                    default: return TextAlignmentOptions.Center;
                }
            }
            set
            {
                switch (value)
                {
                    case TextAlignmentOptions.TopLeft: base.alignment = TextAnchor.UpperLeft; break;
                    case TextAlignmentOptions.Top: base.alignment = TextAnchor.UpperCenter; break;
                    case TextAlignmentOptions.TopRight: base.alignment = TextAnchor.UpperRight; break;
                    case TextAlignmentOptions.MidlineLeft: base.alignment = TextAnchor.MiddleLeft; break;
                    case TextAlignmentOptions.Center: base.alignment = TextAnchor.MiddleCenter; break;
                    case TextAlignmentOptions.MidlineRight: base.alignment = TextAnchor.MiddleRight; break;
                    case TextAlignmentOptions.BottomLeft: base.alignment = TextAnchor.LowerLeft; break;
                    case TextAlignmentOptions.Bottom: base.alignment = TextAnchor.LowerCenter; break;
                    case TextAlignmentOptions.BottomRight: base.alignment = TextAnchor.LowerRight; break;
                }
            }
        }

        public bool raycastTarget
        {
            get => base.raycastTarget;
            set => base.raycastTarget = value;
        }

        public Color color
        {
            get => base.color;
            set => base.color = value;
        }

        public float fontSize
        {
            get => base.fontSize;
            set => base.fontSize = (int)value;
        }
    }

    public enum TextAlignmentOptions
    {
        TopLeft = 0,
        Top = 1,
        TopRight = 2,
        MidlineLeft = 3,
        Center = 4,
        MidlineRight = 5,
        BottomLeft = 6,
        Bottom = 7,
        BottomRight = 8,
        Left = 3,
        Right = 5,
        Justified = 9
    }

    public class TMP_Dropdown : Dropdown
    {
    }

    public class TMP_InputField : InputField
    {
    }

    public class TextMeshPro : TextMeshProUGUI
    {
    }
}
#endif
