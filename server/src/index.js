const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = /pdf|doc|docx|xls|xlsx|png|jpg|jpeg|gif|txt|csv|zip/;
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CMMC API is running' });
});

// ============ DASHBOARD ============
app.get('/api/dashboard', async (req, res) => {
  try {
    const [practices, assessments, poams] = await Promise.all([
      prisma.practice.count(),
      prisma.assessment.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.pOAM.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    const statusCounts = {
      NOT_STARTED: 0,
      IN_PROGRESS: 0,
      IMPLEMENTED: 0,
      NOT_APPLICABLE: 0,
    };

    assessments.forEach((a) => {
      statusCounts[a.status] = a._count.status;
    });

    const poamCounts = {
      OPEN: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      DELAYED: 0,
      CANCELLED: 0,
    };

    poams.forEach((p) => {
      poamCounts[p.status] = p._count.status;
    });

    const implemented = statusCounts.IMPLEMENTED + statusCounts.NOT_APPLICABLE;
    const compliancePercentage = practices > 0 ? Math.round((implemented / practices) * 100) : 0;

    res.json({
      totalPractices: practices,
      assessmentStatus: statusCounts,
      poamStatus: poamCounts,
      compliancePercentage,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ CONTROL FAMILIES ============
app.get('/api/families', async (req, res) => {
  try {
    const families = await prisma.controlFamily.findMany({
      include: {
        practices: {
          include: {
            assessments: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    const familiesWithStats = families.map((family) => {
      const total = family.practices.length;
      const implemented = family.practices.filter(
        (p) => p.assessments[0]?.status === 'IMPLEMENTED' || p.assessments[0]?.status === 'NOT_APPLICABLE'
      ).length;

      return {
        id: family.id,
        name: family.name,
        description: family.description,
        totalPractices: total,
        implementedPractices: implemented,
        compliancePercentage: total > 0 ? Math.round((implemented / total) * 100) : 0,
      };
    });

    res.json(familiesWithStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ PRACTICES ============
app.get('/api/practices', async (req, res) => {
  try {
    const { familyId, level, status } = req.query;

    const where = {};
    if (familyId) where.familyId = familyId;
    if (level) where.cmmcLevel = parseInt(level);

    const practices = await prisma.practice.findMany({
      where,
      include: {
        family: true,
        assessments: true,
        poams: {
          where: { status: { not: 'COMPLETED' } },
        },
        evidence: true,
      },
      orderBy: { id: 'asc' },
    });

    let filtered = practices;
    if (status) {
      filtered = practices.filter((p) => p.assessments[0]?.status === status);
    }

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/practices/:id', async (req, res) => {
  try {
    const practice = await prisma.practice.findUnique({
      where: { id: req.params.id },
      include: {
        family: true,
        assessments: true,
        poams: {
          include: { milestones: true },
        },
        evidence: true,
      },
    });

    if (!practice) {
      return res.status(404).json({ error: 'Practice not found' });
    }

    res.json(practice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ASSESSMENTS ============
app.put('/api/assessments/:practiceId', async (req, res) => {
  try {
    const { status, notes, assessedBy } = req.body;

    const assessment = await prisma.assessment.upsert({
      where: { practiceId: req.params.practiceId },
      update: {
        status,
        notes,
        assessedBy,
        assessedAt: new Date(),
      },
      create: {
        practiceId: req.params.practiceId,
        status,
        notes,
        assessedBy,
        assessedAt: new Date(),
      },
    });

    res.json(assessment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ POA&Ms ============
app.get('/api/poams', async (req, res) => {
  try {
    const { status, priority } = req.query;

    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const poams = await prisma.pOAM.findMany({
      where,
      include: {
        practice: {
          include: { family: true },
        },
        milestones: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(poams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/poams', async (req, res) => {
  try {
    const { practiceId, weakness, resources, scheduledCompletionDate, assignedTo, priority, comments } = req.body;

    const poam = await prisma.pOAM.create({
      data: {
        practiceId,
        weakness,
        resources,
        scheduledCompletionDate: scheduledCompletionDate ? new Date(scheduledCompletionDate) : null,
        assignedTo,
        priority: priority || 'MEDIUM',
        comments,
      },
      include: {
        practice: true,
        milestones: true,
      },
    });

    res.status(201).json(poam);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/poams/:id', async (req, res) => {
  try {
    const { weakness, resources, scheduledCompletionDate, actualCompletionDate, status, assignedTo, priority, comments } = req.body;

    const poam = await prisma.pOAM.update({
      where: { id: req.params.id },
      data: {
        weakness,
        resources,
        scheduledCompletionDate: scheduledCompletionDate ? new Date(scheduledCompletionDate) : null,
        actualCompletionDate: actualCompletionDate ? new Date(actualCompletionDate) : null,
        status,
        assignedTo,
        priority,
        comments,
      },
      include: {
        practice: true,
        milestones: true,
      },
    });

    res.json(poam);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/poams/:id', async (req, res) => {
  try {
    await prisma.pOAM.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ MILESTONES ============
app.post('/api/poams/:poamId/milestones', async (req, res) => {
  try {
    const { description, dueDate } = req.body;

    const milestone = await prisma.milestone.create({
      data: {
        poamId: req.params.poamId,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    res.status(201).json(milestone);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/milestones/:id', async (req, res) => {
  try {
    const { description, dueDate, completed } = req.body;

    const milestone = await prisma.milestone.update({
      where: { id: req.params.id },
      data: {
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        completed,
        completedAt: completed ? new Date() : null,
      },
    });

    res.json(milestone);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ EVIDENCE ============
app.post('/api/practices/:practiceId/evidence', upload.single('file'), async (req, res) => {
  try {
    const { description, uploadedBy } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const evidence = await prisma.evidence.create({
      data: {
        practiceId: req.params.practiceId,
        name: file.originalname,
        description: description || null,
        fileType: path.extname(file.originalname).slice(1).toLowerCase(),
        filePath: `/uploads/${file.filename}`,
        uploadedBy: uploadedBy || null,
      },
    });

    res.status(201).json(evidence);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/evidence/:id/download', async (req, res) => {
  try {
    const evidence = await prisma.evidence.findUnique({
      where: { id: req.params.id },
    });

    if (!evidence || !evidence.filePath) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(__dirname, '..', evidence.filePath);
    res.download(filePath, evidence.name);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/evidence/:id', async (req, res) => {
  try {
    const evidence = await prisma.evidence.findUnique({
      where: { id: req.params.id },
    });

    if (evidence && evidence.filePath) {
      const filePath = path.join(__dirname, '..', evidence.filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.evidence.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ REPORTS ============
app.get('/api/reports/sprs-score', async (req, res) => {
  try {
    const practices = await prisma.practice.findMany({
      include: { assessments: true },
    });

    // SPRS scoring: Start at 110, subtract points for non-implemented controls
    // Simplified scoring - in reality, each control has specific point values
    let score = 110;
    const gaps = [];

    practices.forEach((p) => {
      const status = p.assessments[0]?.status;
      if (status !== 'IMPLEMENTED' && status !== 'NOT_APPLICABLE') {
        // Deduct points (simplified - actual SPRS has specific weights)
        const deduction = p.cmmcLevel === 1 ? 5 : 1;
        score -= deduction;
        gaps.push({
          id: p.id,
          title: p.title,
          level: p.cmmcLevel,
          status: status || 'NOT_STARTED',
        });
      }
    });

    res.json({
      sprsScore: Math.max(-203, score),
      maxScore: 110,
      minScore: -203,
      gapCount: gaps.length,
      gaps: gaps.slice(0, 20), // Return top 20 gaps
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reports/compliance-by-family', async (req, res) => {
  try {
    const families = await prisma.controlFamily.findMany({
      include: {
        practices: {
          include: { assessments: true },
        },
      },
    });

    const report = families.map((family) => {
      const total = family.practices.length;
      const byStatus = {
        IMPLEMENTED: 0,
        IN_PROGRESS: 0,
        NOT_STARTED: 0,
        NOT_APPLICABLE: 0,
      };

      family.practices.forEach((p) => {
        const status = p.assessments[0]?.status || 'NOT_STARTED';
        byStatus[status]++;
      });

      return {
        familyId: family.id,
        familyName: family.name,
        total,
        ...byStatus,
        compliancePercentage: total > 0 ? Math.round(((byStatus.IMPLEMENTED + byStatus.NOT_APPLICABLE) / total) * 100) : 0,
      };
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`CMMC Server running on port ${PORT}`);
});
