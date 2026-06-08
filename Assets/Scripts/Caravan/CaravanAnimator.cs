using UnityEngine;

namespace InkMountainBridge
{
    public class CaravanAnimator : MonoBehaviour
    {
        [SerializeField] private AnimationClip walkAnimation;
        [SerializeField] private AnimationClip idleAnimation;
        [SerializeField] private AnimationClip fallAnimation;
        [SerializeField] private AnimationClip drownAnimation;
        [SerializeField] private GameObject dustParticlePrefab;
        [SerializeField] private GameObject splashParticlePrefab;

        private Animation animationComponent;
        private CaravanController caravanController;
        private string currentAnimation;

        private void Awake()
        {
            animationComponent = GetComponent<Animation>();
            caravanController = GetComponent<CaravanController>();
        }

        private void OnEnable()
        {
            GameEvents.OnCaravanArrived += OnCaravanArrived;
            GameEvents.OnCaravanFailed += OnCaravanFailed;
        }

        private void OnDisable()
        {
            GameEvents.OnCaravanArrived -= OnCaravanArrived;
            GameEvents.OnCaravanFailed -= OnCaravanFailed;
        }

        private void Update()
        {
            if (caravanController == null) return;

            if (caravanController.isDrowning)
            {
                PlayDrown();
            }
            else if (!caravanController.isOnBridge && caravanController.isMoving)
            {
                PlayFall();
            }
            else if (caravanController.isMoving)
            {
                PlayWalk();
            }
            else
            {
                PlayIdle();
            }
        }

        public void PlayWalk()
        {
            PlayClip(walkAnimation, "Walk");
        }

        public void PlayIdle()
        {
            PlayClip(idleAnimation, "Idle");
        }

        public void PlayFall()
        {
            PlayClip(fallAnimation, "Fall");
        }

        public void PlayDrown()
        {
            PlayClip(drownAnimation, "Drown");
        }

        private void PlayClip(AnimationClip clip, string clipName)
        {
            if (clip == null) return;
            if (currentAnimation == clipName) return;

            currentAnimation = clipName;

            if (animationComponent != null)
            {
                animationComponent.clip = clip;
                animationComponent.Play();
            }
        }

        public void SpawnDust(Vector2 position)
        {
            if (dustParticlePrefab == null) return;

            GameObject dust = Instantiate(dustParticlePrefab, position, Quaternion.identity);
            ParticleSystem particles = dust.GetComponent<ParticleSystem>();
            if (particles != null)
            {
                Destroy(dust, particles.main.duration + particles.main.startLifetime.constant);
            }
            else
            {
                Destroy(dust, 2f);
            }
        }

        public void SpawnSplash(Vector2 position)
        {
            if (splashParticlePrefab == null) return;

            GameObject splash = Instantiate(splashParticlePrefab, position, Quaternion.identity);
            ParticleSystem particles = splash.GetComponent<ParticleSystem>();
            if (particles != null)
            {
                Destroy(splash, particles.main.duration + particles.main.startLifetime.constant);
            }
            else
            {
                Destroy(splash, 2f);
            }
        }

        private void OnCaravanArrived()
        {
            PlayIdle();
        }

        private void OnCaravanFailed(string cause)
        {
            if (cause == "Drowned")
            {
                PlayDrown();
            }
            else
            {
                PlayFall();
            }
        }
    }
}
