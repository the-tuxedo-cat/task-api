import express from 'express';
import * as taskController from '../controllers/taskController.js';
import { validateTask } from '../middleware/validateTask.js';
import { validateTaskQuery } from '../middleware/validateTaskQuery.js';

const router = express.Router();

router.get('/', validateTaskQuery, taskController.getTasks);
router.post('/', validateTask, taskController.createTask);

export default router;
