#!/bin/bash
export PYTHONPATH=.
celery -A app.celery_app.celery_app worker --loglevel=info
