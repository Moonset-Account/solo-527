using Kitchen.Config;
using UnityEngine;

namespace Kitchen.Core
{
    public class HeldItem : MonoBehaviour
    {
        [Header("Config")]
        public IngredientConfig ingredient;
        public RecipeConfig platedRecipe;

        [Header("Runtime")]
        [SerializeField] private IngredientState currentState;
        [SerializeField] private float cookProgress;
        [SerializeField] private float chopProgress;
        [SerializeField] private bool isPlated;
        [SerializeField] private bool isDirty;

        public IngredientState CurrentState => currentState;
        public float CookProgress => cookProgress;
        public float ChopProgress => chopProgress;
        public bool IsPlated => isPlated;
        public bool IsDirty => isDirty;
        public Renderer visualRenderer;

        private System.Collections.IEnumerator currentProcess;

        private void Awake()
        {
            if (ingredient != null)
            {
                currentState = ingredient.defaultState;
                UpdateVisual();
            }
        }

        public void Initialize(IngredientConfig config)
        {
            ingredient = config;
            currentState = config.defaultState;
            cookProgress = 0f;
            chopProgress = 0f;
            isPlated = false;
            isDirty = false;
            platedRecipe = null;
            UpdateVisual();
        }

        public bool StartChopping(System.Action onComplete)
        {
            if (ingredient == null || !ingredient.requiresChopping || currentState != IngredientState.Raw) return false;
            if (currentProcess != null) StopCoroutine(currentProcess);
            currentProcess = ChopRoutine(onComplete);
            StartCoroutine(currentProcess);
            return true;
        }

        private System.Collections.IEnumerator ChopRoutine(System.Action onComplete)
        {
            chopProgress = 0f;
            while (chopProgress < ingredient.chopTime)
            {
                chopProgress += Time.deltaTime;
                yield return null;
            }
            chopProgress = ingredient.chopTime;
            currentState = IngredientState.Chopped;
            UpdateVisual();
            onComplete?.Invoke();
        }

        public bool StartCooking(System.Action onCooked, System.Action onBurned)
        {
            if (ingredient == null || !ingredient.requiresCooking) return false;
            if (currentState != IngredientState.Raw && currentState != IngredientState.Chopped) return false;
            if (currentProcess != null) StopCoroutine(currentProcess);
            currentProcess = CookRoutine(onCooked, onBurned);
            StartCoroutine(currentProcess);
            return true;
        }

        private System.Collections.IEnumerator CookRoutine(System.Action onCooked, System.Action onBurned)
        {
            cookProgress = 0f;
            currentState = IngredientState.Cooking;
            UpdateVisual();

            while (cookProgress < ingredient.cookTime)
            {
                cookProgress += Time.deltaTime;
                yield return null;
            }

            currentState = IngredientState.Cooked;
            UpdateVisual();
            onCooked?.Invoke();

            float burnTimer = 0f;
            while (burnTimer < ingredient.burnTime)
            {
                burnTimer += Time.deltaTime;
                yield return null;
            }

            currentState = IngredientState.Burned;
            UpdateVisual();
            onBurned?.Invoke();
        }

        public void StopCooking()
        {
            if (currentProcess != null)
            {
                StopCoroutine(currentProcess);
                currentProcess = null;
            }
        }

        public void PlateWith(RecipeConfig recipe)
        {
            platedRecipe = recipe;
            isPlated = true;
            currentState = IngredientState.Plated;
            UpdateVisual();
        }

        public void SetDirty()
        {
            isDirty = true;
            isPlated = false;
            platedRecipe = null;
        }

        public void ResetForReuse()
        {
            isDirty = false;
            isPlated = false;
            platedRecipe = null;
            ingredient = null;
            currentState = IngredientState.Raw;
            cookProgress = 0f;
            chopProgress = 0f;
        }

        public void Clean()
        {
            isDirty = false;
            isPlated = false;
            platedRecipe = null;
            currentState = IngredientState.Raw;
            Destroy(gameObject, 0.1f);
        }

        public void DestroyItem()
        {
            if (currentProcess != null) StopCoroutine(currentProcess);
            Destroy(gameObject);
        }

        private static void SetColor(Renderer r, Color c)
        {
            if (r == null) return;
            if (r.sharedMaterial != null) r.sharedMaterial.color = c;
            else if (r.material != null) r.material.color = c;
        }

        private void UpdateVisual()
        {
            if (visualRenderer == null || ingredient == null) return;
            SetColor(visualRenderer, ingredient.color);

            switch (currentState)
            {
                case IngredientState.Raw:
                    transform.localScale = Vector3.one;
                    break;
                case IngredientState.Chopped:
                    transform.localScale = new Vector3(0.7f, 0.7f, 0.7f);
                    break;
                case IngredientState.Cooking:
                    SetColor(visualRenderer, Color.Lerp(ingredient.color, Color.white, 0.3f));
                    break;
                case IngredientState.Cooked:
                    SetColor(visualRenderer, Color.Lerp(ingredient.color, new Color(0.6f, 0.3f, 0.1f), 0.4f));
                    break;
                case IngredientState.Burned:
                    SetColor(visualRenderer, new Color(0.1f, 0.1f, 0.1f));
                    break;
                case IngredientState.Plated:
                    Color baseC = Color.white;
                    if (visualRenderer.sharedMaterial != null) baseC = visualRenderer.sharedMaterial.color;
                    else if (visualRenderer.material != null) baseC = visualRenderer.material.color;
                    SetColor(visualRenderer, Color.Lerp(baseC, Color.yellow, 0.5f));
                    transform.localScale = new Vector3(1.2f, 1.2f, 1.2f);
                    break;
            }
        }
    }
}
