<template>
  <form @submit.prevent="submitTask">
    <ion-list lines="none" class="modern-form">
      <ion-item class="custom-input">
        <ion-input label="Task Title" label-placement="floating" v-model="task.title" required></ion-input>
      </ion-item>
      <ion-item class="custom-input">
        <ion-textarea label="Description" label-placement="floating" v-model="task.description" required></ion-textarea>
      </ion-item>
      <ion-item class="custom-input">
        <ion-input type="date" label="Due Date" label-placement="stacked" v-model="task.dueDate" required></ion-input>
      </ion-item>
      <ion-item class="custom-input">
        <ion-select label="Priority" label-placement="floating" v-model="task.priority" required>
          <ion-select-option value="Low">Low</ion-select-option>
          <ion-select-option value="Medium">Medium</ion-select-option>
          <ion-select-option value="High">High</ion-select-option>
        </ion-select>
      </ion-item>
    </ion-list>
    <ion-button expand="block" type="submit" class="modern-button ion-margin-top" shape="round">
      {{ props.existingTask ? 'Update Task' : 'Save Task' }}
    </ion-button>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { IonList, IonItem, IonInput, IonTextarea, IonSelect, IonSelectOption, IonButton } from '@ionic/vue';
import { Toast } from '@capacitor/toast';
import { addTask, updateTask, Task } from '../services/taskService';

// NEW: Accept an existing task for editing
const props = defineProps<{ existingTask?: Task | null }>();
const emit = defineEmits(['task-saved']);

const task = ref<Task>({
  title: '', description: '', dueDate: '', priority: 'Medium', status: 'Pending'
});

// NEW: If existing data is passed in, fill the form
watch(() => props.existingTask, (newVal) => {
  if (newVal) task.value = { ...newVal };
}, { immediate: true });

const submitTask = async () => {
  try {
    if (props.existingTask && props.existingTask.id) {
      // Update existing task
      await updateTask(props.existingTask.id, task.value);
    } else {
      // Add new task
      const { id, ...newTask } = task.value; 
      await addTask(newTask as Omit<Task, 'id'>);
    }

    await Toast.show({ text: props.existingTask ? 'Task Updated!' : 'Task Saved!', position: 'bottom', duration: 'short' });
    
    // Reset form if it's a new task
    if (!props.existingTask) {
      task.value = { title: '', description: '', dueDate: '', priority: 'Medium', status: 'Pending' };
    }
    
    emit('task-saved'); // Tell the parent modal to close
  } catch (error) {
    console.error("Error saving task: ", error);
  }
};
</script>

<style scoped>
.modern-form {
  background: transparent;
}

.custom-input {
  /* This adapts automatically! It creates a soft gray box in both Light and Dark mode */
  --background: rgba(130, 130, 130, 0.1); 
  --border-radius: 8px;
  margin-bottom: 12px;
  --padding-start: 12px;
}

.modern-button {
  margin-top: 16px;
  --box-shadow: 0 4px 10px rgba(var(--ion-color-primary-rgb), 0.3);
}
</style>