from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import sqlite3

app = FastAPI()

IMAGE_DIR = "images"
DB_PATH = "annotation.db"

os.makedirs(IMAGE_DIR, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/images", StaticFiles(directory=IMAGE_DIR), name="images")


class Rating(BaseModel):
    user_id: str
    image_index: int
    filename: str
    valence: float
    arousal: float


def get_conn():
    return sqlite3.connect(DB_PATH)


def init_db():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS ratings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            image_index INTEGER NOT NULL,
            filename TEXT NOT NULL,
            valence REAL NOT NULL,
            arousal REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, image_index)
        )
    """)

    conn.commit()
    conn.close()


init_db()


@app.get("/")
def root():
    return {"message": "Image V/A Annotation API is running"}


@app.get("/api/images")
def get_images():
    files = []

    for filename in sorted(os.listdir(IMAGE_DIR)):
        if filename.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
            files.append({
                "filename": filename,
                "url": f"http://127.0.0.1:8000/images/{filename}"
            })

    return files


@app.post("/api/ratings")
def save_rating(rating: Rating):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO ratings (
            user_id, image_index, filename, valence, arousal
        )
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id, image_index)
        DO UPDATE SET
            filename = excluded.filename,
            valence = excluded.valence,
            arousal = excluded.arousal,
            updated_at = CURRENT_TIMESTAMP
    """, (
        rating.user_id,
        rating.image_index,
        rating.filename,
        rating.valence,
        rating.arousal
    ))

    conn.commit()
    conn.close()

    return {"message": "saved"}


@app.get("/api/ratings/{user_id}")
def get_user_ratings(user_id: str):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT image_index, filename, valence, arousal
        FROM ratings
        WHERE user_id = ?
        ORDER BY image_index ASC
    """, (user_id,))

    rows = cur.fetchall()
    conn.close()

    return [
        {
            "image_index": row[0],
            "filename": row[1],
            "valence": row[2],
            "arousal": row[3],
        }
        for row in rows
    ]


@app.get("/api/progress/{user_id}")
def get_progress(user_id: str):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT MAX(image_index)
        FROM ratings
        WHERE user_id = ?
    """, (user_id,))

    row = cur.fetchone()
    conn.close()

    last_index = row[0] if row[0] is not None else 0

    return {"last_index": last_index}