<template>
  <ion-item class="modern-item">
    <ion-checkbox slot="start" :checked="task.status === 'Completed'" @ionChange="$emit('toggle-status', task)"></ion-checkbox>
    <ion-label :class="{ 'completed-text': task.status === 'Completed' }">
      <h2><strong>{{ task.title }}</strong></h2>
      <p>{{ task.description }}</p>
      <p>Due: {{ task.dueDate }}</p>
    </ion-label>
    <ion-badge slot="end" :color="priorityColor">{{ task.priority }}</ion-badge>
    
    <ion-button slot="end" fill="clear" color="primary" @click="$emit('edit-task', task)">
      <ion-icon :icon="createIcon" slot="icon-only"></ion-icon>
    </ion-button>

    <ion-button slot="end" fill="clear" color="danger" @click="$emit('delete-task', task.id)">
      <ion-icon :icon="trashIcon" slot="icon-only"></ion-icon>
    </ion-button>
  </ion-item>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonItem, IonLabel, IonCheckbox, IonBadge, IonButton, IonIcon } from '@ionic/vue';
import { trash as trashIcon, create as createIcon } from 'ionicons/icons'; // Import create icon
import { Task } from '../services/taskService';

const props = defineProps<{ task: Task }>();

defineEmits<{
  (e: 'toggle-status', task: Task): void;
  (e: 'delete-task', id: string | undefined): void;
  (e: 'edit-task', task: Task): void;
}>();

const priorityColor = computed(() => {
  switch (props.task.priority) {
    case 'High': return 'danger';
    case 'Medium': return 'warning';
    case 'Low': return 'success';
    default: return 'primary';
  }
});
</script>

<style scoped>
/* Visually fade and cross out completed tasks */
.completed-text h2, 
.completed-text p {
  text-decoration: line-through;
  opacity: 0.6;
}
</style>