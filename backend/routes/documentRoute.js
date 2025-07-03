const express = require('express');
const router = express.Router();
const {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  addCollaborator,
  getAllDocuments
} = require('../controllers/documentController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);


router.post('/', createDocument);


router.get('/', getAllDocuments);


router.get('/:id', getDocument);


router.put('/:id', updateDocument);


router.delete('/:id', deleteDocument);


router.post('/:id/collaborators', addCollaborator);

module.exports = router;