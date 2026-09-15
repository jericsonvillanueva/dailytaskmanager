<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar class="glass-toolbar">
        <ion-title class="app-title">
          Daily Task Manager <span class="sparkle-badge">✦ Active</span>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding modern-bg">
      
      <!-- HERO PROGRESS CARD -->
      <div class="hero-progress-card" v-if="totalTasks > 0">
        <div class="progress-header">
          <div>
            <h3 class="progress-title">Progress Overview</h3>
            <p class="progress-subtitle">{{ completedTasks }} of {{ totalTasks }} tasks completed</p>
          </div>
          <span class="percentage-badge">{{ Math.round(progressRatio * 100) }}%</span>
        </div>
        <ion-progress-bar :value="progressRatio" color="primary" class="modern-progress-bar"></ion-progress-bar>
      </div>

      <!-- STREAMLINED FILTER & SORT TOOLBAR -->
      <div class="filter-bar">
        <div class="filter-item">
          <ion-select label="Status" label-placement="stacked" v-model="statusFilter" interface="popover" class="custom-select">
            <ion-select-option value="All">All Tasks</ion-select-option>
            <ion-select-option value="Pending">Pending</ion-select-option>
            <ion-select-option value="Completed">Completed</ion-select-option>
          </ion-select>
        </div>

        <div class="filter-item">
          <ion-select label="Priority" label-placement="stacked" v-model="priorityFilter" interface="popover" class="custom-select">
            <ion-select-option value="All">All Priority</ion-select-option>
            <ion-select-option value="High">High</ion-select-option>
            <ion-select-option value="Medium">Medium</ion-select-option>
            <ion-select-option value="Low">Low</ion-select-option>
          </ion-select>
        </div>

        <div class="filter-item">
          <ion-select label="Sort" label-placement="stacked" v-model="sortBy" interface="popover" class="custom-select">
            <ion-select-option value="DateAsc">Earliest</ion-select-option>
            <ion-select-option value="DateDesc">Latest</ion-select-option>
          </ion-select>
        </div>
      </div>

      <div class="section-header">
        <h2 class="section-title">Your Feed</h2>
        <span class="count-pill">{{ filteredAndSortedTasks.length }}</span>
      </div>

      <!-- TASK LIST -->
      <ion-list v-if="filteredAndSortedTasks.length > 0" class="modern-list">
        <TaskItem 
          v-for="task in filteredAndSortedTasks" 
          :key="task.id" 
          :task="task" 
          @toggle-status="handleToggleStatus"
          @delete-task="handleDelete"
          @edit-task="openEditModal" 
        />
      </ion-list>
      
      <!-- EMPTY STATE -->
      <div v-else class="empty-state">
        <div class="empty-icon-wrapper">
          <ion-icon :icon="sparklesOutline" class="empty-icon"></ion-icon>
        </div>
        <h3>No tasks found</h3>
        <p>You're all caught up or your filters returned no results.</p>
      </div>

      <!-- FLOATING ACTION BUTTON (Create Task) -->
      <ion-fab slot="fixed" vertical="bottom" horizontal="end" class="custom-fab">
        <ion-fab-button @click="openCreateModal" color="primary">
          <ion-icon :icon="addOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- EDIT / CREATE TASK MODAL -->
      <ion-modal :is-open="isModalOpen" @didDismiss="closeModal" class="custom-modal">
        <ion-header class="ion-no-border">
          <ion-toolbar>
            <ion-title>{{ taskToEdit ? 'Edit Task' : 'New Task' }}</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeModal" color="medium">Close</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <TaskForm :existingTask="taskToEdit" @task-saved="closeModal" />
        </ion-content>
      </ion-modal>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonList, alertController, IonModal, IonButtons, IonButton,
  IonSelect, IonSelectOption, IonProgressBar, IonFab, IonFabButton, IonIcon 
} from '@ionic/vue';
import { addOutline, sparklesOutline } from 'ionicons/icons';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import TaskForm from '../components/TaskForm.vue';
import TaskItem from '../components/TaskItem.vue';
import { Task, updateTask, deleteTask } from '../services/taskService';

