<template>
  <main class="flex-1 bg-slate-50 p-4 sm:p-6 lg:p-8 min-h-screen">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
      <p class="text-slate-500 mt-1">Manage users, courses, and view system statistics.</p>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex space-x-1 border-b border-slate-200 mb-8">
      <button 
        v-for="tab in ['Overview', 'Users', 'Courses']" 
        :key="tab"
        @click="activeTab = tab"
        class="px-5 py-3 text-sm font-medium border-b-2 transition-colors"
        :class="activeTab === tab ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'"
      >
        {{ tab }}
      </button>
    </div>

    <!-- Overview Tab -->
    <div v-if="activeTab === 'Overview'" class="space-y-6">
      <div v-if="loadingStats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="i in 6" :key="i" class="h-32 bg-white rounded-xl shadow-sm border border-slate-200 animate-pulse"></div>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500">Total Users</p>
            <p class="text-3xl font-bold text-slate-900 mt-2">{{ stats.totalUsers }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
            <Users class="w-6 h-6" />
          </div>
        </div>
        
        <div class="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500">Students</p>
            <p class="text-3xl font-bold text-slate-900 mt-2">{{ stats.students }}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
            <GraduationCap class="w-6 h-6" />
          </div>
        </div>
        
        <div class="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500">Lecturers</p>
            <p class="text-3xl font-bold text-slate-900 mt-2">{{ stats.lecturers }}</p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
            <BookOpen class="w-6 h-6" />
          </div>
        </div>
        
        <div class="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500">Total Courses</p>
            <p class="text-3xl font-bold text-slate-900 mt-2">{{ stats.courses }}</p>
          </div>
          <div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
            <Library class="w-6 h-6" />
          </div>
        </div>
        
        <div class="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500">Active Enrollments</p>
            <p class="text-3xl font-bold text-slate-900 mt-2">{{ stats.enrollments }}</p>
          </div>
          <div class="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
            <UserCheck class="w-6 h-6" />
          </div>
        </div>
        
        <div class="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500">System Admins</p>
            <p class="text-3xl font-bold text-slate-900 mt-2">{{ stats.admins }}</p>
          </div>
          <div class="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
            <Shield class="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>

    <!-- Users Tab -->
    <div v-if="activeTab === 'Users'" class="space-y-6">
      <div class="flex justify-between items-center">
        <div class="relative w-72">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            v-model="userSearchQuery" 
            type="text" 
            placeholder="Search users..." 
            class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          >
        </div>
        <button @click="showUserModal = true" class="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
          <UserPlus class="w-4 h-4" /> Add User
        </button>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm whitespace-nowrap">
            <thead class="bg-slate-50 text-slate-500">
              <tr>
                <th class="px-6 py-4 font-medium">Name</th>
                <th class="px-6 py-4 font-medium">Email</th>
                <th class="px-6 py-4 font-medium">Role</th>
                <th class="px-6 py-4 font-medium">Join Date</th>
                <th class="px-6 py-4 font-medium">Associated Courses</th>
                <th class="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-if="loadingUsers" v-for="i in 5" :key="i">
                <td colspan="6" class="px-6 py-4">
                  <div class="h-6 bg-slate-100 rounded animate-pulse w-full"></div>
                </td>
              </tr>
              <tr v-else-if="filteredUsers.length === 0">
                <td colspan="6" class="px-6 py-8 text-center text-slate-500">
                  No users found.
                </td>
              </tr>
              <tr v-for="user in filteredUsers" :key="user._id" class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase">
                      {{ user.name.substring(0, 2) }}
                    </div>
                    <span class="font-medium text-slate-900">{{ user.name }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 text-slate-600">{{ user.email }}</td>
                <td class="px-6 py-4">
                  <span class="px-2.5 py-1 rounded-full text-xs font-medium capitalize border"
                    :class="{
                      'bg-green-50 text-green-700 border-green-200': user.role === 'student',
                      'bg-purple-50 text-purple-700 border-purple-200': user.role === 'lecturer',
                      'bg-amber-50 text-amber-700 border-amber-200': user.role === 'admin'
                    }"
                  >
                    {{ user.role }}
                  </span>
                </td>
                <td class="px-6 py-4 text-slate-500">{{ new Date(user.createdAt).toLocaleDateString() }}</td>
                <td class="px-6 py-4">
                  <div class="flex flex-wrap gap-1 max-w-xs">
                    <span v-if="user.activeCourses && user.activeCourses.length === 0" class="text-slate-400 italic text-xs">None</span>
                    <span 
                      v-for="c in user.activeCourses?.slice(0, 3)" 
                      :key="c._id" 
                      class="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200"
                      :title="c.title"
                    >
                      {{ c.code }}
                    </span>
                    <span v-if="user.activeCourses?.length > 3" class="px-2 py-0.5 bg-slate-50 text-slate-500 text-xs rounded border border-slate-200">
                      +{{ user.activeCourses.length - 3 }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 text-right">
                  <button 
                    @click="deleteUser(user._id)" 
                    class="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Delete User"
                    :disabled="user._id === auth.user._id"
                    :class="{ 'opacity-50 cursor-not-allowed': user._id === auth.user._id }"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Courses Tab -->
    <div v-if="activeTab === 'Courses'" class="space-y-6">
      <div class="flex justify-between items-center">
        <div class="relative w-72">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            v-model="courseSearchQuery" 
            type="text" 
            placeholder="Search courses..." 
            class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          >
        </div>
        <button @click="openCourseModal(null)" class="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
          <Plus class="w-4 h-4" /> Add Course
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div v-if="loadingCourses" v-for="i in 6" :key="i" class="h-48 bg-white border border-slate-200 rounded-xl shadow-sm animate-pulse"></div>
        <div v-else-if="filteredCourses.length === 0" class="col-span-full py-12 text-center text-slate-500">
          No courses found.
        </div>
        
        <div 
          v-for="course in filteredCourses" 
          :key="course._id" 
          class="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden"
        >
          <div class="h-2 w-full" :style="{ backgroundColor: course.color || '#4f46e5' }"></div>
          <div class="p-5 flex-1 flex flex-col">
            <div class="flex justify-between items-start mb-2">
              <span class="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded">{{ course.code }}</span>
              <div class="flex gap-1">
                <button @click="openCourseModal(course)" class="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors" title="Edit Course">
                  <Edit2 class="w-4 h-4" />
                </button>
                <button @click="deleteCourse(course._id)" class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete Course">
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 class="font-bold text-slate-900 text-lg mb-1 line-clamp-1" :title="course.title">{{ course.title }}</h3>
            <p class="text-sm text-slate-500 mb-4 line-clamp-2">{{ course.description || 'No description provided.' }}</p>
            
            <div class="mt-auto space-y-2">
              <div class="flex items-center gap-2 text-sm text-slate-600">
                <Users class="w-4 h-4 text-slate-400" />
                <span>{{ course.lecturers?.length || 0 }} Lecturers assigned</span>
              </div>
              <div class="flex items-center gap-2 text-sm text-slate-600">
                <Building class="w-4 h-4 text-slate-400" />
                <span>{{ course.dept }} (Year {{ course.year }})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->

    <!-- Add User Modal -->
    <div v-if="showUserModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div class="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-slate-200">
        <div class="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 class="text-xl font-bold text-slate-900">Add New User</h2>
          <button @click="showUserModal = false" class="text-slate-400 hover:text-slate-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        <form @submit.prevent="createUser" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input v-model="userForm.name" required type="text" class="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input v-model="userForm.email" required type="email" class="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input v-model="userForm.password" required type="password" minlength="6" class="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select v-model="userForm.role" required class="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white">
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
              <option value="admin">System Admin</option>
            </select>
          </div>
          <div class="pt-4 flex justify-end gap-3">
            <button type="button" @click="showUserModal = false" class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
            <button type="submit" :disabled="submitting" class="px-4 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
              <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" />
              Save User
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Add/Edit Course Modal -->
    <div v-if="showCourseModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div class="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
        <div class="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h2 class="text-xl font-bold text-slate-900">{{ courseForm._id ? 'Edit Course' : 'Add New Course' }}</h2>
          <button @click="showCourseModal = false" class="text-slate-400 hover:text-slate-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="p-6 overflow-y-auto flex-1">
          <form @submit.prevent="saveCourse" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Course Code</label>
                <input v-model="courseForm.code" required type="text" placeholder="e.g. CSC401" class="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none uppercase">
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input v-model="courseForm.title" required type="text" placeholder="e.g. Artificial Intelligence" class="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none">
              </div>
            </div>
            
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <input v-model="courseForm.dept" required type="text" class="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none">
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Year</label>
                <select v-model="courseForm.year" required class="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white">
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                  <option value="5">Year 5</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Credits</label>
                <input v-model="courseForm.credits" required type="number" min="1" max="6" class="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none">
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea v-model="courseForm.description" rows="3" class="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none"></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Theme Color</label>
              <div class="flex items-center gap-3">
                <input v-model="courseForm.color" type="color" class="h-10 w-10 p-1 border border-slate-200 rounded bg-white cursor-pointer">
                <span class="text-sm text-slate-500 uppercase">{{ courseForm.color }}</span>
              </div>
            </div>

            <!-- Lecturers Assignment -->
            <div class="border-t border-slate-200 pt-4 mt-6">
              <label class="block text-sm font-medium text-slate-700 mb-2">Assign Lecturers</label>
              <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                <div v-if="allLecturers.length === 0" class="text-sm text-slate-500 italic">No lecturers found in the system.</div>
                <div v-for="lecturer in allLecturers" :key="lecturer._id" class="flex items-center mb-2 last:mb-0">
                  <input 
                    type="checkbox" 
                    :id="'lec-'+lecturer._id"
                    :value="lecturer._id"
                    v-model="courseForm.lecturers"
                    class="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                  >
                  <label :for="'lec-'+lecturer._id" class="ml-3 text-sm text-slate-700 cursor-pointer select-none">
                    <span class="font-medium">{{ lecturer.name }}</span> <span class="text-slate-500 text-xs ml-1">({{ lecturer.email }})</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div class="pt-6 flex justify-end gap-3 border-t border-slate-100">
              <button type="button" @click="showCourseModal = false" class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
              <button type="submit" :disabled="submitting" class="px-4 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
                <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" />
                {{ courseForm._id ? 'Update Course' : 'Create Course' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { api } from '@/api/client.js';
import { Users, GraduationCap, BookOpen, Library, UserCheck, Shield, Search, UserPlus, Plus, Trash2, Edit2, X, Loader2, Building } from 'lucide-vue-next';

const auth = useAuthStore();
const router = useRouter();
const activeTab = ref('Overview');

// Data
const stats = ref({});
const users = ref([]);
const courses = ref([]);
const loadingStats = ref(true);
const loadingUsers = ref(true);
const loadingCourses = ref(true);
const submitting = ref(false);

// Search
const userSearchQuery = ref('');
const courseSearchQuery = ref('');

// Modals
const showUserModal = ref(false);
const showCourseModal = ref(false);

const userForm = ref({ name: '', email: '', password: '', role: 'student' });
const courseForm = ref({ code: '', title: '', dept: '', year: '1', credits: 3, description: '', color: '#4f46e5', lecturers: [] });

// Computed
const filteredUsers = computed(() => {
  if (!userSearchQuery.value) return users.value;
  const q = userSearchQuery.value.toLowerCase();
  return users.value.filter(u => 
    u.name.toLowerCase().includes(q) || 
    u.email.toLowerCase().includes(q) || 
    u.role.includes(q)
  );
});

const filteredCourses = computed(() => {
  if (!courseSearchQuery.value) return courses.value;
  const q = courseSearchQuery.value.toLowerCase();
  return courses.value.filter(c => 
    c.code.toLowerCase().includes(q) || 
    c.title.toLowerCase().includes(q) || 
    c.dept.toLowerCase().includes(q)
  );
});

const allLecturers = computed(() => users.value.filter(u => u.role === 'lecturer'));

// Fetch Data
const fetchStats = async () => {
  try {
    const data = await api.get('/api/admin/stats');
    stats.value = data.stats;
  } catch (err) { console.error(err); } finally { loadingStats.value = false; }
};

const fetchUsers = async () => {
  try {
    const data = await api.get('/api/admin/users');
    users.value = data.users;
  } catch (err) { console.error(err); } finally { loadingUsers.value = false; }
};

const fetchCourses = async () => {
  try {
    const data = await api.get('/api/admin/courses');
    courses.value = data.courses;
  } catch (err) { console.error(err); } finally { loadingCourses.value = false; }
};

onMounted(() => {
  if (auth.user?.role !== 'admin') {
    router.push('/dashboard/home');
    return;
  }
  fetchStats();
  fetchUsers();
  fetchCourses();
});

// Actions
const createUser = async () => {
  if (submitting.value) return;
  submitting.value = true;
  try {
    await api.post('/api/admin/users', userForm.value);
    showUserModal.value = false;
    userForm.value = { name: '', email: '', password: '', role: 'student' };
    fetchUsers();
    fetchStats();
  } catch (err) {
    alert(err.message || 'Failed to create user');
    console.error(err);
  } finally {
    submitting.value = false;
  }
};

const deleteUser = async (id) => {
  if (!confirm('Are you sure you want to permanently delete this user? All their submissions and enrollments will be lost.')) return;
  try {
    await api.delete(`/api/admin/users/${id}`);
    fetchUsers();
    fetchStats();
  } catch (err) {
    alert(err.message || 'Failed to delete user');
    console.error(err);
  }
};

const openCourseModal = (course = null) => {
  if (course) {
    courseForm.value = { 
      _id: course._id,
      code: course.code, 
      title: course.title, 
      dept: course.dept, 
      year: course.year, 
      credits: course.credits, 
      description: course.description || '', 
      color: course.color || '#4f46e5',
      lecturers: course.lecturers ? course.lecturers.map(l => l._id) : []
    };
  } else {
    courseForm.value = { code: '', title: '', dept: '', year: '1', credits: 3, description: '', color: '#4f46e5', lecturers: [] };
  }
  showCourseModal.value = true;
};

const saveCourse = async () => {
  if (submitting.value) return;
  submitting.value = true;
  const isEditing = !!courseForm.value._id;
  const url = `/api/admin/courses${isEditing ? `/${courseForm.value._id}` : ''}`;
  
  try {
    if (isEditing) {
      await api.patch(url.replace('patch', 'put'), courseForm.value, { method: 'PUT' });
    } else {
      await api.post(url, courseForm.value);
    }
    showCourseModal.value = false;
    fetchCourses();
    if (!isEditing) fetchStats();
  } catch (err) {
    alert(err.message || 'Failed to save course');
    console.error(err);
  } finally {
    submitting.value = false;
  }
};

const deleteCourse = async (id) => {
  if (!confirm('Are you sure you want to permanently delete this course? All associated enrollments and content will be affected.')) return;
  try {
    await api.delete(`/api/admin/courses/${id}`);
    fetchCourses();
    fetchStats();
  } catch (err) {
    alert(err.message || 'Failed to delete course');
    console.error(err);
  }
};
</script>
