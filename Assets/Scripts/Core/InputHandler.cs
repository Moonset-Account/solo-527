using UnityEngine;

namespace LakeNavigation
{
    public class InputHandler : MonoBehaviour
    {
        private void Update()
        {
            if (Input.GetKeyDown(KeyCode.Escape))
            {
                if (GameManager.Instance.CurrentState == GameState.Sailing)
                {
                    GameManager.Instance.PauseGame();
                }
                else if (GameManager.Instance.CurrentState == GameState.Paused)
                {
                    GameManager.Instance.ResumeGame();
                }
            }

            if (Input.GetKeyDown(KeyCode.Space) && GameManager.Instance.CurrentState == GameState.Sailing)
            {
                if (SailingController.Instance != null)
                {
                    SailingController.Instance.TakePhoto();
                }
            }

            if (Input.GetKeyDown(KeyCode.P) && GameManager.Instance.CurrentState == GameState.Sailing)
            {
                GameManager.Instance.PauseGame();
            }
        }
    }
}
