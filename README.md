# Pan-Atlantic University LMS (PAU-LMS)

An advanced, feature-rich Learning Management System (LMS) custom-built for Pan-Atlantic University (PAU). This system provides an intuitive interface for students, faculty, and administrators, complete with interactive course hubs, AI-powered study assistance, and comprehensive admin utilities.

- **Site URL:** [https://pau-lms.netlify.app](https://pau-lms.netlify.app)

---

## 🌟 Key Features

### 📖 Student & Course Hub
*   **Interactive Course Pages:** Chronological weekly breakdown of lecture contents, downloadable slides, external references, and announcements.
*   **Self-Enrollment:** Seamlessly browse the global course catalog and enroll in modules.
*   **Grades & Submissions:** Track scores across assignments, view grader feedback, and monitor progress.

### 🤖 AI Study Assistant (Gemini API Integration)
*   **Interactive AI Tutor:** Chatbot tailored to course materials for student queries.
*   **Quiz Generator:** Automatically generates randomized multiple-choice tests based on study topics.
*   **Resource Recommender:** Suggests additional academic references, books, and articles.
*   **Notes Summarizer:** Condenses long lecture materials into key bullet points.

### 📝 Assignments & Quizzes
*   **File Uploads:** Student submissions securely stored in Cloudinary.
*   **Grading Workflow:** Instructors can evaluate submissions, assign points, and provide comments.
*   **Interactive Quizzes:** Timed assessments with automated grading.

### 🛡️ Security & Privacy
*   Strict API security headers utilizing **Helmet**.
*   Global and route-specific API **Rate Limiting**.
*   **NoSQL Injection Prevention** with Mongo Sanitize.
*   In-depth **XSS Input Sanitization**.
*   **HTTP Parameter Pollution (HPP)** protection.

### ⚙️ Admin Console
*   Manage users (students, faculty, admins) and course enrollments.
*   Create new courses, edit syllabus timelines, and add course content.
*   Access security metrics and real-time **Audit Logs** tracking actions.

---

## 🛠️ Technology Stack

*   **Frontend:** Vue 3 (Composition API), Pinia (State Management), Vue Router, Tailwind CSS, Lucide icons, Vite.
*   **Backend:** Node.js, Express, MongoDB (Mongoose ODM).
*   **Authentication:** Passport.js (Stateless JWT token strategy), Google OAuth 2.0, Microsoft OAuth.
*   **Email & Cron:** Nodemailer, Resend, Node-cron (for automated course reminder alerts).
*   **Uploads:** Multer with Cloudinary integration.

---

## 🚀 Project Setup

### 1. Installation
Clone the repository and install the dependencies for both client and server:
```sh
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory and configured local variables:
```env
# Client-side configuration
VITE_API_BASE_URL=http://localhost:5000
```

Create a `.env` file in the `server` directory and configured local variables:
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_URL=your_cloudinary_url
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
RESEND_API_KEY=your_resend_api_key
```

### 3. Run the Application

#### Run Frontend Developer Server
```sh
npm run dev
```

#### Run Backend Server
```sh
npm run server:dev
```

#### Seed Database
To populate the database with initial template courses and user roles:
```sh
npm run seed
```

#### Lint and Code Formatting
```sh
npm run lint
npm run format
```
