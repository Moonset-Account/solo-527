using System.Collections.Generic;
using UnityEngine;

namespace Kitchen.Config
{
    [System.Serializable]
    public class TutorialConfig
    {
        public bool enableTutorial = true;
        public List<TutorialStep> steps = new List<TutorialStep>();
        public float autoAdvanceDelay = 3f;
        public bool requireInputToAdvance = true;
    }

    [System.Serializable]
    public class TutorialStep
    {
        public string id;
        [TextArea] public string instructionText;
        public TutorialAction requiredAction;
        public string targetObjectId;
        public float timeLimit = 0f;
        public bool showArrow;
        public Vector3 arrowOffset;
        public Sprite customIcon;
    }

    public enum TutorialAction
    {
        None,
        PressInteract,
        PressMove,
        PickUpIngredient,
        PlaceItem,
        DiscardItem,
        ChopIngredient,
        CookIngredient,
        PlateFood,
        ServeOrder,
        CleanDish,
        SwitchCharacter,
        OpenMenu
    }
}
