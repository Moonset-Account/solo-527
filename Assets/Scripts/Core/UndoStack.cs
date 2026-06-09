using System;
using System.Collections.Generic;

namespace BalloonPost.Core
{
    public class UndoStack
    {
        public const int MaxUndo = 50;
        public Stack<UndoAction> Actions;
        public event Action OnStackChanged;

        public UndoStack()
        {
            Actions = new Stack<UndoAction>();
        }

        public bool CanUndo => Actions.Count > 0;
        public int Count => Actions.Count;

        public void Push(UndoAction action)
        {
            if (Actions.Count >= MaxUndo)
            {
                var temp = new Stack<UndoAction>(MaxUndo - 1);
                while (Actions.Count > 1)
                {
                    temp.Push(Actions.Pop());
                }
                Actions.Clear();
                while (temp.Count > 0)
                {
                    Actions.Push(temp.Pop());
                }
            }
            Actions.Push(action);
            OnStackChanged?.Invoke();
        }

        public UndoAction Pop()
        {
            if (Actions.Count == 0) return null;
            var action = Actions.Pop();
            OnStackChanged?.Invoke();
            return action;
        }

        public void Clear()
        {
            Actions.Clear();
            OnStackChanged?.Invoke();
        }

        public UndoAction Peek()
        {
            return Actions.Count > 0 ? Actions.Peek() : null;
        }
    }
}
