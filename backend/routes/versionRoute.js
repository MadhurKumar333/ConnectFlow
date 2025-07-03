const express = require('express');
const router = express.Router();
const {
  createVersion,
  getDocumentVersions,
  getVersion,
  restoreVersion
} = require('../controllers/versionController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);


router.post('/', createVersion);


router.get('/document/:documentId', getDocumentVersions);


router.get('/:versionId', getVersion);


router.post('/:versionId/restore', restoreVersion);

module.exports = router;