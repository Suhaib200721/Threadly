# THREADLY

A simple customised T-shirt clothing brand e-commerce website.

Built as a final-year student MERN stack project.

---

## Technologies

- **Frontend:** React.js, Vite, JavaScript, React Router, Axios
- **Backend:** Node.js, Express.js, JavaScript
- **Database:** MongoDB, Mongoose

---

## Folder Structure

```
THREADLY/
├── frontend/          # React + Vite frontend
├── backend/           # Node.js + Express backend
├── .gitignore
└── README.md
```

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd THREADLY
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
```

Run the backend:

```bash
npm run dev
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` folder:

```
VITE_API_URL=http://localhost:5000/api
```

Run the frontend:

```bash
npm run dev
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable   | Description                        |
|------------|------------------------------------|
| PORT       | Port for the Express server (5000) |
| MONGO_URI  | Your MongoDB connection string     |

### Frontend (`frontend/.env`)

| Variable       | Description                          |
|----------------|--------------------------------------|
| VITE_API_URL   | Backend API base URL                 |

---

## API Test

After starting the backend, test it with:

```
GET http://localhost:5000/api/test
```

Expected response:

```json
{
  "message": "THREADLY API is working"
}
```

---

## Running the Project

Open two terminals:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Then open your browser at: `http://localhost:5173`

---

*Phase 1 — Project Setup Only*
