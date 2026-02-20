# Hero Atlas

A simple full-stack app to browse superheroes, save favorites, and generate team recommendations.

## Features
- Browse a list of heroes with details
- Save favorites per browser session (anonymous client id)
- Team recommendations: balanced, power-focused, or random
- FastAPI backend with SQLite
- Next.js frontend with a bold, modern UI

## Requirements
- Docker + Docker Compose
- Superhero API token (https://www.superheroapi.com/)

## Run with Docker
1. From this folder, set the API token and start containers:
l̥
```bash
set SUPERHERO_API_TOKEN=YOUR_TOKEN
cd superhero-appl
docker compose up --build
```

2. Open the app at http://localhost:3000

The first run seeds the database with 100 heroes using the API token.

## Local Development (without Docker)
Backend:
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
set SUPERHERO_API_TOKEN=YOUR_TOKEN
uvicorn app.main:app --reload
```

Frontend:
```bash
cd frontend
npm install
set NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
npm run dev
```

## API Quick Look
- `GET /heroes` (optional `search`, `limit`, `offset`)
- `GET /heroes/{id}`
- `GET /favorites/{client_id}`
- `POST /favorites/{client_id}/{hero_id}`
- `DELETE /favorites/{client_id}/{hero_id}`
- `GET /teams/recommend?strategy=balanced|power|random&power=intelligence`

## Optional OpenShift Notes
- Build and push images for `backend` and `frontend`.
- Create two deployments/services and route frontend to `3000` and backend to `8000`.
- Set env vars `SUPERHERO_API_TOKEN` and `NEXT_PUBLIC_API_BASE_URL`.
- Use a persistent volume for `/app/data` on the backend to keep the SQLite DB.
