from celery import shared_task
import logging

logger = logging.getLogger(__name__)


@shared_task
def example_task():
    logger.info('Example repair task executed')
    return 'done'
