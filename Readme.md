# Webhook Runner & Task Orchestrator 🚀
Name: Manthan Sunil Kumbhar
## 🛠️ Setup

```sh
cd webhook-runner
2. Environment variables
Create a .env file inside /api:

env
Copy code
DATABASE_URL=sqlite:///./webhook.db
FIREBASE_CREDENTIALS=serviceAccountKey.json
FERNET_KEY= QRQnLrJgeGfM-rvaOhC1jVZBEY8buvu_BI2D4EwlTxs=
. Copy from .env.example for guidance.


. Backend (FastAPI)
sh
Copy code
cd api
python -m venv venv
venv\Scripts\activate    


pip install -r requirements.txt
uvicorn main:app --reload
Backend runs at http://127.0.0.1:8000


. Frontend (React + Vite + TS)
sh
Copy code
cd frontend
npm install
npm run dev
Frontend runs at http://127.0.0.1:5173


. Testing
Backend
sh
Copy code
cd api
pytest -v
Frontend
sh
Copy code
cd frontend
npm test


. API Endpoints
Method	Endpoint	Description
POST	/tasks/	Create a task
GET	/tasks/	List tasks (paginated)
GET	/tasks/{id}	Get single task
PATCH	/tasks/{id}	Update task
DELETE	/tasks/{id}	Delete task + runs + DLQ
GET	/tasks/{id}/runs	Get runs for task
GET	/tasks/{id}/dlq	Get DLQ entries
POST	/tasks/{id}/dlq/{dlq_id}/replay	Replay failed task


. Full interactive docs: http://127.0.0.1:8000/docs


. AI Failure Classifier
Network → timeout, DNS errors.

Auth → 401, 403, Invalid token.

Payload → 400, 422, schema mismatch.

Each failure gets a classification + explanation string.


. Seed Data
Run the seed script to populate 1,000+ tasks for testing:


sh
Copy code
cd api
python seed.py


. DevEx
Makefile Shortcuts
sh
Copy code
make dev      # run backend + frontend
make test     # run backend + frontend tests
make seed     # load sample data


. How I used Cursor
Used Cursor to generate CRUD scaffolding for FastAPI routes.

Leveraged Cursor to stub test cases (retry/backoff, DLQ replay).

Used Cursor to quickly prototype frontend pages (TasksList, TaskCreate).

Always reviewed & refined generated code manually before committing.


. Status
 Backend (FastAPI + Worker + Firebase Auth)

 Frontend (React + Vite + TS)

 AI Failure Classifier

 Tests (backend + frontend)

 Docs & Diagram



. This `README.md` includes:  
- Setup instructions  
- Env vars  
- Run commands   
- Endpoints table  
- AI failure classifier description  
- Tests info  
- Cursor usage note 