#!/bin/bash
export PYTHONPATH=/Volumes/TraeProjects/trae-solo-generated-projects/work-0373/backend
cd /Volumes/TraeProjects/trae-solo-generated-projects/work-0373/backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
