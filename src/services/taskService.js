import * as taskRepository from '../repositories/taskRepo.js';

export async function getAllTasks(filters = {}) {
  return taskRepository.findAll(filters);
}

export async function createTask(newTask) {
  return taskRepository.create(newTask);
}
