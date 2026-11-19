import { Router } from 'express';
import { roomController } from '../controllers/roomController.js';
import { dictionaryService } from '../services/dictionaryService.js';

const router = Router();

// Room lifecycle operations
router.post('/rooms', roomController.createRoom);
router.get('/rooms/:roomId', roomController.getRoom);
router.post('/rooms/:roomId/join', roomController.joinRoom);
router.post('/rooms/:roomId/target-word', roomController.submitTargetWord);
router.post('/rooms/:roomId/start', roomController.startGame);

// Gameplay moves & rematch
router.post('/rooms/:roomId/move', roomController.submitMove);
router.post('/rooms/:roomId/terminate', roomController.terminateRoom);
router.post('/rooms/:roomId/rematch', roomController.rematch);
router.post('/rooms/:roomId/rematch/request', roomController.requestRematch);
router.post('/rooms/:roomId/rematch/respond', roomController.respondRematch);

// Dictionary check helper route for instant client-side validation
router.get('/words/validate/:word', (req, res) => {
  const result = dictionaryService.validateWord(req.params.word);
  return res.json(result);
});

export default router;
