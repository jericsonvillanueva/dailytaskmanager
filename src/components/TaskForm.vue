<template>
  <form @submit.prevent="submitTask" class="form-container">
    <ion-list lines="none" class="modern-form">
      <ion-item class="custom-input">
        <ion-input 
          label="Task Title" 
          label-placement="stacked" 
          placeholder="e.g. Complete quarterly report" 
          v-model="task.title" 
          required 
        ></ion-input>
      </ion-item>

      <ion-item class="custom-input">
        <ion-textarea 
          label="Description" 
          label-placement="stacked" 
          placeholder="Add details or notes..." 
          v-model="task.description" 
          :rows="3"
        ></ion-textarea>
      </ion-item>

      <ion-item class="custom-input">
        <ion-input 
          type="datetime-local" 
          label="Due Date & Time" 
          label-placement="stacked" 
          v-model="task.dueDate" 
          required 
        ></ion-input>
      </ion-item>

      <ion-item class="custom-input">
        <ion-select 
          label="Priority" 
          label-placement="stacked" 
          v-model="task.priority" 
          interface="popover"
          required
        >
          <ion-select-option value="Low">Low</ion-select-option>
          <ion-select-option value="Medium">Medium</ion-select-option>
          <ion-select-option value="High">High</ion-select-option>
        </ion-select>
      </ion-item>
    </ion-list>

    <ion-button 
      expand="block" 
      type="submit" 
      class="modern-button" 
      shape="round" 
      color="primary"
    >
      {{ props.existingTask ? 'Update Task' : 'Create Task' }}
    </ion-button>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { IonList, IonItem, IonInput, IonTextarea, IonSelect, IonSelectOption, IonButton } from '@ionic/vue';
import { Toast } from '@capacitor/toast';
import { LocalNotifications } from '@capacitor/local-notifications';
import { addTask, updateTask, Task } from '../services/taskService';

const props = defineProps<{ existingTask?: Task | null }>();
const emit = defineEmits(['task-saved']);

const defaultTaskState = (): Task => ({
  title: '', 
  description: '', 
  dueDate: '', 
  priority: 'Medium', 
  status: 'Pending'
});

const task = ref<Task>(defaultTaskState());

// Reset or populate fields when existingTask prop updates
watch(() => props.existingTask, (newVal) => {
  if (newVal) {
    task.value = { ...newVal };
  } else {
    task.value = defaultTaskState();
  }
}, { immediate: true });

const submitTask = async () => {
  try {
    if (props.existingTask && props.existingTask.id) {
      await updateTask(props.existingTask.id, task.value);
    } else {
      const { id, ...newTask } = task.value; 
      await addTask(newTask as Omit<Task, 'id'>);
    }

    // --- LOCAL NOTIFICATIONS LOGIC ---
    if (task.value.dueDate) {
      try {
        const permStatus = await LocalNotifications.requestPermissions();
        
        if (permStatus.display === 'granted') {
          const deadline = new Date(task.value.dueDate);
          const oneHourBefore = new Date(deadline.getTime() - 60 * 60 * 1000);
          const notificationsToSchedule = [];

          // 1. Approaching Notification (1 hour before deadline)
          if (oneHourBefore.getTime() > Date.now()) {
            notificationsToSchedule.push({
              title: 'Task Approaching! ⏳',
              body: `"${task.value.title}" is due in 1 hour.`,
              id: Math.floor(Math.random() * 100000),
              schedule: { at: oneHourBefore }
            });
          }

          // 2. Deadline Reached Notification
          if (deadline.getTime() > Date.now()) {
            notificationsToSchedule.push({
              title: 'Deadline Reached! 🚨',
              body: `"${task.value.title}" is due right now!`,
              id: Math.floor(Math.random() * 100000),
              schedule: { at: deadline }
            });
          }

          if (notificationsToSchedule.length > 0) {
            await LocalNotifications.schedule({ notifications: notificationsToSchedule });
          }
        }
      } catch (notifError) {
        console.warn("Notification scheduling skipped (web mode or missing plugin):", notifError);
      }
    }
    // ---------------------------------

    try {
      await Toast.show({ text: props.existingTask ? 'Task Updated!' : 'Task Saved!', position: 'bottom', duration: 'short' });
    } catch {
      // Fallback if Toast plugin is not available on web platform
    }

    if (!props.existingTask) {
      task.value = defaultTaskState();
    }
    
    // Notify HomePage to close modal and handle layout updates
    emit('task-saved');
  } catch (error) {
    console.error("Error saving task: ", error);
  }
};
</script>

<style scoped>
.form-container {
  padding-top: 8px;
}

.modern-form {
  background: transparent;
  padding: 0;
}

.custom-input {
  --background: rgba(30, 41, 59, 0.6);
  --border-radius: 12px;
  --border-color: rgba(255, 255, 255, 0.08);
  --border-style: solid;
  --border-width: 1px;
  --padding-start: 14px;
  --padding-end: 14px;
  --padding-top: 6px;
  --padding-bottom: 6px;
  margin-bottom: 14px;
  font-size: 0.95rem;
}

.custom-input ion-input,
.custom-input ion-textarea,
.custom-input ion-select {
  --color: #f8fafc;
  --placeholder-color: #64748b;
  --placeholder-opacity: 1;
  font-weight: 500;
}

.modern-button {
  margin-top: 24px;
  height: 48px;
  font-weight: 700;
  letter-spacing: 0.01em;
  --border-radius: 14px;
  --box-shadow: 0 8px 20px -4px rgba(99, 102, 241, 0.4);
}
</style>