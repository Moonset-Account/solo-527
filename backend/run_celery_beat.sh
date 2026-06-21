#!/bin/bash
export PYTHONPATH=/Volumes/TraeProjects/trae-solo-generated-projects/work-0373/backend
cd /Volumes/TraeProjects/trae-solo-generated-projects/work-0373/backend
celery -A app.celery_app.celery_app beat --loglevel=info
