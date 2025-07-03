const express = require('express');
const router = express.Router();
const {
  createDocument,
  getUserDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  addCollaborator
} = require('../controllers/documentController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);


router.post('/', createDocument);


router.get('/', getUserDocuments);


router.get('/:id', getDocument);


router.put('/:id', updateDocument);


router.delete('/:id', deleteDocument);


router.post('/:id/collaborators', addCollaborator);

module.exports = router;