#!/bin/bash

echo "初始化数据库数据..."
export PYTHONPATH=$(pwd)
python scripts/init_data.py
