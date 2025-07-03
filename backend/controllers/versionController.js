const Version = require('../models/versionModel');
const Document = require('../models/documentModel');

// Create new version
const createVersion = async (req, res) => {
  try {
    const { documentId, content, title, changes = '' } = req.body;

    // Check if document exists and user has access
    const document = await Document.findById(documentId);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const hasAccess = document.owner.toString() === req.user.id ||
                     document.collaborators.some(collab => collab.user.toString() === req.user.id) ||
                     document.isPublic;

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get latest version number
    const latestVersion = await Version.findOne({ documentId })
      .sort({ version: -1 })
      .select('version');

    const newVersionNumber = latestVersion ? latestVersion.version + 1 : 1;

    // Create new version
    const version = new Version({
      documentId,
      content,
      title,
      version: newVersionNumber,
      createdBy: req.user.id,
      changes
    });

    await version.save();
    await version.populate('createdBy', 'username');

    res.status(201).json({
      message: 'Version created successfully',
      version
    });
  } catch (error) {
    console.error('Create version error:', error);
    res.status(500).json({ message: 'Server error while creating version' });
  }
};

// Get document versions
const getDocumentVersions = async (req, res) => {
  try {
    const { documentId } = req.params;

    // Check if document exists and user has access
    const document = await Document.findById(documentId);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const hasAccess = document.owner.toString() === req.user.id ||
                     document.collaborators.some(collab => collab.user.toString() === req.user.id) ||
                     document.isPublic;

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const versions = await Version.find({ documentId })
      .sort({ version: -1 })
      .populate('createdBy', 'username')
      .select('-content'); // Exclude content to reduce payload

    res.json(versions);
  } catch (error) {
    console.error('Get versions error:', error);
    res.status(500).json({ message: 'Server error while fetching versions' });
  }
};

// Get specific version
const getVersion = async (req, res) => {
  try {
    const { versionId } = req.params;

    const version = await Version.findById(versionId)
      .populate('createdBy', 'username')
      .populate('documentId', 'title owner collaborators isPublic');

    if (!version) {
      return res.status(404).json({ message: 'Version not found' });
    }

    // Check if user has access to the document
    const document = version.documentId;
    const hasAccess = document.owner.toString() === req.user.id ||
                     document.collaborators.some(collab => collab.user.toString() === req.user.id) ||
                     document.isPublic;

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(version);
  } catch (error) {
    console.error('Get version error:', error);
    res.status(500).json({ message: 'Server error while fetching version' });
  }
};

// Restore version
const restoreVersion = async (req, res) => {
  try {
    const { versionId } = req.params;

    const version = await Version.findById(versionId)
      .populate('documentId', 'title owner collaborators');

    if (!version) {
      return res.status(404).json({ message: 'Version not found' });
    }

    // Check if user has write access
    const document = version.documentId;
    const hasWriteAccess = document.owner.toString() === req.user.id ||
                          document.collaborators.some(collab => 
                            collab.user.toString() === req.user.id && 
                            ['write', 'admin'].includes(collab.permission)
                          );

    if (!hasWriteAccess) {
      return res.status(403).json({ message: 'Write access denied' });
    }

    // Update document with version content
    const updatedDocument = await Document.findByIdAndUpdate(
      version.documentId._id,
      {
        content: version.content,
        title: version.title,
        lastModifiedBy: req.user.id,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('owner', 'username email')
     .populate('collaborators.user', 'username email')
     .populate('lastModifiedBy', 'username');

    // Create new version for the restore
    const latestVersion = await Version.findOne({ documentId: version.documentId._id })
      .sort({ version: -1 })
      .select('version');

    const newVersion = new Version({
      documentId: version.documentId._id,
      content: version.content,
      title: version.title,
      version: latestVersion ? latestVersion.version + 1 : 1,
      createdBy: req.user.id,
      changes: `Restored from version ${version.version}`
    });

    await newVersion.save();
    await newVersion.populate('createdBy', 'username');

    res.json({
      message: 'Version restored successfully',
      document: updatedDocument,
      newVersion
    });
  } catch (error) {
    console.error('Restore version error:', error);
    res.status(500).json({ message: 'Server error while restoring version' });
  }
};

// Delete version
const deleteVersion = async (req, res) => {
  try {
    const { versionId } = req.params;

    const version = await Version.findById(versionId)
      .populate('documentId', 'owner collaborators');

    if (!version) {
      return res.status(404).json({ message: 'Version not found' });
    }

    // Check if user has admin access
    const document = version.documentId;
    const hasAdminAccess = document.owner.toString() === req.user.id ||
                          document.collaborators.some(collab => 
                            collab.user.toString() === req.user.id && 
                            collab.permission === 'admin'
                          );

    if (!hasAdminAccess) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Don't allow deletion of the only version
    const versionCount = await Version.countDocuments({ documentId: version.documentId._id });
    if (versionCount <= 1) {
      return res.status(400).json({ message: 'Cannot delete the only version' });
    }

    await Version.findByIdAndDelete(versionId);

    res.json({ message: 'Version deleted successfully' });
  } catch (error) {
    console.error('Delete version error:', error);
    res.status(500).json({ message: 'Server error while deleting version' });
  }
};

// Compare versions
const compareVersions = async (req, res) => {
  try {
    const { versionId1, versionId2 } = req.params;

    const [version1, version2] = await Promise.all([
      Version.findById(versionId1)
        .populate('documentId', 'owner collaborators isPublic')
        .populate('createdBy', 'username'),
      Version.findById(versionId2)
        .populate('documentId', 'owner collaborators isPublic')
        .populate('createdBy', 'username')
    ]);

    if (!version1 || !version2) {
      return res.status(404).json({ message: 'One or both versions not found' });
    }

    // Check if versions belong to the same document
    if (version1.documentId._id.toString() !== version2.documentId._id.toString()) {
      return res.status(400).json({ message: 'Versions must belong to the same document' });
    }

    // Check if user has access to the document
    const document = version1.documentId;
    const hasAccess = document.owner.toString() === req.user.id ||
                     document.collaborators.some(collab => collab.user.toString() === req.user.id) ||
                     document.isPublic;

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      version1: {
        id: version1._id,
        version: version1.version,
        title: version1.title,
        content: version1.content,
        createdBy: version1.createdBy,
        createdAt: version1.createdAt,
        changes: version1.changes
      },
      version2: {
        id: version2._id,
        version: version2.version,
        title: version2.title,
        content: version2.content,
        createdBy: version2.createdBy,
        createdAt: version2.createdAt,
        changes: version2.changes
      }
    });
  } catch (error) {
    console.error('Compare versions error:', error);
    res.status(500).json({ message: 'Server error while comparing versions' });
  }
};

module.exports = {
  createVersion,
  getDocumentVersions,
  getVersion,
  restoreVersion,
  deleteVersion,
  compareVersions
};