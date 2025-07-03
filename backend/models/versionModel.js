const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  version: {
    type: Number,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  changes: {
    type: String,
    default: ''
  },
  isAutoSave: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient querying
versionSchema.index({ documentId: 1, version: -1 });

module.exports = mongoose.model('Version', versionSchema);