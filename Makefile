.PHONY: install init run dev clean

install:
	python3 -m venv venv
	source venv/bin/activate && pip install -r requirements.txt

init:
	source venv/bin/activate && python scripts/init_data.py

run:
	source venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000

dev:
	source venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

clean:
	rm -rf venv __pycache__ app/__pycache__ app/*/__pycache__