const tasks = ref<Task[]>([]);

// Filter & Sort States
const statusFilter = ref('All');
const priorityFilter = ref('All');
const sortBy = ref('DateAsc'); 

// Modal states
const isModalOpen = ref(false);
const taskToEdit = ref<Task | null>(null);

// Progress Metrics
const totalTasks = computed(() => tasks.value.length);
const completedTasks = computed(() => tasks.value.filter(task => task.status === 'Completed').length);
const progressRatio = computed(() => totalTasks.value === 0 ? 0 : completedTasks.value / totalTasks.value);

// Computed Filter & Sort
const filteredAndSortedTasks = computed(() => {
  let result = tasks.value.filter(task => {
    const matchesStatus = statusFilter.value === 'All' || task.status === statusFilter.value;
    const matchesPriority = priorityFilter.value === 'All' || task.priority === priorityFilter.value;
    return matchesStatus && matchesPriority;
  });

  result.sort((a, b) => {
    if (a.status === 'Pending' && b.status === 'Completed') return -1;
    if (a.status === 'Completed' && b.status === 'Pending') return 1;

    const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
    const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;

    if (sortBy.value === 'DateAsc') return dateA - dateB;
    if (sortBy.value === 'DateDesc') return dateB - dateA;
    return 0;
  });

  return result;
});

onMounted(() => {
  onSnapshot(collection(db, 'tasks'), (querySnapshot) => {
    tasks.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];
  });
});

const handleToggleStatus = async (task: Task) => {
  if (!task.id) return;
  await updateTask(task.id, { status: task.status === 'Pending' ? 'Completed' : 'Pending' });
};

const handleDelete = async (id: string | undefined) => {
  if (!id) return;
  const alert = await alertController.create({
    header: 'Delete Task?',
    message: 'This action cannot be undone.',
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      { text: 'Delete', role: 'destructive', handler: async () => await deleteTask(id) }
    ]
  });
  await alert.present();
};

const openCreateModal = () => {
  taskToEdit.value = null;
  isModalOpen.value = true;
};

const openEditModal = (task: Task) => {
  taskToEdit.value = { ...task }; 
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  taskToEdit.value = null;
};
</script>

<style scoped>
.modern-bg {
  --background: var(--ion-background-color, #0f172a);
}

.glass-toolbar {
  --background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.app-title {
  font-weight: 800;
  font-size: 1.25rem;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
}

.sparkle-badge {
  font-size: 0.7rem;
  font-weight: 600;
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
  padding: 3px 8px;
  border-radius: 20px;
  border: 1px solid rgba(99, 102, 241, 0.3);
  margin-left: 8px;
}

/* HERO HERO PROGRESS CARD */
.hero-progress-card {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 18px 20px;
  margin-bottom: 20px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-title {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.01em;
}

.progress-subtitle {
  font-size: 0.82rem;
  color: #94a3b8;
  margin: 2px 0 0 0;
}

.percentage-badge {
  font-size: 1.1rem;
  font-weight: 800;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
}

.modern-progress-bar {
  height: 8px;
  border-radius: 4px;
  --background: rgba(255, 255, 255, 0.08);
  --progress-background: linear-gradient(90deg, #38bdf8, #818cf8);
}

/* FILTER BAR */
.filter-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 24px;
  background: rgba(30, 41, 59, 0.5);
  padding: 6px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.custom-select {
  --background: transparent;
  --padding-start: 8px;
  --padding-end: 8px;
  font-size: 0.8rem;
  font-weight: 600;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding-left: 4px;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.01em;
}

.count-pill {
  font-size: 0.75rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  padding: 2px 8px;
  border-radius: 10px;
}

.modern-list {
  background: transparent;
  padding: 0;
}

/* EMPTY STATE */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
}

.empty-icon-wrapper {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px auto;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  font-size: 28px;
  color: #818cf8;
}

/* CUSTOM FAB */
.custom-fab ion-fab-button {
  --border-radius: 16px;
  --box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.5);
}

.custom-modal {
  --border-radius: 24px 24px 0 0;
}
</style>