# App for Image Annotation

Image Valence / Arousal Annotation App

## Environment

The project was developed and tested with the following environment.

- Python 3.12.8
- Node.js v24.11.0
- npm 11.6.1

Python version management uses pyenv.

---

# Backend Setup

Move to backend directory.

```bash
cd backend
```

Create virtual environment.

```bash
python -m venv .venv
```

Activate virtual environment.

Linux / Ubuntu:

```bash
source .venv/bin/activate
```

Install required packages.

```bash
pip install -r requirement.txt
```

Run FastAPI server.

```bash
uvicorn app.main:app --reload
```

---

# Frontend Setup

Move to frontend directory.

```bash
cd frontend
```

Install packages.

```bash
npm install
```

Run frontend server.

```bash
npm run dev
```

---

# Notes

- Images should be placed in:

```text
backend/images/
```

- `.venv`, `node_modules`, and database files are excluded by `.gitignore`.
