import { ref, push, set, update, remove } from 'firebase/database';
import { db } from '../firebase';

export interface Task {
  id?: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'Completed';
}

// CREATE: Push a new child node to the 'tasks' path
export const addTask = async (task: Omit<Task, 'id'>) => {
  const tasksRef = ref(db, 'tasks');
  const newTaskRef = push(tasksRef);
  await set(newTaskRef, task);
  return newTaskRef.key;
};

// UPDATE: Modify properties of a task by ID
export const updateTask = async (id: string, updatedFields: Partial<Task>) => {
  const taskRef = ref(db, `tasks/${id}`);
  await update(taskRef, updatedFields);
};

// DELETE: Remove task node by ID
export const deleteTask = async (id: string) => {
  const taskRef = ref(db, `tasks/${id}`);
  await remove(taskRef);
};