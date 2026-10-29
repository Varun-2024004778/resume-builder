# Resume Builder

Resume Builder is a web application for creating and previewing a structured resume. It provides a browser-based frontend for account registration, login, resume data entry, saved resume retrieval, and PDF printing, with an Express and MongoDB backend secured by JSON Web Tokens (JWT).

## Features

- User registration and login
- Password hashing with `bcryptjs`
- JWT-based authentication
- Contact information form
- Education information form
- Skills and professional summary forms
- Project information form
- Resume preview page
- Saved resume retrieval
- Browser print dialog for saving a resume as PDF
- MongoDB persistence through Mongoose

## Technology stack

### Frontend

- HTML
- CSS
- Vanilla JavaScript
- Browser `fetch` API
- Browser `localStorage` for the JWT token

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- JSON Web Token (`jsonwebtoken`)
- `bcryptjs`
- `cors`
- `dotenv`

## Project structure

```text
resume-builder/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── models/
│   │   ├── Resume.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── resume.js
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
├── frontend/
│   ├── css/
│   ├── js/
│   └── *.html
├── demo.html
└── .gitignore
```

## Prerequisites

- Node.js 18 or newer
- npm
- MongoDB, either a local installation or a MongoDB Atlas database

## Configuration

Create a `.env` file inside the `backend` directory:

```env
MONGO_URI=mongodb://127.0.0.1:27017/resume-builder
JWT_SECRET=replace-with-a-long-random-secret
PORT=5000
```

Do not commit `.env` or real credentials. The repository's `.gitignore` already excludes environment files.

## Installation

Clone the repository and install the backend dependencies:

```bash
git clone https://github.com/Varun-2024004778/resume-builder.git
cd resume-builder/backend
npm install
```

## Running the backend

From the `backend` directory:

```bash
npm start
```

For development with automatic restarts:

```bash
npm run dev
```

The API starts on:

```text
http://localhost:5000
```

The root endpoint can be used as a basic health check:

```text
GET /
```

Expected response:

```text
Backend is running successfully!
```

## Running the frontend

After starting the backend, open `frontend/intro.html` in a browser. The frontend pages call the API at `http://127.0.0.1:5000`.

For more reliable local development, serve the repository with a static file server instead of opening the HTML files directly. For example, from the repository root:

```bash
npx serve frontend
```

Then open the URL printed by the static server.

## API overview

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/register` | Register a new user |
| `POST` | `/api/login` | Authenticate a user and receive a JWT |

### Resume data

Resume endpoints require an `Authorization` header:

```http
Authorization: Bearer <token>
```

The backend provides routes for saving and retrieving:

- Contact information
- Education
- Skills
- Professional summary
- Projects
- The complete resume

The frontend form pages call these routes as the user progresses through the resume workflow.

## Typical workflow

1. Open the introduction page.
2. Register an account.
3. Log in to receive an authentication token.
4. Complete the contact, education, skills, summary, and projects sections.
5. Open the preview page to review the resume.
6. Use the print action to print or save the resume as a PDF.

## Troubleshooting

### “Server is not running”

Make sure the backend is running with `npm start` and that it is listening on port `5000`.

### MongoDB connection failure

Check that MongoDB is running and that `MONGO_URI` in `backend/.env` is correct.

### Authentication errors

Log in again if the token has expired. Also verify that `JWT_SECRET` is defined and has not changed between server restarts.

### Frontend cannot reach the API

Confirm that the frontend JavaScript API URLs match the backend host and port. The current frontend uses `http://127.0.0.1:5000`.

## Security considerations

- Use a strong, unique `JWT_SECRET`.
- Never commit `.env` files, database credentials, or production tokens.
- Restrict CORS origins before deploying outside local development.
- Validate and sanitize user input on the server.
- Use HTTPS in production.
- Configure token expiration and secure token storage for production use.
- Use a production process manager and disable verbose development behavior before deployment.

## Future improvements

- Add a frontend build tool or static web server configuration.
- Add automated backend and frontend tests.
- Add schema validation for request bodies.
- Support multiple education entries and projects per resume.
- Add selectable resume templates.
- Add server-side PDF generation and download.
- Add password reset and email verification.
- Add centralized API configuration instead of hard-coded frontend URLs.

## License

No license is currently specified for this repository.
