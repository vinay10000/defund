import { Express, Request, Response } from 'express';
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { mongoDBStorage as storage } from '../storage-mongodb';
import { fileURLToPath } from 'url';

// Get current file path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
const profileUploadsDir = path.join(uploadsDir, 'profiles');
const upiUploadsDir = path.join(uploadsDir, 'upi');
const documentUploadsDir = path.join(uploadsDir, 'documents');

// Create directories if they don't exist
[uploadsDir, profileUploadsDir, upiUploadsDir, documentUploadsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer storage
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine destination based on file type
    if (file.fieldname === 'profile') {
      cb(null, profileUploadsDir);
    } else if (file.fieldname === 'upi') {
      cb(null, upiUploadsDir);
    } else if (file.fieldname === 'document') {
      cb(null, documentUploadsDir);
    } else {
      cb(null, uploadsDir);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Configure multer upload
const upload = multer({
  storage: fileStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only certain file types
    const allowedFileTypes = {
      profile: ['.jpg', '.jpeg', '.png', '.gif'],
      upi: ['.jpg', '.jpeg', '.png', '.gif', '.pdf'],
      document: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']
    };
    
    const extname = path.extname(file.originalname).toLowerCase();
    let allowed = false;
    
    if (file.fieldname === 'profile' && allowedFileTypes.profile.includes(extname)) {
      allowed = true;
    } else if (file.fieldname === 'upi' && allowedFileTypes.upi.includes(extname)) {
      allowed = true;
    } else if (file.fieldname === 'document' && allowedFileTypes.document.includes(extname)) {
      allowed = true;
    }
    
    if (allowed) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${extname} is not allowed for ${file.fieldname} uploads`));
    }
  }
});

export function setupUploads(app: Express) {
  // Route for serving uploaded files
  app.use('/uploads', express.static(uploadsDir));

  // Profile picture upload route
  app.post('/api/upload/profile', (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const profileUpload = upload.single('profile');
    
    profileUpload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          message: "File upload failed",
          error: err.message
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          message: "No file provided"
        });
      }
      
      try {
        // Create the file path relative to the server
        const filePath = `/uploads/profiles/${req.file.filename}`;
        
        // Update the user's profile picture
        const userId = req.user.id;
        const updatedUser = await storage.updateUserProfile(userId, filePath);
        
        if (!updatedUser) {
          return res.status(404).json({
            message: "User not found"
          });
        }
        
        // If user is a startup, update the startup's profile picture as well
        if (req.user.role === 'startup') {
          const startup = await storage.getStartupByUserId(userId);
          if (startup) {
            await storage.updateStartupImage(startup.id, filePath);
          }
        }
        
        res.status(200).json({
          message: "Profile picture uploaded successfully",
          filePath,
          user: updatedUser
        });
      } catch (error) {
        const err = error as Error;
        console.error('Profile upload error:', err);
        res.status(500).json({
          message: "Server error during profile update",
          error: err.message
        });
      }
    });
  });
  
  // UPI QR code upload route
  app.post('/api/upload/upi', (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const upiUpload = upload.single('upi');
    
    upiUpload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          message: "File upload failed",
          error: err.message
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          message: "No file provided"
        });
      }
      
      try {
        // Create the file path relative to the server
        const filePath = `/uploads/upi/${req.file.filename}`;
        
        // Update the user's UPI QR code
        const userId = req.user.id;
        const upiId = req.body.upiId || null;
        
        // Update UPI details
        const updatedUser = await storage.updateUserUpiQr(userId, filePath, upiId);
        
        if (!updatedUser) {
          return res.status(404).json({
            message: "User not found"
          });
        }
        
        res.status(200).json({
          message: "UPI QR code uploaded successfully",
          filePath,
          user: updatedUser
        });
      } catch (error) {
        const err = error as Error;
        console.error('UPI upload error:', err);
        res.status(500).json({
          message: "Server error during UPI QR update",
          error: err.message
        });
      }
    });
  });
  
  // Document upload route
  app.post('/api/upload/document', (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Check if user is a startup
    if (req.user.role !== 'startup') {
      return res.status(403).json({
        message: "Only startup users can upload documents"
      });
    }
    
    const documentUpload = upload.single('document');
    
    documentUpload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          message: "File upload failed",
          error: err.message
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          message: "No file provided"
        });
      }
      
      if (!req.body.title) {
        return res.status(400).json({
          message: "Document title is required"
        });
      }
      
      try {
        // Get the startup ID
        const startup = await storage.getStartupByUserId(req.user.id);
        if (!startup) {
          return res.status(404).json({
            message: "Startup not found"
          });
        }
        
        // Create the file path relative to the server
        const filePath = `/uploads/documents/${req.file.filename}`;
        
        // Create the document
        const document = await storage.createDocument({
          name: req.body.title, // Use title as the name
          path: filePath,
          type: path.extname(req.file.originalname).substring(1),
          sizeInMb: req.file.size / (1024 * 1024), // Convert bytes to MB
          startupId: startup.id
        });
        
        res.status(201).json({
          message: "Document uploaded successfully",
          document
        });
      } catch (error) {
        const err = error as Error;
        console.error('Document upload error:', err);
        res.status(500).json({
          message: "Server error during document upload",
          error: err.message
        });
      }
    });
  });
}