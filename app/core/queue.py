import os
import sys

import redis
from rq import Queue, Worker, Connection

from app.core.config import settings


def get_redis_connection():
    return redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        db=settings.REDIS_DB,
        decode_responses=False,
    )


def get_queue(name: str = "default") -> Queue:
    conn = get_redis_connection()
    return Queue(name, connection=conn)


def get_training_queue() -> Queue:
    return get_queue("training")


def get_inference_queue() -> Queue:
    return get_queue("inference")


def run_worker(queues: list = None):
    queues = queues or ["default", "training", "inference"]
    conn = get_redis_connection()
    with Connection(conn):
        worker = Worker(list(map(Queue, queues)))
        worker.work()
