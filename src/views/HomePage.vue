<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title class="modern-title">Daily Task Manager</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding modern-bg">
      <ion-card class="modern-card">
        <ion-card-header>
          <ion-card-title>Create a Task</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <TaskForm />
        </ion-card-content>
      </ion-card>

      <h2 class="section-title">Your Tasks</h2>
      
      <ion-list v-if="tasks.length > 0" class="modern-list">
        <TaskItem 
          v-for="task in tasks" 
          :key="task.id" 
          :task="task" 
          @toggle-status="handleToggleStatus"
          @delete-task="handleDelete"
          @edit-task="openEditModal" 
        />
      </ion-list>
      <div v-else class="empty-state">
        <p>You're all caught up! 🚀</p>
      </div>

      <!-- NEW: Edit Modal -->
      <ion-modal :is-open="isModalOpen" @didDismiss="closeModal">
        <ion-header>
          <ion-toolbar>
            <ion-title>Edit Task</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeModal">Close</ion-button>
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
import { ref, onMounted } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
  IonList, alertController, IonModal, IonButtons, IonButton
} from '@ionic/vue';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import TaskForm from '../components/TaskForm.vue';
import TaskItem from '../components/TaskItem.vue';
import { Task, updateTask, deleteTask } from '../services/taskService';

const tasks = ref<Task[]>([]);

// NEW: Modal State
const isModalOpen = ref(false);
const taskToEdit = ref<Task | null>(null);

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
    message: 'This cannot be undone.',
    buttons: [
      { text: 'Keep', role: 'cancel' },
      { text: 'Delete', role: 'destructive', handler: async () => await deleteTask(id) }
    ]
  });
  await alert.present();
};

// NEW: Modal Functions
const openEditModal = (task: Task) => {
  taskToEdit.value = { ...task }; // Copy the task so we don't edit live data
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  taskToEdit.value = null;
};
</script>

<style scoped>
/* Modern styling for HomePage */
.modern-bg {
  /* Let Ionic handle the dark/light mode background automatically */
  --background: var(--ion-background-color); 
}

.modern-title {
  font-weight: 700;
  letter-spacing: 0.5px;
}

.modern-card {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15); /* Slightly darker shadow for contrast */
  margin-bottom: 24px;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-left: 16px;
  margin-bottom: 8px;
}

.modern-list {
  background: transparent;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #888;
  font-size: 1.1rem;
}

/* These affect the TaskItem inside the list */
ion-item {
  --border-radius: 12px;
  --padding-start: 16px;
  --inner-padding-end: 16px;
  margin: 0 16px 12px 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
</style>