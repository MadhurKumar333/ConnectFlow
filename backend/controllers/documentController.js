const Document = require('../models/documentModel');
const Version = require('../models/versionModel');

// Create new document
const createDocument = async (req, res) => {
  try {
    const { title, content = '', isPublic = false } = req.body;

    const document = new Document({
      title,
      content,
      owner: req.user.id,
      isPublic,
      lastModifiedBy: req.user.id
    });

    await document.save();

    // Create initial version
    const version = new Version({
      documentId: document._id,
      content,
      title,
      version: 1,
      createdBy: req.user.id,
      changes: 'Initial version'
    });

    await version.save();

    await document.populate('owner', 'username email');
    
    res.status(201).json({
      message: 'Document created successfully',
      document
    });
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ message: 'Server error while creating document' });
  }
};

// Get all documents for user
const getUserDocuments = async (req, res) => {
  try {
    const documents = await Document.find({
      $or: [
        { owner: req.user.id },
        { 'collaborators.user': req.user.id },
        { isPublic: true }
      ]
    })
    .populate('owner', 'username email')
    .populate('collaborators.user', 'username email')
    .populate('lastModifiedBy', 'username')
    .sort({ lastModified: -1 });

    res.json(documents);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ message: 'Server error while fetching documents' });
  }
};

// Get single document
const getDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('owner', 'username email')
      .populate('collaborators.user', 'username email')
      .populate('activeUsers.user', 'username email')
      .populate('lastModifiedBy', 'username');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user has access
    const hasAccess = document.owner._id.toString() === req.user.id ||
                     document.collaborators.some(collab => collab.user._id.toString() === req.user.id) ||
                     document.isPublic;

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(document);
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ message: 'Server error while fetching document' });
  }
};

// Update document
const updateDocument = async (req, res) => {
  try {
    const { title, content, isPublic } = req.body;
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if user has write access
    const hasWriteAccess = document.owner.toString() === req.user.id ||
                          document.collaborators.some(collab => 
                            collab.user.toString() === req.user.id && 
                            ['write', 'admin'].includes(collab.permission)
                          );

    if (!hasWriteAccess) {
      return res.status(403).json({ message: 'Write access denied' });
    }

    // Update document
    const updatedDocument = await Document.findByIdAndUpdate(
      req.params.id,
      {
        title: title || document.title,
        content: content !== undefined ? content : document.content,
        isPublic: isPublic !== undefined ? isPublic : document.isPublic,
        lastModifiedBy: req.user.id
      },
      { new: true }
    ).populate('owner', 'username email')
     .populate('collaborators.user', 'username email')
     .populate('lastModifiedBy', 'username');

    res.json({
      message: 'Document updated successfully',
      document: updatedDocument
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ message: 'Server error while updating document' });
  }
};

// Delete document
const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Only owner can delete
    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only owner can delete document' });
    }

    await Document.findByIdAndDelete(req.params.id);
    await Version.deleteMany({ documentId: req.params.id });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Server error while deleting document' });
  }
};

// Add collaborator
const addCollaborator = async (req, res) => {
  try {
    const { email, permission = 'write' } = req.body;
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Only owner can add collaborators
    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only owner can add collaborators' });
    }

    // Find user by email
    const User = require('../models/User');
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already collaborator
    const isAlreadyCollaborator = document.collaborators.some(
      collab => collab.user.toString() === user._id.toString()
    );

    if (isAlreadyCollaborator) {
      return res.status(400).json({ message: 'User is already a collaborator' });
    }

    document.collaborators.push({
      user: user._id,
      permission
    });

    await document.save();
    await document.populate('collaborators.user', 'username email');

    res.json({
      message: 'Collaborator added successfully',
      document
    });
  } catch (error) {
    console.error('Add collaborator error:', error);
    res.status(500).json({ message: 'Server error while adding collaborator' });
  }
};

module.exports = {
  createDocument,
  getUserDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  addCollaborator
};