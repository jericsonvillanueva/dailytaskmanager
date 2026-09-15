<template>
  <ion-item-sliding class="modern-sliding-item">
    <!-- SWIPE RIGHT: Complete -->
    <ion-item-options side="start">
      <ion-item-option 
        :color="task.status === 'Pending' ? 'success' : 'medium'" 
        @click="$emit('toggle-status', task)"
        class="swipe-option"
      >
        <ion-icon slot="icon-only" :icon="checkIcon"></ion-icon>
      </ion-item-option>
    </ion-item-options>

    <!-- MAIN TASK CARD -->
    <ion-item 
      class="modern-item" 
      :class="[priorityClass, { 'completed-card': task.status === 'Completed' }]"
      lines="none"
    >
      <ion-checkbox 
        slot="start" 
        :checked="task.status === 'Completed'" 
        @ionChange="$emit('toggle-status', task)"
        class="custom-checkbox"
      ></ion-checkbox>

      <ion-label class="task-label" :class="{ 'completed-text': task.status === 'Completed' }">
        <div class="title-row">
          <h2 class="task-title">{{ task.title }}</h2>
          <ion-badge :color="priorityColor" class="priority-pill">{{ task.priority }}</ion-badge>
        </div>
        
        <p v-if="task.description" class="task-desc">{{ task.description }}</p>
        
        <!-- Formatted Due Date & Overdue Badge -->
        <div class="meta-row" v-if="task.dueDate">
          <span class="due-text">Due {{ formatDateTime(task.dueDate) }}</span>
          <ion-badge v-if="dueDateStatus" :color="dueDateStatus.color" class="status-pill">
            {{ dueDateStatus.label }}
          </ion-badge>
        </div>
      </ion-label>

      <!-- Action Buttons -->
      <div slot="end" class="actions-wrapper">
        <ion-button fill="clear" size="small" class="icon-btn edit-btn" @click="$emit('edit-task', task)">
          <ion-icon :icon="createIcon" slot="icon-only"></ion-icon>
        </ion-button>
        <ion-button fill="clear" size="small" class="icon-btn delete-btn" @click="$emit('delete-task', task.id)">
          <ion-icon :icon="trashIcon" slot="icon-only"></ion-icon>
        </ion-button>
      </div>
    </ion-item>

    <!-- SWIPE LEFT: Options -->
    <ion-item-options side="end">
      <ion-item-option color="primary" @click="$emit('edit-task', task)" class="swipe-option">
        <ion-icon slot="icon-only" :icon="createIcon"></ion-icon>
      </ion-item-option>
      <ion-item-option color="danger" @click="$emit('delete-task', task.id)" class="swipe-option">
        <ion-icon slot="icon-only" :icon="trashIcon"></ion-icon>
      </ion-item-option>
    </ion-item-options>
  </ion-item-sliding>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { 
  IonItem, IonLabel, IonCheckbox, IonBadge, IonButton, IonIcon,
  IonItemSliding, IonItemOptions, IonItemOption 
} from '@ionic/vue';
import { 
  trashOutline as trashIcon, 
  createOutline as createIcon, 
  checkmarkCircleOutline as checkIcon 
} from 'ionicons/icons'; 
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
    default: return 'medium';
  }
});

const priorityClass = computed(() => {
  return `priority-border-${props.task.priority?.toLowerCase() || 'low'}`;
});

const formatDateTime = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', { 
    month: 'short', day: 'numeric', 
    hour: 'numeric', minute: '2-digit', hour12: true 
  });
};

const dueDateStatus = computed(() => {
  if (!props.task.dueDate || props.task.status === 'Completed') return null;

  const due = new Date(props.task.dueDate);
  const today = new Date();

  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: 'Overdue', color: 'danger' };
  if (diffDays === 0) return { label: 'Due Today', color: 'warning' };
  if (diffDays === 1) return { label: 'Tomorrow', color: 'primary' };
  return null;
});
</script>

<style scoped>
.modern-sliding-item {
  margin-bottom: 12px;
  border-radius: 16px;
}

.modern-item {
  --background: rgba(30, 41, 59, 0.6);
  --border-radius: 16px;
  --padding-start: 14px;
  --inner-padding-end: 12px;
  --padding-top: 10px;
  --padding-bottom: 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  position: relative;
  overflow: hidden;
}

/* Priority Side Glow Stripes */
.priority-border-high {
  border-left: 4px solid #ef4444 !important;
}
.priority-border-medium {
  border-left: 4px solid #f59e0b !important;
}
.priority-border-low {
  border-left: 4px solid #10b981 !important;
}

.task-label {
  margin-left: 8px;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.task-title {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #f8fafc;
  margin: 0;
}

.task-desc {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 4px 0 8px 0;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.due-text {
  font-size: 0.78rem;
  color: #64748b;
  font-weight: 500;
}

.priority-pill {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.status-pill {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 6px;
}

.actions-wrapper {
  display: flex;
  align-items: center;
}

.icon-btn {
  --padding-start: 6px;
  --padding-end: 6px;
  height: 32px;
  opacity: 0.7;
}

.icon-btn:hover {
  opacity: 1;
}

.completed-card {
  opacity: 0.6;
}

.completed-text .task-title,
.completed-text .task-desc {
  text-decoration: line-through;
}
</style>