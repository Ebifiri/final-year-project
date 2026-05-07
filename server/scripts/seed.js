/**
 * Seed script — populates the Course collection from the frontend courses.js data.
 *
 * Usage (from project root):
 *   node server/scripts/seed.js
 *
 * Make sure server/.env exists with a valid MONGODB_URI before running.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });
import mongoose from 'mongoose';
import Course from '../models/Course.js';

const courses = [
  // SST
  { code: 'CSC 111', title: 'Introduction to Computer Science',           dept: 'School of Science & Tech (SST)', year: 'Year 1 Semester 2', credits: 3, color: 'bg-blue-500',    description: 'Foundations of computing, problem solving, and algorithmic thinking.' },
  { code: 'MTH 112', title: 'Calculus II',                                dept: 'School of Science & Tech (SST)', year: 'Year 1 Semester 2', credits: 3, color: 'bg-blue-500',    description: 'Integration techniques, sequences, series, and multivariable calculus.' },
  { code: 'CSC 212', title: 'Data Structures & Algorithms',               dept: 'School of Science & Tech (SST)', year: 'Year 2 Semester 2', credits: 3, color: 'bg-blue-600',    description: 'Arrays, linked lists, trees, graphs, sorting and searching algorithms.' },
  { code: 'EEE 214', title: 'Digital Electronics',                        dept: 'School of Science & Tech (SST)', year: 'Year 2 Semester 2', credits: 3, color: 'bg-blue-600',    description: 'Boolean algebra, logic gates, combinational and sequential circuits.' },
  { code: 'CSC 312', title: 'Operating Systems',                          dept: 'School of Science & Tech (SST)', year: 'Year 3 Semester 2', credits: 3, color: 'bg-blue-700',    description: 'Process management, memory, file systems, and concurrency.' },
  { code: 'CSC 314', title: 'Database Systems',                           dept: 'School of Science & Tech (SST)', year: 'Year 3 Semester 2', credits: 3, color: 'bg-blue-700',    description: 'Relational models, SQL, normalisation, and transaction management.' },
  { code: 'CSC 412', title: 'Computer Networks',                          dept: 'School of Science & Tech (SST)', year: 'Year 4 Semester 2', credits: 3, color: 'bg-indigo-600',  description: 'TCP/IP stack, routing, switching, and network security fundamentals.' },
  { code: 'CSC 414', title: 'Software Engineering',                       dept: 'School of Science & Tech (SST)', year: 'Year 4 Semester 2', credits: 3, color: 'bg-indigo-600',  description: 'SDLC models, requirements, design patterns, testing, and DevOps.' },
  { code: 'CYB 201', title: 'Cybersecurity Fundamentals',                 dept: 'School of Science & Tech (SST)', year: 'Year 4 Semester 2', credits: 3, color: 'bg-rose-500',    description: 'Network security, cryptography, ethical hacking, and cyber law.' },
  { code: 'CSC 512', title: 'Artificial Intelligence',                    dept: 'School of Science & Tech (SST)', year: 'Year 5 Semester 2', credits: 3, color: 'bg-violet-600',  description: 'Search algorithms, machine learning, neural networks, and NLP.' },
  { code: 'CSC 514', title: 'Cloud Computing',                            dept: 'School of Science & Tech (SST)', year: 'Year 5 Semester 2', credits: 3, color: 'bg-violet-600',  description: 'IaaS, PaaS, SaaS, containerisation, Kubernetes, and cloud security.' },

  // Film & Multimedia
  { code: 'FMS 112', title: 'Introduction to Film Studies',               dept: 'Film and Multimedia Studies',    year: 'Year 1 Semester 2', credits: 3, color: 'bg-purple-500',  description: 'Film language, genres, history, and critical analysis.' },
  { code: 'FMS 212', title: 'Cinematography Techniques',                  dept: 'Film and Multimedia Studies',    year: 'Year 2 Semester 2', credits: 3, color: 'bg-purple-600',  description: 'Camera work, lighting, composition, and visual storytelling.' },
  { code: 'FMS 204', title: 'Digital Media Production',                   dept: 'Film and Multimedia Studies',    year: 'Year 2 Semester 2', credits: 3, color: 'bg-purple-600',  description: 'End-to-end digital video production and post-production workflows.' },
  { code: 'FMS 312', title: 'Screenwriting & Directing',                  dept: 'Film and Multimedia Studies',    year: 'Year 3 Semester 2', credits: 3, color: 'bg-fuchsia-600', description: 'Script development, narrative structure, and directing for camera.' },

  // Strategic Communication
  { code: 'STR 101', title: 'Introduction to Strategic Communication',    dept: 'Strategic Communication',        year: 'Year 1 Semester 2', credits: 3, color: 'bg-emerald-500', description: 'Principles of persuasion, audience analysis, and message design.' },

  // MassComm
  { code: 'MCM 112', title: 'Principles of Mass Communication',           dept: 'School of Media & Comm (MassComm)', year: 'Year 1 Semester 2', credits: 3, color: 'bg-teal-500', description: 'Overview of media systems, mass communication theories and effects.' },
  { code: 'MCM 212', title: 'Broadcast Journalism',                       dept: 'School of Media & Comm (MassComm)', year: 'Year 2 Semester 2', credits: 3, color: 'bg-teal-600', description: 'TV and radio reporting, scriptwriting, and production for news.' },
  { code: 'MCM 302', title: 'Media Law & Ethics',                         dept: 'School of Media & Comm (MassComm)', year: 'Year 3 Semester 2', credits: 3, color: 'bg-teal-600', description: 'Legal frameworks, press freedom, defamation, and media ethics.' },
  { code: 'MCM 412', title: 'Digital Journalism',                         dept: 'School of Media & Comm (MassComm)', year: 'Year 4 Semester 2', credits: 3, color: 'bg-teal-700', description: 'Online journalism, data storytelling, podcasting, and social media.' },

  // SMSS
  { code: 'BUS 112', title: 'Principles of Management',                   dept: 'School of Mgt & Social Sci (SMSS)', year: 'Year 1 Semester 2', credits: 3, color: 'bg-blue-500', description: 'Planning, organising, leading, and controlling in organisations.' },
  { code: 'BUS 212', title: 'Organisational Behaviour',                   dept: 'School of Mgt & Social Sci (SMSS)', year: 'Year 2 Semester 2', credits: 3, color: 'bg-sky-600',  description: 'Group dynamics, motivation, leadership, and organisational culture.' },
  { code: 'BUS 302', title: 'Business Ethics & Law',                      dept: 'School of Mgt & Social Sci (SMSS)', year: 'Year 3 Semester 2', credits: 3, color: 'bg-sky-600',  description: 'Ethical frameworks, corporate governance, and Nigerian business law.' },
  { code: 'BUS 412', title: 'Strategic Management',                       dept: 'School of Mgt & Social Sci (SMSS)', year: 'Year 4 Semester 2', credits: 3, color: 'bg-sky-700',  description: 'Competitive analysis, corporate strategy formulation and execution.' },

  // ISMS
  { code: 'ISM 112', title: 'Information Systems Fundamentals',           dept: 'ISMS', year: 'Year 1 Semester 2', credits: 3, color: 'bg-amber-500', description: 'IS concepts, enterprise systems, and digital transformation.' },
  { code: 'ISM 212', title: 'Systems Analysis & Design',                  dept: 'ISMS', year: 'Year 2 Semester 2', credits: 3, color: 'bg-amber-600', description: 'Requirements elicitation, UML, prototyping, and system design.' },
  { code: 'DAT 401', title: 'Advanced Data Analytics',                    dept: 'ISMS', year: 'Year 3 Semester 2', credits: 3, color: 'bg-amber-600', description: 'Statistical modelling, Python for data, and business intelligence.' },
  { code: 'ISM 412', title: 'IT Project Management',                      dept: 'ISMS', year: 'Year 4 Semester 2', credits: 3, color: 'bg-amber-700', description: 'PMBOK, Agile, risk management, and IT programme governance.' },

  // IoH
  { code: 'HUM 112', title: 'Introduction to Philosophy',                 dept: 'Institute of Humanities (IoH)', year: 'Year 1 Semester 2', credits: 3, color: 'bg-rose-400', description: 'Major philosophical traditions, logic, ethics, and metaphysics.' },
  { code: 'HUM 212', title: 'African Literature',                         dept: 'Institute of Humanities (IoH)', year: 'Year 2 Semester 2', credits: 3, color: 'bg-rose-500', description: 'Post-colonial fiction, poetry, and drama across sub-Saharan Africa.' },
  { code: 'HUM 312', title: 'Cross-Cultural Communication',               dept: 'Institute of Humanities (IoH)', year: 'Year 3 Semester 2', credits: 3, color: 'bg-rose-600', description: 'Cultural dimensions, intercultural competence, and global dialogue.' },

  // Post Graduate
  { code: 'PGD-DS',  title: 'MSc Data Science',                          dept: 'Post Graduate Studies', year: 'MSc-Data Science',    credits: 6, color: 'bg-slate-700', description: 'Machine learning, big data engineering, and applied statistics.' },
  { code: 'PGD-EC',  title: 'MSc Economics',                             dept: 'Post Graduate Studies', year: 'MSc-Economics',       credits: 6, color: 'bg-slate-700', description: 'Microeconomics, macroeconomics, econometrics, and policy analysis.' },
  { code: 'PGD-FP',  title: 'MSc Film Production',                       dept: 'Post Graduate Studies', year: 'MSc-Film Production', credits: 6, color: 'bg-slate-700', description: 'Advanced film production, industry practice, and research methods.' },

  // CDP
  { code: 'CDP-CF1', title: 'Career Foundation Programme I',              dept: 'Continuous Dev. Program (CDP)', year: 'Career Foundation Programme I',  credits: 2, color: 'bg-green-600', description: 'Self-discovery, personal brand, and professional communications.' },
  { code: 'CDP-CF2', title: 'Career Foundation Programme II',             dept: 'Continuous Dev. Program (CDP)', year: 'Career Foundation Programme II', credits: 2, color: 'bg-green-600', description: 'Job search strategies, networking, CV writing, and interview prep.' },
  { code: 'CDP-IRP', title: 'Industry Readiness Programme',               dept: 'Continuous Dev. Program (CDP)', year: 'Industry Readiness Programme 300 Level', credits: 2, color: 'bg-green-700', description: 'Workplace skills, entrepreneurship, and industry immersion.' },

  // Summer
  { code: 'SUM-101', title: 'Summer Business Bootcamp',                   dept: 'Summer Programs', year: '2024/2025 Session', credits: 2, color: 'bg-orange-500', description: 'Intensive business skills workshop for all year groups.' },
  { code: 'SUM-102', title: 'Summer Tech & Innovation',                   dept: 'Summer Programs', year: '2024/2025 Session', credits: 2, color: 'bg-orange-500', description: 'Hackathon-style projects, design thinking, and startup fundamentals.' },

  // Professional Education
  { code: 'PE-2025', title: 'Professional Education Cohort 2025',         dept: 'Professional Education', year: '2025 Set', credits: 4, color: 'bg-cyan-600', description: 'Executive and continuing professional education programme for the 2025 cohort.' },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Drop existing courses and re-insert
    await Course.deleteMany({});
    console.log('🗑  Cleared existing courses');

    const inserted = await Course.insertMany(courses);
    console.log(`🌱 Seeded ${inserted.length} courses`);

    await mongoose.disconnect();
    console.log('✅ Done — disconnected');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
