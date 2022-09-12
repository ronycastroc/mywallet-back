import express from 'express';
import authorizationMiddleware from '../middlewares/authorization.middleware.js'
import { createValue, readValues, updateValue, deleteValue } from '../controllers/valueControllers.js';

const router = express.Router();

router.use(authorizationMiddleware);

router.post('/values', createValue);
router.get('/values', readValues);
router.put('/values/:id', updateValue);
router.delete('/values/:id', deleteValue);

export default router;