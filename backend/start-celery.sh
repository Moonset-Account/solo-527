#!/bin/bash

echo "启动 Celery Worker..."
cd backend

source venv/bin/activate

celery -A app.tasks.celery_app.celery_app worker --loglevel=info
