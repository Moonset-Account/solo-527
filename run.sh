#!/bin/bash
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "=== Packing Puzzle - Run Script ==="
echo "Running game from: $PROJECT_DIR"
cd "$PROJECT_DIR"
godot .
