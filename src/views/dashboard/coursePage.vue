<template>
  <main class="flex-1 bg-slate-50">

    <!-- Course Hero Banner Loading Skeleton -->
    <div v-if="loading" class="relative overflow-hidden px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 pb-6 sm:pb-8 bg-slate-200 animate-pulse">
      <div class="relative max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div class="w-full">
          <div class="w-24 h-4 bg-slate-300/60 rounded mb-2"></div>
          <div class="w-2/3 h-8 bg-slate-300/60 rounded"></div>
        </div>
        <div class="w-24 h-8 bg-slate-300/60 rounded-xl self-start sm:mt-6"></div>
      </div>
    </div>

    <!-- Course Hero Banner -->
    <div v-else-if="course" :class="['relative overflow-hidden px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 pb-6 sm:pb-8', course.color]">
      <div class="absolute inset-0 bg-linear-to-br from-black/20 to-black/50"></div>
      <div class="relative max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div>
          <span class="inline-block text-xs font-bold text-white/70 uppercase tracking-widest mb-2">
            {{ course.dept }} &bull; {{ course.year }}
          </span>
          <h1 class="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white leading-snug">
            {{ course.code }}: {{ course.title }}
          </h1>
        </div>

        <!-- Unenroll button (only when enrolled) -->
        <button
          v-if="enrolled"
          class="flex-shrink-0 self-start flex items-center gap-1.5 px-3 sm:px-4 py-2 mt-0 sm:mt-6 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl border border-white/30 transition-colors backdrop-blur-sm"
          :disabled="enrolling"
          @click="handleUnenroll"
        >
          <UserMinus class="w-3.5 h-3.5" />
          {{ enrolling ? 'Unenrolling…' : 'Unenroll' }}
        </button>
      </div>
    </div>

    <!-- Not found -->
    <div v-else-if="!loading && course === null" class="flex flex-col items-center justify-center py-24 text-center">
      <p class="font-semibold text-slate-700">Course not found</p>
      <RouterLink to="/courses" class="mt-3 text-sm text-blue-600 hover:underline">← Back to catalogue</RouterLink>
    </div>

    <!-- Page body -->
    <div v-if="course" class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 flex flex-col gap-8 sm:gap-10">

      <!-- ── NOT LOGGED IN GATE ──────────────────────────────────── -->
      <div v-if="!auth.isLoggedIn" class="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <LogIn class="w-7 h-7 text-slate-400" />
        </div>
        <h2 class="text-lg font-bold text-slate-900">Log in to access this course</h2>
        <p class="text-sm text-slate-500 mt-2 max-w-sm">
          You need to be logged in to view or enroll in
          <span class="font-semibold">{{ course.code }}: {{ course.title }}</span>.
        </p>
        <RouterLink
          :to="{ name: 'login', query: { redirect: '/courses/' + course.code } }"
          class="mt-6 flex items-center gap-2 px-6 py-3 bg-[#1e293b] hover:bg-slate-700 text-white font-bold rounded-xl transition-colors shadow-md"
        >
          <LogIn class="w-4 h-4" />
          Log in to continue
        </RouterLink>
      </div>

      <!-- ── NOT ENROLLED GATE (students only) ─────────────────────── -->
      <div
        v-else-if="!enrolled && auth.user?.role === 'student'"
        class="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm"
      >
        <div :class="['w-16 h-16 rounded-2xl flex items-center justify-center mb-4', course.color]">
          <BookLock class="w-7 h-7 text-white" />
        </div>
        <h2 class="text-lg font-bold text-slate-900">You are not enrolled in this course</h2>
        <p class="text-sm text-slate-500 mt-2 max-w-sm">
          Enroll to access lecture slides, lab resources, assignments and more for
          <span class="font-semibold">{{ course.code }}: {{ course.title }}</span>.
        </p>
        <button
          class="mt-6 flex items-center gap-2 px-6 py-3 bg-[#1e293b] hover:bg-slate-700 text-white font-bold rounded-xl transition-colors shadow-md disabled:opacity-60"
          :disabled="enrolling"
          @click="handleEnroll"
        >
          <Loader2 v-if="enrolling" class="w-4 h-4 animate-spin" />
          <BookOpen v-else class="w-4 h-4" />
          {{ enrolling ? 'Enrolling…' : 'Enrol in this course' }}
        </button>
      </div>

      <!-- ── COURSE CONTENT (enrolled students + lecturers/admin) ─── -->
      <section v-else>

        <!-- Loading skeleton -->
        <div v-if="contentLoading" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 items-start">
          <div
            v-for="i in 6"
            :key="i"
            class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-pulse flex flex-col"
          >
            <!-- Section header skeleton -->
            <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-slate-200"></div>
                <div class="space-y-1.5">
                  <div class="w-28 h-3.5 bg-slate-200 rounded"></div>
                  <div class="w-16 h-2.5 bg-slate-200 rounded"></div>
                </div>
              </div>
              <div class="w-4 h-4 bg-slate-200 rounded"></div>
            </div>
            <!-- Resources list skeleton -->
            <div class="divide-y divide-slate-50 px-5 py-2">
              <div v-for="j in 2" :key="j" class="flex items-center gap-3 py-3">
                <div class="w-7 h-7 rounded-lg bg-slate-200"></div>
                <div class="flex-grow space-y-1.5">
                  <div class="w-3/4 h-3 bg-slate-200 rounded"></div>
                  <div class="w-12 h-2.5 bg-slate-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <template v-else>
          <!-- Toolbar -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-5">
            <p class="text-sm text-slate-500">
              {{ sections.length }} section{{ sections.length !== 1 ? 's' : '' }}
              &bull;
              {{ totalResources }} resource{{ totalResources !== 1 ? 's' : '' }}
            </p>
            <div class="flex items-center gap-3">
              <!-- Add section button (lecturer/admin only) -->
              <button
                v-if="canManage"
                class="flex items-center gap-1.5 text-xs font-semibold text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-1.5 transition-colors"
                @click="showAddSection = true"
              >
                <Plus class="w-3.5 h-3.5" /> Add Section
              </button>
              <button
                class="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                @click="allExpanded = !allExpanded"
              >{{ allExpanded ? 'Collapse all' : 'Expand all' }}</button>
            </div>
          </div>

          <!-- Empty state -->
          <div v-if="!sections.length" class="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <FolderOpen class="w-10 h-10 text-slate-300 mb-3" />
            <p class="text-sm font-semibold text-slate-500">No content yet</p>
            <p v-if="canManage" class="text-xs text-slate-400 mt-1">Add a section to get started.</p>
          </div>

          <!-- Section cards grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 items-start">
            <div
              v-for="sec in sections"
              :key="sec._id"
              class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <!-- Section header -->
              <button
                class="w-full flex items-center justify-between px-5 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors"
                @click="toggleSection(sec._id)"
              >
                <div class="flex items-center gap-3">
                  <div :class="['w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', course.color]">
                    <component :is="sectionIcon(sec.type)" class="w-4 h-4 text-white" />
                  </div>
                  <div class="text-left">
                    <p class="text-sm font-bold text-slate-800">{{ sec.title }}</p>
                    <p class="text-[11px] text-slate-400">{{ sec.resources.length }} item{{ sec.resources.length !== 1 ? 's' : '' }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <!-- Add resource button (lecturer/admin only) -->
                  <span
                    v-if="canManage"
                    role="button"
                    tabindex="0"
                    class="p-1 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                    title="Add resource to this section"
                    @click.stop="openAddResource(sec)"
                    @keydown.enter.stop="openAddResource(sec)"
                  >
                    <PlusCircle class="w-4 h-4" />
                  </span>
                  <!-- Delete section button (lecturer/admin only) -->
                  <span
                    v-if="canManage"
                    role="button"
                    tabindex="0"
                    class="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    title="Delete this section"
                    @click.stop="confirmDelete('section', sec)"
                    @keydown.enter.stop="confirmDelete('section', sec)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </span>
                  <ChevronDown
                    :class="['w-4 h-4 text-slate-400 transition-transform flex-shrink-0', (expandedSections[sec._id] ?? allExpanded) ? 'rotate-180' : '']"
                  />
                </div>
              </button>

              <!-- Resources list -->
              <div v-show="expandedSections[sec._id] ?? allExpanded" class="divide-y divide-slate-50">
                <div
                  v-for="res in sec.resources"
                  :key="res._id"
                  :id="'resource-' + res._id"
                  :class="['flex items-center gap-2 px-3 sm:px-4 py-3 group transition-colors', cart.isSelected(res._id) ? 'bg-blue-50' : 'hover:bg-blue-50']"
                >
                  <!-- Select checkbox (downloadable resources only) -->
                  <button
                    v-if="isDownloadable(res)"
                    :class="[
                      'flex-shrink-0 w-5 h-5 rounded border-2 transition-all flex items-center justify-center',
                      cart.isSelected(res._id)
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-slate-300 opacity-0 group-hover:opacity-100 hover:border-blue-400'
                    ]"
                    :title="cart.isSelected(res._id) ? 'Remove from download cart' : 'Add to download cart'"
                    @click="cart.toggle(res)"
                  >
                    <svg v-if="cart.isSelected(res._id)" class="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                  <!-- Spacer for non-downloadable items -->
                  <div v-else class="flex-shrink-0 w-5" />

                  <!-- Clickable file/link area -->
                  <RouterLink
                    v-if="res.type === 'assignment' && res.assignmentRef"
                    :to="'/assignments/' + res.assignmentRef._id + '/submit'"
                    class="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div :class="['w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', getResourceMeta(res).bg]">
                      <component :is="getResourceMeta(res).icon" :class="['w-3.5 h-3.5', getResourceMeta(res).color]" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <span class="text-sm text-amber-600 group-hover:text-amber-800 group-hover:underline underline-offset-2 transition-colors leading-snug block truncate font-semibold">
                        {{ res.title }}
                      </span>
                      <span class="text-[10px] text-slate-400 mt-0.5 block">
                        Assignment &bull; {{ res.assignmentRef.totalPoints || 100 }} marks
                      </span>
                      <div v-if="res.assignmentRef.opensAt || res.assignmentRef.closesAt" class="mt-2 inline-flex items-center gap-2 bg-slate-100 border border-slate-200 rounded px-2.5 py-1.5">
                        <span class="text-sm font-extrabold text-slate-800">
                          <span v-if="res.assignmentRef.opensAt">Opens: {{ formatDateTime(res.assignmentRef.opensAt) }}</span>
                          <span v-if="res.assignmentRef.opensAt && res.assignmentRef.closesAt" class="mx-1.5 text-slate-400">&bull;</span>
                          <span v-if="res.assignmentRef.closesAt" :class="{'text-rose-600': new Date(res.assignmentRef.closesAt) < new Date()}">
                            Closes: {{ formatDateTime(res.assignmentRef.closesAt) }}
                          </span>
                        </span>
                      </div>
                      <p v-if="res.assignmentRef.description" class="text-[10px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{{ res.assignmentRef.description }}</p>
                    </div>
                  </RouterLink>

                  <RouterLink
                    v-else-if="res.type === 'quiz' && res.quizRef"
                    :to="'/quizzes/' + res.quizRef._id"
                    class="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div :class="['w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', getResourceMeta(res).bg]">
                      <component :is="getResourceMeta(res).icon" :class="['w-3.5 h-3.5', getResourceMeta(res).color]" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <span class="text-sm text-orange-600 group-hover:text-orange-800 group-hover:underline underline-offset-2 transition-colors leading-snug block truncate font-semibold">
                        {{ res.title }}
                      </span>
                      <span class="text-[10px] text-slate-400 mt-0.5 block">
                        Quiz &bull; {{ res.quizRef.durationMinutes || 20 }} mins
                      </span>
                      <div v-if="res.quizRef.opensAt || res.quizRef.closesAt" class="mt-2 inline-flex items-center gap-2 bg-slate-100 border border-slate-200 rounded px-2.5 py-1.5">
                        <span class="text-sm font-extrabold text-slate-800">
                          <span v-if="res.quizRef.opensAt">Opens: {{ formatDateTime(res.quizRef.opensAt) }}</span>
                          <span v-if="res.quizRef.opensAt && res.quizRef.closesAt" class="mx-1.5 text-slate-400">&bull;</span>
                          <span v-if="res.quizRef.closesAt" :class="{'text-rose-600': new Date(res.quizRef.closesAt) < new Date()}">
                            Closes: {{ formatDateTime(res.quizRef.closesAt) }}
                          </span>
                        </span>
                      </div>
                    </div>
                  </RouterLink>

                  <a
                    v-else
                    :href="res.fileUrl || res.externalUrl || '#'"
                    :target="res.fileUrl || res.externalUrl ? '_blank' : undefined"
                    rel="noopener noreferrer"
                    class="flex items-center gap-3 flex-1 min-w-0"
                    @click="res.fileUrl || res.externalUrl ? undefined : $event.preventDefault()"
                  >
                    <!-- Dynamic file-type icon -->
                    <div :class="['w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', getResourceMeta(res).bg]">
                      <component :is="getResourceMeta(res).icon" :class="['w-3.5 h-3.5', getResourceMeta(res).color]" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <span class="text-sm text-blue-600 group-hover:text-blue-800 group-hover:underline underline-offset-2 transition-colors leading-snug block truncate">
                        {{ res.title }}
                      </span>
                      <!-- Announcement body text -->
                      <p v-if="res.type === 'announcement' && res.description" class="text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-wrap">
                        {{ res.description }}
                      </p>
                      <span v-else class="text-[10px] text-slate-400 mt-0.5 block">
                        Uploaded {{ formatDate(res.createdAt) }}
                      </span>
                    </div>
                  </a>

                  <!-- Right-side actions -->
                  <div class="flex items-center gap-1 flex-shrink-0">
                    <RouterLink v-if="res.type === 'assignment' && res.assignmentRef" :to="'/assignments/' + res.assignmentRef._id + '/submit'" class="p-1 rounded hover:bg-amber-100 text-amber-500 hover:text-amber-600 transition-all animate-fade-in" :title="canManage ? 'View submissions' : 'Submit assignment'" @click.stop>
                      <Users v-if="canManage" class="w-3.5 h-3.5" />
                      <Upload v-else class="w-3.5 h-3.5" />
                    </RouterLink>
                    <AlertCircle v-else-if="res.type === 'assignment'" class="w-3.5 h-3.5 text-amber-500" />
                    <a v-else-if="res.externalUrl && !res.fileUrl" :href="res.externalUrl" target="_blank" rel="noopener noreferrer" class="p-1 rounded hover:bg-blue-100 text-slate-400 hover:text-blue-600 transition-all" title="Open link" @click.stop>
                      <ExternalLink class="w-3.5 h-3.5" />
                    </a>
                    <!-- AI Study button -->
                    <button
                      v-if="canAI(res)"
                      class="sm:opacity-0 sm:group-hover:opacity-100 p-1.5 sm:p-1 rounded hover:bg-violet-100 text-violet-500 sm:text-slate-300 hover:text-violet-600 transition-all"
                      title="AI Study Assistant"
                      @click.stop="openAI(res)"
                    >
                      <Sparkles class="w-3.5 h-3.5" />
                    </button>
                    <!-- Single download button -->
                    <button
                      v-if="isDownloadable(res)"
                      :class="[
                        'sm:opacity-0 sm:group-hover:opacity-100 p-1.5 sm:p-1 rounded hover:bg-blue-100 transition-all',
                        downloadingId === res._id ? 'text-blue-500 cursor-wait' : 'text-slate-300 hover:text-blue-600'
                      ]"
                      :disabled="downloadingId === res._id"
                      :title="downloadingId === res._id ? 'Downloading…' : 'Download'"
                      @click.stop="downloadSingle(res)"
                    >
                      <Loader2 v-if="downloadingId === res._id" class="w-3.5 h-3.5 animate-spin" />
                      <Download v-else class="w-3.5 h-3.5" />
                    </button>
                    <!-- Delete resource (lecturer/admin, visible on hover) -->
                    <button
                      v-if="canManage"
                      class="sm:opacity-0 sm:group-hover:opacity-100 p-1.5 sm:p-1 rounded hover:bg-red-50 text-red-400 sm:text-slate-300 hover:text-red-500 transition-all"
                      title="Delete resource"
                      @click.prevent="confirmDelete('resource', res)"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p v-if="!sec.resources.length" class="px-5 py-4 text-sm text-slate-400 italic">No resources yet.</p>
              </div>
            </div>
          </div>
        </template>
      </section>
    </div>

    <!-- ── ADD SECTION MODAL ──────────────────────────────────────── -->
    <Teleport to="body">
      <div
        v-if="showAddSection"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
        @click.self="showAddSection = false"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
          <h3 class="font-bold text-slate-800 mb-4 text-base">Add Section</h3>
          <div class="flex flex-col gap-3">
            <div>
              <label class="text-xs font-semibold text-slate-600 mb-1 block">Title</label>
              <input
                v-model="newSection.title"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="e.g. Week 1 – Introduction"
              />
            </div>
            <div>
              <label class="text-xs font-semibold text-slate-600 mb-1 block">Type</label>
              <select
                v-model="newSection.type"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="general">General</option>
                <option value="week">Week</option>
                <option value="module">Module</option>
                <option value="announcement">Announcement</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-5">
            <button class="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors" @click="showAddSection = false">Cancel</button>
            <button
              class="px-4 py-2 text-sm font-bold bg-[#1e293b] text-white rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-60"
              :disabled="savingSection || !newSection.title.trim()"
              @click="saveSection"
            >
              {{ savingSection ? 'Saving…' : 'Add Section' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── ADD RESOURCE MODAL ─────────────────────────────────────── -->
    <Teleport to="body">
      <div
        v-if="showAddResource"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
        @click.self="showAddResource = false"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
          <h3 class="font-bold text-slate-800 mb-1 text-base">Add Resource</h3>
          <p class="text-xs text-slate-400 mb-4">→ {{ activeSection?.title }}</p>
          <div class="flex flex-col gap-3">
            <div>
              <label class="text-xs font-semibold text-slate-600 mb-1 block">Title</label>
              <input
                v-model="newResource.title"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="e.g. Lecture Slides Week 1"
              />
            </div>
            <div>
              <label class="text-xs font-semibold text-slate-600 mb-1 block">Type</label>
              <select
                v-model="newResource.type"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="video">Video</option>
                <option value="link">Link</option>
                <option value="assignment">Assignment</option>
                <option value="quiz">Quiz</option>
                <option value="announcement">Announcement</option>
                <option value="other">File / Other</option>
              </select>
            </div>
            <!-- Assignment/Quiz date-time pickers -->
            <template v-if="newResource.type === 'assignment' || newResource.type === 'quiz'">
              <div class="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label class="text-xs font-semibold text-slate-600 mb-1 block">Opens At</label>
                  <input v-model="newResource.opensAt" type="datetime-local" class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label class="text-xs font-semibold text-slate-600 mb-1 block">Closes At</label>
                  <input v-model="newResource.closesAt" type="datetime-local" class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>
              
              <!-- Extra field for assignment marks -->
              <div v-if="newResource.type === 'assignment'" class="mb-3">
                <label class="text-xs font-semibold text-slate-600 mb-1 block">Total Marks / Points</label>
                <input v-model.number="newResource.totalPoints" type="number" min="1" class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="e.g. 100" />
              </div>

              <!-- Assignment description -->
              <div v-if="newResource.type === 'assignment'" class="mb-3">
                <label class="text-xs font-semibold text-slate-600 mb-1 block">Description</label>
                <textarea
                  v-model="newResource.description"
                  rows="3"
                  class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  placeholder="Describe the assignment requirements..."
                />
              </div>

              <!-- Quiz duration -->
              <div v-if="newResource.type === 'quiz'" class="mb-3">
                <label class="text-xs font-semibold text-slate-600 mb-1 block">Duration (minutes)</label>
                <input v-model.number="newResource.durationMinutes" type="number" min="1" max="300" class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="e.g. 15" />
              </div>

              <!-- Show correct answers checkbox -->
              <div v-if="newResource.type === 'quiz'" class="mb-3">
                <label class="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                  <input v-model="newResource.showCorrectAnswers" type="checkbox" class="rounded text-blue-600 focus:ring-blue-400" />
                  <span>Show correct answers to students after completion</span>
                </label>
              </div>

              <!-- Extra field for AI quiz generation -->
              <div v-if="newResource.type === 'quiz'" class="mb-3 border-t border-slate-100 pt-3">
                <label class="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                  <input v-model="newResource.generateAI" type="checkbox" class="rounded text-blue-600 focus:ring-blue-400" />
                  <span>Generate questions using AI</span>
                </label>

                <div v-if="newResource.generateAI" class="mt-3 space-y-3">
                  <div>
                    <label class="text-[11px] font-semibold text-slate-500 mb-1 block">Question Count</label>
                    <input v-model.number="newResource.questionCount" type="number" min="3" max="20" class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div>
                    <label class="text-[11px] font-semibold text-slate-500 mb-1 block">Upload Study Materials (PDF, Docx, Pptx)</label>
                    <input
                      type="file"
                      multiple
                      class="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 shadow-xs"
                      @change="onQuizFilesChange($event)"
                    />
                    <p class="text-[9px] text-slate-400 mt-1">Upload up to 10 files to base the quiz questions on.</p>
                  </div>
                </div>
              </div>
            </template>
            <!-- Announcement body textarea -->
            <div v-if="newResource.type === 'announcement'">
              <label class="text-xs font-semibold text-slate-600 mb-1 block">Message</label>
              <textarea
                v-model="newResource.description"
                rows="4"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                placeholder="Write your announcement here…"
              />
            </div>
            <!-- Link URL -->
            <div v-else-if="newResource.type === 'link'">
              <label class="text-xs font-semibold text-slate-600 mb-1 block">External URL</label>
              <input
                v-model="newResource.externalUrl"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="https://…"
              />
            </div>
            <!-- File upload -->
            <div v-else-if="newResource.type !== 'assignment' && !(newResource.type === 'quiz' && newResource.generateAI)">
              <label class="text-xs font-semibold text-slate-600 mb-1 block">File (optional)</label>
              <input
                type="file"
                class="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                @change="onFileChange($event)"
              />
              <p class="text-[10px] text-slate-400 mt-1">Any file type accepted &bull; max 100 MB for videos, 50 MB for other files</p>
              <p v-if="resourceUploadError" class="text-[11px] text-red-500 mt-1">{{ resourceUploadError }}</p>
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-5">
            <button class="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors" @click="showAddResource = false">Cancel</button>
            <button
              class="px-4 py-2 text-sm font-bold bg-[#1e293b] text-white rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-60"
              :disabled="savingResource || !newResource.title.trim() || !!resourceUploadError"
              @click="saveResource"
            >
              {{ savingResource ? 'Uploading…' : 'Add Resource' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── CONFIRM DELETE MODAL ──────────────────────────────────── -->
    <Teleport to="body">
      <div
        v-if="showConfirmDelete"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
        @click.self="showConfirmDelete = false"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <Trash2 class="w-4 h-4 text-red-500" />
            </div>
            <h3 class="font-bold text-slate-800 text-base">Confirm Delete</h3>
          </div>
          <p class="text-sm text-slate-600 mb-1">
            Are you sure you want to delete
            <span class="font-semibold">"{{ deleteTarget?.title }}"</span>?
          </p>
          <p v-if="deleteType === 'section'" class="text-xs text-red-500 mt-1">
            ⚠ This will also delete all resources inside this section.
          </p>
          <div class="flex justify-end gap-2 mt-5">
            <button
              class="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              @click="showConfirmDelete = false"
            >Cancel</button>
            <button
              class="px-4 py-2 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-60"
              :disabled="deleting"
              @click="executeDelete"
            >
              {{ deleting ? 'Deleting…' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- AI Study Assistant modal -->
    <AIStudyModal v-model="showAI" :resource="aiResource" />

    <!-- ── TOAST NOTIFICATION ──────────────────────────────────────── -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="translate-y-4 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-4 opacity-0"
      >
        <div
          v-if="toast.show"
          :class="[
            'fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border text-sm font-semibold whitespace-nowrap',
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          ]"
        >
          <Check v-if="toast.type === 'success'" class="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <AlertTriangle v-else class="w-4 h-4 text-red-500 flex-shrink-0" />
          {{ toast.message }}
        </div>
      </Transition>
    </Teleport>

  </main>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import {
  ChevronDown, BookOpen, Calendar, FileText,
  Link2, ClipboardList, Megaphone, AlertCircle,
  FlaskConical, Video, BookLock, UserMinus, Loader2, LogIn,
  Plus, PlusCircle, FolderOpen, ExternalLink, Trash2, Package,
  Presentation, FileSpreadsheet, FileCode2, FileImage, Music,
  Archive, Download, File, CheckSquare, Sparkles, Check, AlertTriangle,
  Users, Upload,
} from 'lucide-vue-next';
import AIStudyModal from '@/components/AIStudyModal.vue';
import { api }                   from '@/api/client.js';
import { useEnrollmentStore }    from '@/stores/enrollments.js';
import { useAuthStore }          from '@/stores/auth.js';
import { useDownloadCart }       from '@/stores/downloadCart.js';

const route           = useRoute();
const enrollmentStore = useEnrollmentStore();
const auth            = useAuthStore();
const cart            = useDownloadCart();

const code     = decodeURIComponent(route.params.code ?? '').toUpperCase();
const course   = ref(null);
const loading  = ref(true);
const enrolling = ref(false);

// ── Toast ──────────────────────────────────────────────────────────────────────
const toast = ref({ show: false, message: '', type: 'success' });
let toastTimer = null;
function showToast(message, type = 'success') {
  clearTimeout(toastTimer);
  toast.value = { show: true, message, type };
  toastTimer = setTimeout(() => { toast.value.show = false; }, 4000);
}

// ── Enrollment state ──────────────────────────────────────────────────────────
const enrolled = computed(() => enrollmentStore.isEnrolled(code));

// ── Access level ──────────────────────────────────────────────────────────────
const canManage = computed(() =>
  auth.isLoggedIn && ['lecturer', 'admin'].includes(auth.user?.role)
);

// ── Content is visible to enrolled students + any lecturer/admin ──────────────
const canViewContent = computed(() =>
  auth.isLoggedIn && (enrolled.value || canManage.value)
);

onMounted(async () => {
  // Fetch course details
  try {
    const data = await api.get(`/api/courses/${encodeURIComponent(code)}`);
    course.value = data.course;
  } catch {
    course.value = null;
  } finally {
    loading.value = false;
  }

  // Ensure enrollments are loaded
  if (auth.isLoggedIn && !enrollmentStore.enrollments.length) {
    await enrollmentStore.fetchEnrollments();
  }

  // Load sections + resources if user can view
  if (canViewContent.value) {
    await loadContent();
    scrollToHashResource();
  }
});

async function handleEnroll() {
  enrolling.value = true;
  await enrollmentStore.enroll(code);
  enrolling.value = false;
  // Load content after enroll
  await loadContent();
}

async function handleUnenroll() {
  enrolling.value = true;
  const enrollment = enrollmentStore.enrollments.find(e => e.course?.code === code);
  if (enrollment) await enrollmentStore.unenroll(enrollment._id);
  enrolling.value = false;
}

// ── Sections from API ─────────────────────────────────────────────────────────
const sections        = ref([]);
const contentLoading  = ref(false);

async function loadContent() {
  contentLoading.value = true;
  try {
    const data = await api.get(`/api/content/${encodeURIComponent(code)}`);
    sections.value = data.sections ?? [];
  } catch {
    sections.value = [];
  } finally {
    contentLoading.value = false;
  }
}

// ── Scroll to resource from notification deep-link ────────────────────────────
async function scrollToHashResource() {
  const hash = window.location.hash;
  if (!hash || !hash.startsWith('#resource-')) return;
  const resourceId = hash.replace('#resource-', '');

  // Expand the section that contains this resource
  for (const sec of sections.value) {
    const found = sec.resources?.find(r => r._id === resourceId);
    if (found) {
      expandedSections.value[sec._id] = true;
      break;
    }
  }

  await nextTick();
  const el = document.getElementById(`resource-${resourceId}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('resource-highlight');
    setTimeout(() => el.classList.remove('resource-highlight'), 2500);
  }
}

const totalResources = computed(() => sections.value.reduce((n, s) => n + (s.resources?.length ?? 0), 0));

// ── Expand / collapse ─────────────────────────────────────────────────────────
const allExpanded      = ref(true);
const expandedSections = ref({});

function toggleSection(id) {
  expandedSections.value[id] = !(expandedSections.value[id] ?? allExpanded.value);
}

// ── AI Study Assistant ────────────────────────────────────────────────────────
const AI_SUPPORTED = new Set([
  'application/pdf',
  'text/plain', 'text/html', 'text/csv', 'text/markdown',
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.ms-powerpoint',
]);
const showAI     = ref(false);
const aiResource = ref(null);
function openAI(res) { aiResource.value = res; showAI.value = true; }
function canAI(res)  { return !!res.fileUrl && !!res.mimeType && AI_SUPPORTED.has(res.mimeType); }

// ── Dynamic icon system ───────────────────────────────────────────────────────
// Section type → icon (used in section headers)
function sectionIcon(type) {
  return { general: Megaphone, week: Calendar, module: FileText, announcement: Megaphone }[type] ?? Calendar;
}


const MIME_ICONS = [
  // PowerPoint
  { test: m => m?.includes('presentationml') || m?.includes('ms-powerpoint'),
    meta: { icon: Presentation,    bg: 'bg-orange-50',  color: 'text-orange-500' } },
  // Word
  { test: m => m?.includes('wordprocessingml') || m?.includes('msword'),
    meta: { icon: FileText,        bg: 'bg-blue-50',    color: 'text-blue-600' } },
  // Excel
  { test: m => m?.includes('spreadsheetml') || m?.includes('ms-excel'),
    meta: { icon: FileSpreadsheet, bg: 'bg-green-50',   color: 'text-green-600' } },
  // PDF
  { test: m => m === 'application/pdf',
    meta: { icon: FileText,        bg: 'bg-red-50',     color: 'text-red-500' } },
  // Video
  { test: m => m?.startsWith('video/'),
    meta: { icon: Video,           bg: 'bg-purple-50',  color: 'text-purple-500' } },
  // Audio
  { test: m => m?.startsWith('audio/'),
    meta: { icon: Music,           bg: 'bg-indigo-50',  color: 'text-indigo-400' } },
  // Image
  { test: m => m?.startsWith('image/'),
    meta: { icon: FileImage,       bg: 'bg-teal-50',    color: 'text-teal-500' } },
  // Archive
  { test: m => /zip|rar|7z|tar|gzip/.test(m ?? ''),
    meta: { icon: Archive,         bg: 'bg-amber-50',   color: 'text-amber-600' } },
  // Code / text
  { test: m => m?.startsWith('text/') || /javascript|json|xml/.test(m ?? ''),
    meta: { icon: FileCode2,       bg: 'bg-slate-100',  color: 'text-slate-500' } },
];

const EXT_MAP = {
  pptx: 0, ppt: 0,
  docx: 1, doc: 1,
  xlsx: 2, xls: 2,
  pdf:  3,
  mp4:  4, mov: 4, avi: 4, webm: 4,
  mp3:  5, wav: 5, ogg: 5,
  png:  6, jpg: 6, jpeg: 6, gif: 6, webp: 6, svg: 6,
  zip:  7, rar: 7, '7z': 7, tar: 7, gz: 7,
  js:   8, ts: 8, py: 8, java: 8, c: 8, cpp: 8, cs: 8,
  go:   8, rs: 8, rb: 8, php: 8, html: 8, css: 8, json: 8, xml: 8, md: 8,
};

const TYPE_FALLBACK = {
  slides:       { icon: Presentation,    bg: 'bg-orange-50',  color: 'text-orange-500' },
  lab:          { icon: FlaskConical,    bg: 'bg-rose-50',    color: 'text-rose-500' },
  video:        { icon: Video,           bg: 'bg-purple-50',  color: 'text-purple-500' },
  reading:      { icon: BookOpen,        bg: 'bg-green-50',   color: 'text-green-500' },
  assignment:   { icon: ClipboardList,   bg: 'bg-amber-50',   color: 'text-amber-500' },
  quiz:         { icon: ClipboardList,   bg: 'bg-orange-50',  color: 'text-orange-500' },
  announcement: { icon: Megaphone,       bg: 'bg-blue-50',    color: 'text-blue-500' },
  link:         { icon: Link2,           bg: 'bg-teal-50',    color: 'text-teal-500' },
  document:     { icon: FileText,        bg: 'bg-blue-50',    color: 'text-blue-600' },
  other:        { icon: Package,         bg: 'bg-slate-100',  color: 'text-slate-500' },
};

function getResourceMeta(res) {
  // 1. Try mimeType stored on the resource
  if (res.mimeType) {
    const found = MIME_ICONS.find(m => m.test(res.mimeType));
    if (found) return found.meta;
  }
  // 2. Try extracting extension from fileUrl
  if (res.fileUrl) {
    const ext = res.fileUrl.split('?')[0].split('.').pop().toLowerCase();
    const idx = EXT_MAP[ext];
    if (idx !== undefined) return MIME_ICONS[idx].meta;
  }
  // 3. Fall back to resource type
  return TYPE_FALLBACK[res.type] ?? { icon: File, bg: 'bg-slate-100', color: 'text-slate-400' };
}

// ── Download helpers ──────────────────────────────────────────────────────────
const NON_DOWNLOADABLE = new Set(['assignment', 'quiz', 'announcement']);

function isDownloadable(res) {
  return !!res.fileUrl && !NON_DOWNLOADABLE.has(res.type);
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Single file download — fetch as blob then trigger anchor.
// A plain anchor.click() navigates the tab (causing Chrome's "page might be
// temporarily down" error for binary files like PDFs and videos).
const downloadingId = ref(null); // tracks which resource is mid-download

async function downloadSingle(resource) {
  if (downloadingId.value) return;
  downloadingId.value = resource._id;
  try {
    const res = await fetch(`${BASE_URL}/api/content/download/${resource._id}`);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);

    const blob     = await res.blob();
    const blobUrl  = URL.createObjectURL(blob);
    const basename = resource.fileUrl?.split('?')[0].split(/[/\\]/).pop() ?? '';
    const ext      = basename.includes('.') ? '.' + basename.split('.').pop() : '';
    const filename = resource.title + ext;

    const a    = document.createElement('a');
    a.href     = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  } catch (err) {
    console.error('Single download failed:', err);
    showToast('Download failed. Please try again.', 'error');
  } finally {
    downloadingId.value = null;
  }
}

// ── Date formatter ────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Add Section modal ─────────────────────────────────────────────────────────
const showAddSection = ref(false);
const savingSection  = ref(false);
const newSection     = ref({ title: '', type: 'week' });

async function saveSection() {
  if (!newSection.value.title.trim()) return;
  savingSection.value = true;
  try {
    await api.post(`/api/content/${encodeURIComponent(code)}/sections`, {
      title: newSection.value.title.trim(),
      type:  newSection.value.type,
    });
    showAddSection.value = false;
    newSection.value = { title: '', type: 'week' };
    await loadContent();
  } catch (e) {
    console.error('Add section failed:', e);
  } finally {
    savingSection.value = false;
  }
}

// ── Add Resource modal ────────────────────────────────────────────────────────
const showAddResource = ref(false);
const savingResource  = ref(false);
const activeSection   = ref(null);
const newResource     = ref({ title: '', type: 'other', externalUrl: '', description: '', file: null, opensAt: '', closesAt: '', totalPoints: 100, generateAI: false, questionCount: 8, quizFiles: [], durationMinutes: 20, showCorrectAnswers: true });
const resourceUploadError = ref('');

function openAddResource(sec) {
  activeSection.value  = sec;
  newResource.value    = { title: '', type: 'other', externalUrl: '', description: '', file: null, opensAt: '', closesAt: '', totalPoints: 100, generateAI: false, questionCount: 8, quizFiles: [], durationMinutes: 20, showCorrectAnswers: true };
  resourceUploadError.value = '';
  showAddResource.value = true;
}

function onQuizFilesChange(e) {
  newResource.value.quizFiles = Array.from(e.target.files || []);
}

// Client-side file validation
// Videos get a 500 MB limit; everything else is capped at 50 MB.
const MAX_SIZE_VIDEO = 100 * 1024 * 1024;
const MAX_SIZE_OTHER =  50 * 1024 * 1024;
function onFileChange(e) {
  const file = e.target.files[0] || null;
  resourceUploadError.value = '';
  if (file) {
    const isVideo  = file.type.startsWith('video/');
    const maxBytes = isVideo ? MAX_SIZE_VIDEO : MAX_SIZE_OTHER;
    const maxLabel = isVideo ? '100 MB' : '50 MB';
    if (file.size > maxBytes) {
      resourceUploadError.value = `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is ${maxLabel}.`;
      newResource.value.file = null;
      e.target.value = '';
      return;
    }
  }
  newResource.value.file = file;
}

async function saveResource() {
  if (!newResource.value.title.trim() || !activeSection.value) return;
  savingResource.value = true;
  resourceUploadError.value = '';
  try {
    const fd = new FormData();
    fd.append('title', newResource.value.title.trim());
    fd.append('type',  newResource.value.type);
    if (newResource.value.externalUrl) fd.append('externalUrl', newResource.value.externalUrl);
    if (newResource.value.description) fd.append('description', newResource.value.description);
    if (newResource.value.file)        fd.append('file', newResource.value.file);
    if (newResource.value.opensAt)     fd.append('opensAt', new Date(newResource.value.opensAt).toISOString());
    if (newResource.value.closesAt)    fd.append('closesAt', new Date(newResource.value.closesAt).toISOString());
    if (newResource.value.totalPoints)  fd.append('totalPoints', newResource.value.totalPoints);
    if (newResource.value.generateAI)   fd.append('generateAI', newResource.value.generateAI);
    if (newResource.value.questionCount) fd.append('questionCount', newResource.value.questionCount);
    if (newResource.value.quizFiles?.length) {
      for (const f of newResource.value.quizFiles) {
        fd.append('quizFiles', f);
      }
    }
    if (newResource.value.durationMinutes) fd.append('durationMinutes', newResource.value.durationMinutes);
    if (newResource.value.type === 'quiz') {
      fd.append('showCorrectAnswers', newResource.value.showCorrectAnswers);
    }

    await api.postForm(`/api/content/sections/${activeSection.value._id}/resources`, fd);
    showAddResource.value = false;
    await loadContent();
    showToast(`"${newResource.value.title.trim()}" uploaded successfully.`, 'success');
  } catch (e) {
    resourceUploadError.value = e.message || 'Upload failed. Please try again.';
    showToast(e.message || 'Upload failed. Please try again.', 'error');
  } finally {
    savingResource.value = false;
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
const showConfirmDelete = ref(false);
const deleting          = ref(false);
const deleteType        = ref('');   // 'section' | 'resource'
const deleteTarget      = ref(null); // the section or resource object

function confirmDelete(type, item) {
  deleteType.value   = type;
  deleteTarget.value = item;
  showConfirmDelete.value = true;
}

async function executeDelete() {
  if (!deleteTarget.value) return;
  deleting.value = true;
  try {
    if (deleteType.value === 'section') {
      await api.delete(`/api/content/sections/${deleteTarget.value._id}`);
    } else {
      await api.delete(`/api/content/resources/${deleteTarget.value._id}`);
    }
    showConfirmDelete.value = false;
    deleteTarget.value = null;
    await loadContent();
  } catch (e) {
    console.error('Delete failed:', e);
  } finally {
    deleting.value = false;
  }
}
</script>

<style scoped>
.resource-highlight {
  animation: highlight-pulse 2.5s ease-out;
}

@keyframes highlight-pulse {
  0%   { background-color: rgba(59, 130, 246, 0.25); box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4); }
  30%  { background-color: rgba(59, 130, 246, 0.15); box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25); }
  100% { background-color: transparent; box-shadow: none; }
}
</style>
