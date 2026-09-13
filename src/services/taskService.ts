import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase'; 

export interface Task {
  id?: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'Completed';
}

const taskCollection = collection(db, 'tasks');

export const addTask = async (task: Omit<Task, 'id'>) => {
  return await addDoc(taskCollection, task);
};

export const updateTask = async (id: string, updatedData: Partial<Task>) => {
  const taskDoc = doc(db, 'tasks', id);
  return await updateDoc(taskDoc, updatedData);
};

export const deleteTask = async (id: string) => {
  const taskDoc = doc(db, 'tasks', id);
  return await deleteDoc(taskDoc);
};