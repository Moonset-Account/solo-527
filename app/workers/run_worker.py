import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.queue import run_worker


if __name__ == "__main__":
    queues = sys.argv[1:] if len(sys.argv) > 1 else ["default", "training", "inference"]
    print(f"Starting RQ worker for queues: {queues}")
    run_worker(queues)
