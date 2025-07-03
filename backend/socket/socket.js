const Document = require('../models/documentModel');
const Version = require('../models/versionModel');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const socketHandlers = (io, socket) => {
  // Authentication for socket
  socket.on('authenticate', async (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user) {
        socket.userId = user._id.toString();
        socket.username = user.username;
        socket.emit('authenticated', { user: { id: user._id, username: user.username } });
      } else {
        socket.emit('authentication-error', { message: 'Invalid token' });
      }
    } catch (error) {
      socket.emit('authentication-error', { message: 'Invalid token' });
    }
  });

  // Join document room
  socket.on('join-document', async (documentId) => {
    try {
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      const document = await Document.findById(documentId);
      
      if (!document) {
        socket.emit('error', { message: 'Document not found' });
        return;
      }

      // Check if user has access
      const hasAccess = document.owner.toString() === socket.userId ||
                       document.collaborators.some(collab => collab.user.toString() === socket.userId) ||
                       document.isPublic;

      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      // Leave any previous document room
      const rooms = Array.from(socket.rooms);
      rooms.forEach(room => {
        if (room !== socket.id && room.startsWith('doc-')) {
          socket.leave(room);
        }
      });

      // Join new document room
      socket.join(`doc-${documentId}`);
      socket.currentDocument = documentId;

      // Add user to active users
      await Document.findByIdAndUpdate(documentId, {
        $pull: { activeUsers: { user: socket.userId } }
      });

      await Document.findByIdAndUpdate(documentId, {
        $push: {
          activeUsers: {
            user: socket.userId,
            socketId: socket.id,
            lastActive: new Date()
          }
        }
      });

      // Get updated active users
      const updatedDoc = await Document.findById(documentId)
        .populate('activeUsers.user', 'username');

      // Notify other users in the room
      socket.to(`doc-${documentId}`).emit('user-joined', {
        user: { id: socket.userId, username: socket.username },
        activeUsers: updatedDoc.activeUsers
      });

      // Send current active users to the joining user
      socket.emit('active-users', updatedDoc.activeUsers);

    } catch (error) {
      console.error('Join document error:', error);
      socket.emit('error', { message: 'Failed to join document' });
    }
  });

  // Handle document content changes
  socket.on('document-change', async (data) => {
    try {
      if (!socket.userId || !socket.currentDocument) {
        socket.emit('error', { message: 'Not authenticated or not in document' });
        return;
      }

      const { content, selection } = data;

      // Update document in database
      await Document.findByIdAndUpdate(socket.currentDocument, {
        content,
        lastModifiedBy: socket.userId,
        lastModified: new Date()
      });

      // Broadcast changes to other users in the room
      socket.to(`doc-${socket.currentDocument}`).emit('document-updated', {
        content,
        selection,
        userId: socket.userId,
        username: socket.username,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Document change error:', error);
      socket.emit('error', { message: 'Failed to update document' });
    }
  });

  // Handle cursor position updates
  socket.on('cursor-position', (data) => {
    if (socket.currentDocument) {
      socket.to(`doc-${socket.currentDocument}`).emit('cursor-update', {
        userId: socket.userId,
        username: socket.username,
        position: data.position,
        selection: data.selection
      });
    }
  });

  // Handle auto-save
  socket.on('auto-save', async (data) => {
    try {
      if (!socket.userId || !socket.currentDocument) {
        return;
      }

      const { content, title } = data;

      // Get latest version number
      const latestVersion = await Version.findOne({ documentId: socket.currentDocument })
        .sort({ version: -1 })
        .select('version');

      const newVersionNumber = latestVersion ? latestVersion.version + 1 : 1;

      // Create auto-save version
      const version = new Version({
        documentId: socket.currentDocument,
        content,
        title,
        version: newVersionNumber,
        createdBy: socket.userId,
        changes: 'Auto-save',
        isAutoSave: true
      });

      await version.save();

      socket.emit('auto-save-complete', { versionId: version._id });

    } catch (error) {
      console.error('Auto-save error:', error);
      socket.emit('error', { message: 'Auto-save failed' });
    }
  });

  // Handle typing indicators
  socket.on('typing-start', () => {
    if (socket.currentDocument) {
      socket.to(`doc-${socket.currentDocument}`).emit('user-typing', {
        userId: socket.userId,
        username: socket.username,
        isTyping: true
      });
    }
  });

  socket.on('typing-stop', () => {
    if (socket.currentDocument) {
      socket.to(`doc-${socket.currentDocument}`).emit('user-typing', {
        userId: socket.userId,
        username: socket.username,
        isTyping: false
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    try {
      if (socket.userId && socket.currentDocument) {
        // Remove user from active users
        await Document.findByIdAndUpdate(socket.currentDocument, {
          $pull: { activeUsers: { user: socket.userId } }
        });

        // Get updated active users
        const updatedDoc = await Document.findById(socket.currentDocument)
          .populate('activeUsers.user', 'username');

        // Notify other users in the room
        socket.to(`doc-${socket.currentDocument}`).emit('user-left', {
          user: { id: socket.userId, username: socket.username },
          activeUsers: updatedDoc.activeUsers
        });
      }

      // Update user offline status
      if (socket.userId) {
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen: new Date()
        });
      }

    } catch (error) {
      console.error('Disconnect error:', error);
    }
  });
};

module.exports = socketHandlers;