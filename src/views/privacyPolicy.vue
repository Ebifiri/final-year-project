<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
    <!-- Header -->
    <div class="bg-gradient-to-r from-[#1e3a5f] to-[#2563eb] text-white">
      <div class="max-w-4xl mx-auto px-6 lg:px-12 py-16">
        <router-link to="/" class="inline-flex items-center gap-2 text-blue-200 hover:text-white mb-6 transition-colors text-sm">
          <ArrowLeft class="w-4 h-4" />
          Back to Home
        </router-link>
        <h1 class="text-3xl lg:text-4xl font-bold mb-3">Privacy Policy</h1>
        <p class="text-blue-200 text-sm">Last updated: {{ lastUpdated }}</p>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-4xl mx-auto px-6 lg:px-12 py-12">
      <div class="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <div class="p-8 lg:p-12 space-y-10">

          <!-- Introduction -->
          <section>
            <h2 class="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Shield class="w-5 h-5 text-blue-600" />
              Introduction
            </h2>
            <p class="text-slate-600 leading-relaxed">
              The PAU Learning Management System ("PAU LMS", "we", "our") is committed to protecting your privacy.
              This Privacy Policy explains what personal data we collect, how we use it, how we protect it, and your rights
              regarding that data. By using PAU LMS, you agree to the practices described in this policy.
            </p>
          </section>

          <hr class="border-slate-100" />

          <!-- Data We Collect -->
          <section>
            <h2 class="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Database class="w-5 h-5 text-blue-600" />
              Data We Collect
            </h2>
            <div class="space-y-4">
              <div>
                <h3 class="font-semibold text-slate-700 mb-2">Account Information</h3>
                <ul class="list-disc list-inside text-slate-600 space-y-1 ml-2">
                  <li>Full name and email address (provided during registration or via OAuth)</li>
                  <li>Profile avatar (optional)</li>
                  <li>Account role (student, lecturer, or admin)</li>
                  <li>OAuth provider identifiers (Google or Microsoft account IDs)</li>
                </ul>
              </div>
              <div>
                <h3 class="font-semibold text-slate-700 mb-2">Academic Data</h3>
                <ul class="list-disc list-inside text-slate-600 space-y-1 ml-2">
                  <li>Course enrolment records</li>
                  <li>Assignment submissions and uploaded files</li>
                  <li>Quiz attempts, answers, and scores</li>
                  <li>Grades and academic progress data</li>
                </ul>
              </div>
              <div>
                <h3 class="font-semibold text-slate-700 mb-2">Usage Data</h3>
                <ul class="list-disc list-inside text-slate-600 space-y-1 ml-2">
                  <li>Login timestamps and IP addresses (for audit/security purposes)</li>
                  <li>Browser type and user agent</li>
                  <li>Notification interaction history</li>
                </ul>
              </div>
            </div>
          </section>

          <hr class="border-slate-100" />

          <!-- How We Use Your Data -->
          <section>
            <h2 class="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText class="w-5 h-5 text-blue-600" />
              How We Use Your Data
            </h2>
            <ul class="list-disc list-inside text-slate-600 space-y-2 ml-2">
              <li><strong>Course Management:</strong> To manage enrolments, deliver course content, and track academic progress.</li>
              <li><strong>Authentication:</strong> To verify your identity and secure access to your account.</li>
              <li><strong>Communication:</strong> To send notifications about assignments, quizzes, deadlines, and lecturer guidance.</li>
              <li><strong>AI-Powered Study Tools:</strong> To generate summaries, flashcards, practice quizzes, and provide study assistance using uploaded course materials.</li>
              <li><strong>Grading:</strong> To automatically grade quiz answers (MCQ and short-answer) and manage assignment submissions.</li>
              <li><strong>Security &amp; Audit:</strong> To log critical actions (login, uploads, grade changes) for system integrity and abuse prevention.</li>
            </ul>
          </section>

          <hr class="border-slate-100" />

          <!-- AI-Specific Privacy -->
          <section>
            <h2 class="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Brain class="w-5 h-5 text-blue-600" />
              AI-Specific Privacy Disclosures
            </h2>
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-3">
              <p class="text-slate-700 leading-relaxed">
                PAU LMS uses the <strong>Google Gemini API</strong> to provide AI-powered study assistance. Here is how your data
                is handled during AI processing:
              </p>
              <ul class="list-disc list-inside text-slate-600 space-y-2 ml-2">
                <li>
                  <strong>Temporary Processing Only:</strong> Uploaded documents and course materials are sent to the Google Gemini API
                  solely for the duration of the current request. They are <strong>not stored permanently</strong> by Google Gemini.
                </li>
                <li>
                  <strong>No Model Training:</strong> Your academic content is not used to train Google's AI models.
                  The Gemini API processes your request and discards the data after generating a response.
                </li>
                <li>
                  <strong>What Is Sent:</strong> When you use AI features (summaries, flashcards, quizzes, chat), the text content
                  of the relevant document(s) and/or your chat messages are sent to the API. Only the specific materials you select
                  or upload are processed.
                </li>
                <li>
                  <strong>No Permanent Copies:</strong> The server does not retain temporary copies of files processed by AI
                  beyond the duration of the request. File buffers are discarded after processing.
                </li>
              </ul>
            </div>
          </section>

          <hr class="border-slate-100" />

          <!-- Data Security -->
          <section>
            <h2 class="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Lock class="w-5 h-5 text-blue-600" />
              Data Security
            </h2>
            <div class="grid sm:grid-cols-2 gap-4">
              <div class="bg-slate-50 rounded-xl p-5">
                <h3 class="font-semibold text-slate-700 mb-2">Encryption In Transit</h3>
                <p class="text-slate-600 text-sm">All data transmitted between your browser and our servers is encrypted using HTTPS (SSL/TLS).</p>
              </div>
              <div class="bg-slate-50 rounded-xl p-5">
                <h3 class="font-semibold text-slate-700 mb-2">Password Hashing</h3>
                <p class="text-slate-600 text-sm">Passwords are hashed using bcrypt with 12 salt rounds and are never stored in plain text.</p>
              </div>
              <div class="bg-slate-50 rounded-xl p-5">
                <h3 class="font-semibold text-slate-700 mb-2">Access Controls</h3>
                <p class="text-slate-600 text-sm">Role-Based Access Control (RBAC) ensures students, lecturers, and admins can only access data they are authorised to view.</p>
              </div>
              <div class="bg-slate-50 rounded-xl p-5">
                <h3 class="font-semibold text-slate-700 mb-2">Injection Prevention</h3>
                <p class="text-slate-600 text-sm">All user inputs are validated and sanitised against NoSQL injection, XSS, and other common attack vectors.</p>
              </div>
              <div class="bg-slate-50 rounded-xl p-5">
                <h3 class="font-semibold text-slate-700 mb-2">Rate Limiting</h3>
                <p class="text-slate-600 text-sm">Authentication and API endpoints are protected with rate limiting to prevent brute-force attacks and abuse.</p>
              </div>
              <div class="bg-slate-50 rounded-xl p-5">
                <h3 class="font-semibold text-slate-700 mb-2">Audit Logging</h3>
                <p class="text-slate-600 text-sm">Critical actions (login, uploads, grade changes, admin operations) are logged for traceability and security monitoring.</p>
              </div>
            </div>
          </section>

          <hr class="border-slate-100" />

          <!-- Third-Party Services -->
          <section>
            <h2 class="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Globe class="w-5 h-5 text-blue-600" />
              Third-Party Services
            </h2>
            <p class="text-slate-600 mb-4">PAU LMS integrates with the following third-party services, each governed by their own privacy policies:</p>
            <div class="space-y-3">
              <div class="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <span class="text-blue-600 font-bold text-xs">G</span>
                </div>
                <div>
                  <h4 class="font-semibold text-slate-700 text-sm">Google OAuth 2.0</h4>
                  <p class="text-slate-500 text-sm">Used for secure login. We receive your name and email from Google. No Google password is shared with us.</p>
                </div>
              </div>
              <div class="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <span class="text-blue-600 font-bold text-xs">M</span>
                </div>
                <div>
                  <h4 class="font-semibold text-slate-700 text-sm">Microsoft OAuth 2.0</h4>
                  <p class="text-slate-500 text-sm">Used for secure login. We receive your name and email from Microsoft. No Microsoft password is shared with us.</p>
                </div>
              </div>
              <div class="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <span class="text-blue-600 font-bold text-xs">C</span>
                </div>
                <div>
                  <h4 class="font-semibold text-slate-700 text-sm">Cloudinary</h4>
                  <p class="text-slate-500 text-sm">Used for secure file storage. Uploaded course materials and assignment files are stored on Cloudinary's infrastructure.</p>
                </div>
              </div>
              <div class="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <span class="text-blue-600 font-bold text-xs">AI</span>
                </div>
                <div>
                  <h4 class="font-semibold text-slate-700 text-sm">Google Gemini API</h4>
                  <p class="text-slate-500 text-sm">Used for AI-powered study features. Document content is processed temporarily and not retained.</p>
                </div>
              </div>
            </div>
          </section>

          <hr class="border-slate-100" />

          <!-- Cookies & Token Usage -->
          <section>
            <h2 class="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Key class="w-5 h-5 text-blue-600" />
              Cookies &amp; Token Usage
            </h2>
            <p class="text-slate-600 leading-relaxed">
              PAU LMS does not use traditional cookies for session management. Instead, we use <strong>JSON Web Tokens (JWT)</strong>
              stored in your browser's <code class="bg-slate-100 px-1.5 py-0.5 rounded text-sm">localStorage</code>.
              This token is used to authenticate your requests and expires after 7 days. You can log out at any time, which removes
              the token from your browser.
            </p>
          </section>

          <hr class="border-slate-100" />

          <!-- Your Rights -->
          <section>
            <h2 class="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <UserCheck class="w-5 h-5 text-blue-600" />
              Your Rights
            </h2>
            <p class="text-slate-600 mb-4">You have the following rights regarding your personal data:</p>
            <ul class="list-disc list-inside text-slate-600 space-y-2 ml-2">
              <li><strong>Access:</strong> You can view your personal data through your profile and dashboard.</li>
              <li><strong>Correction:</strong> You can update your display name and profile information at any time.</li>
              <li><strong>Deletion:</strong> You may request the deletion of your account and associated data by contacting the system administrator.</li>
              <li><strong>Data Portability:</strong> You may request a copy of your personal data in a machine-readable format.</li>
            </ul>
            <p class="text-slate-600 mt-4">
              For any privacy-related requests, please contact us at
              <a href="mailto:admissions@pau.edu.ng" class="text-blue-600 hover:underline">admissions@pau.edu.ng</a>.
            </p>
          </section>

          <hr class="border-slate-100" />

          <!-- Changes to This Policy -->
          <section>
            <h2 class="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <RefreshCw class="w-5 h-5 text-blue-600" />
              Changes to This Policy
            </h2>
            <p class="text-slate-600 leading-relaxed">
              We may update this Privacy Policy from time to time. Any changes will be reflected on this page with an updated
              "Last updated" date. We encourage you to review this policy periodically to stay informed about how your data is being protected.
            </p>
          </section>

        </div>
      </div>

      <!-- Back to top -->
      <div class="text-center mt-8 mb-4">
        <button
          @click="scrollToTop"
          class="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowUp class="w-4 h-4" />
          Back to top
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  Shield,
  Database,
  FileText,
  Brain,
  Lock,
  Globe,
  Key,
  UserCheck,
  RefreshCw,
  ArrowLeft,
  ArrowUp,
} from 'lucide-vue-next';

const lastUpdated = 'July 2026';

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
</script>
