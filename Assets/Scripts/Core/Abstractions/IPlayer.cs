using UnityEngine;

namespace KitchenChaos.Core.Abstractions
{
    public enum PlayerAnimHint
    {
        Idle,
        Walk,
        PickUp,
        Chop,
        Cook,
        Serve,
        Wash,
        Throw,
        Carry
    }

    public interface IPlayer
    {
        int PlayerId { get; }
        Vector2 Facing { get; }
        bool HasItem { get; }
        object CarryingRaw { get; }
        Transform CarryAnchor { get; }
        Vector2 Position { get; }
        bool PickUpRaw(object item);
        object ReleaseCarryingRaw();
        void DropCarryingRaw();
        void StartProcessRaw(float duration, System.Action onComplete, PlayerAnimHint anim);
        bool InteractPressed { get; }
        bool SecondaryPressed { get; }
    }

    public interface IInteractable
    {
        string StationName { get; }
        bool Interact(IPlayer player);
        bool SecondaryInteract(IPlayer player);
    }
}
