# Superhero App

A simple full-stack web application to browse superheroes, save favorites, and generate team recommendations.

## Tech Stack

- **Backend**: Python Flask with SQLite database
- **Frontend**: Next.js React with client-side rendering
- **Deployment**: Docker and Docker Compose

## Quick Start

### Using Docker (Recommended)

```bash
# Start both backend and frontend containers
docker-compose up

# The app will be available at http://localhost:3000
# Backend API runs at http://localhost:8000
```

Wait 5-10 seconds for the app to fully load. The backend will fetch 100 heroes from the Superhero API on startup.

### Running Locally (Without Docker)

**Backend (Flask)**:
```bash
cd backend
pip install -r requirements.txt
python app.py
# Runs on http://localhost:8000
```

**Frontend (Next.js)**:
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

## Features

### 1. Browse Heroes
- Browse 100 superheroes
- Search by name
- View hero details (powers, alignment, image)

### 2. Favorites
- Click the heart icon to save/remove favorites
- Your favorites are saved in browser storage
- Access your favorites list from the home page

### 3. Team Generator
- Generate a team of 5 heroes using 3 strategies:
  - **Random**: Pick 5 random heroes
  - **Power-based**: Pick 5 strongest heroes
  - **Balanced**: Mix strong and diverse heroes

## Project Structure

```
superhero-app/
├── backend/
│   ├── app.py          # Flask API with 7 endpoints
│   ├── data/
│   │   └── heroes.db   # SQLite database
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── page.js           # Home page
│   │   ├── layout.js         # Layout
│   │   └── hero/[id]/page.js # Hero detail page
│   ├── lib/
│   │   ├── api.js      # API helper functions
│   │   └── clientId.js # Browser ID generation
│   └── styles/
│       └── globals.css # Global styles
├── docker-compose.yml # Docker configuration
└── README.md
```

## API Endpoints

| Method | Endpoint                         | Purpose                 |
| ------ | -------------------------------- | ----------------------- |
| GET    | `/heroes`                        | Get all heroes          |
| GET    | `/heroes/{id}`                   | Get single hero         |
| GET    | `/favorites/{clientId}`          | Get user's saved heroes |
| POST   | `/favorites/{clientId}/{heroId}` | Save a hero             |
| DELETE | `/favorites/{clientId}/{heroId}` | Remove a hero           |
| PUT    | `/heroes/{id}`                   | Update hero alignment   |
| GET    | `/teams/recommend?strategy=X`    | Generate team           |

## Database

Single `heroes` table with columns:
- `id` - Unique identifier
- `name` - Hero name
- `alignment` - Good/Bad/Neutral
- `image_url` - Hero image link
- `intelligence`, `strength`, `speed`, `durability`, `power`, `combat` - Power stats (0-100)
- `saved_by` - Comma-separated client IDs of users who favorited this hero

## How It Works

### Frontend Flow
1. User loads home page
2. Browser generates unique ID (stored in localStorage)
3. Page fetches all 100 heroes and user's favorites
4. User can search, add/remove favorites, or generate a team
5. Clicking a hero card navigates to detail page

### Backend Flow
1. Flask server starts and connects to SQLite database
2. On startup, fetches 100 heroes from Superhero API
3. Stores heroes in database with power stats
4. Handles API requests from frontend
5. Favorites stored as comma-separated client IDs in `saved_by` column

### Favorites System
- When user clicks heart: frontend sends POST/DELETE request to backend
- Backend appends/removes client ID from hero's `saved_by` field
- No login needed - identification by browser-generated UUID

### Team Generation
- **Random**: Shuffle all heroes, pick first 5
- **Power-based**: Sort by total power score, pick top 5
- **Balanced**: Pick 2 strong + 3 random heroes

## Common Issues

### Port Already in Use
If port 3000 or 8000 is in use:
```bash
# Change port in docker-compose.yml or kill existing process
```

### Database Errors
The database is auto-created on first run. If you want to reset:
```bash
# Stop containers
docker-compose down

# Delete the database volume
docker volume prune

# Restart
docker-compose up
```

### Heroes Not Loading
- Wait 10 seconds for backend to fetch from Superhero API
- Check the Docker logs: `docker-compose logs backend`
