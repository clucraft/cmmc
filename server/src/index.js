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
    // Get all practices with their assessments for detailed stats
    const allPractices = await prisma.practice.findMany({
      include: { assessments: true, evidence: true },
    });

    // Get POA&M data including overdue items
    const allPoams = await prisma.pOAM.findMany({
      include: {
        practice: { include: { family: true } },
        milestones: true,
      },
      orderBy: { scheduledCompletionDate: 'asc' },
    });

    // Calculate status counts
    const statusCounts = {
      NOT_STARTED: 0,
      IN_PROGRESS: 0,
      IMPLEMENTED: 0,
      NOT_APPLICABLE: 0,
    };

    // Calculate level breakdown
    const levelStats = {
      level1: { total: 0, implemented: 0 },
      level2: { total: 0, implemented: 0 },
    };

    // Evidence coverage
    let implementedWithEvidence = 0;
    let implementedWithoutEvidence = 0;

    allPractices.forEach((p) => {
      const status = p.assessments[0]?.status || 'NOT_STARTED';
      statusCounts[status]++;

      // Level breakdown
      if (p.cmmcLevel === 1) {
        levelStats.level1.total++;
        if (status === 'IMPLEMENTED' || status === 'NOT_APPLICABLE') {
          levelStats.level1.implemented++;
        }
      } else {
        levelStats.level2.total++;
        if (status === 'IMPLEMENTED' || status === 'NOT_APPLICABLE') {
          levelStats.level2.implemented++;
        }
      }

      // Evidence coverage for implemented practices
      if (status === 'IMPLEMENTED') {
        if (p.evidence && p.evidence.length > 0) {
          implementedWithEvidence++;
        } else {
          implementedWithoutEvidence++;
        }
      }
    });

    // POA&M stats
    const now = new Date();
    const poamCounts = { OPEN: 0, IN_PROGRESS: 0, COMPLETED: 0, DELAYED: 0, CANCELLED: 0 };
    const overduePoams = [];
    const upcomingPoams = [];

    allPoams.forEach((p) => {
      poamCounts[p.status]++;

      // Check for overdue (not completed and past due date)
      if (p.scheduledCompletionDate && p.status !== 'COMPLETED' && p.status !== 'CANCELLED') {
        const dueDate = new Date(p.scheduledCompletionDate);
        const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

        if (daysUntilDue < 0) {
          overduePoams.push({
            id: p.id,
            practiceId: p.practiceId,
            practiceTitle: p.practice.title,
            familyId: p.practice.family.id,
            weakness: p.weakness,
            dueDate: p.scheduledCompletionDate,
            daysOverdue: Math.abs(daysUntilDue),
            priority: p.priority,
            status: p.status,
          });
        } else if (daysUntilDue <= 30) {
          upcomingPoams.push({
            id: p.id,
            practiceId: p.practiceId,
            practiceTitle: p.practice.title,
            familyId: p.practice.family.id,
            weakness: p.weakness,
            dueDate: p.scheduledCompletionDate,
            daysUntilDue,
            priority: p.priority,
            status: p.status,
          });
        }
      }
    });

    // Sort overdue by most overdue first
    overduePoams.sort((a, b) => b.daysOverdue - a.daysOverdue);
    upcomingPoams.sort((a, b) => a.daysUntilDue - b.daysUntilDue);

    // Calculate SPRS score
    let sprsScore = 110;
    allPractices.forEach((p) => {
      const status = p.assessments[0]?.status;
      if (status !== 'IMPLEMENTED' && status !== 'NOT_APPLICABLE') {
        sprsScore -= p.cmmcLevel === 1 ? 5 : 1;
      }
    });
    sprsScore = Math.max(-203, sprsScore);

    const implemented = statusCounts.IMPLEMENTED + statusCounts.NOT_APPLICABLE;
    const compliancePercentage = allPractices.length > 0 ? Math.round((implemented / allPractices.length) * 100) : 0;

    res.json({
      totalPractices: allPractices.length,
      assessmentStatus: statusCounts,
      poamStatus: poamCounts,
      compliancePercentage,
      sprsScore,
      levelStats,
      evidenceCoverage: {
        withEvidence: implementedWithEvidence,
        withoutEvidence: implementedWithoutEvidence,
        percentage: (implementedWithEvidence + implementedWithoutEvidence) > 0
          ? Math.round((implementedWithEvidence / (implementedWithEvidence + implementedWithoutEvidence)) * 100)
          : 0,
      },
      overduePoams: overduePoams.slice(0, 10),
      upcomingPoams: upcomingPoams.slice(0, 10),
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
    const { status, notes, assessedBy, implementationStatement, responsibleRole } = req.body;

    const assessment = await prisma.assessment.upsert({
      where: { practiceId: req.params.practiceId },
      update: {
        status,
        notes,
        assessedBy,
        implementationStatement,
        responsibleRole,
        assessedAt: new Date(),
      },
      create: {
        practiceId: req.params.practiceId,
        status,
        notes,
        assessedBy,
        implementationStatement,
        responsibleRole,
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

// ============ SYSTEM INFO ============
app.get('/api/system-info', async (req, res) => {
  try {
    // Get the first (and should be only) system info record
    let systemInfo = await prisma.systemInfo.findFirst();

    // If none exists, create a default one
    if (!systemInfo) {
      systemInfo = await prisma.systemInfo.create({
        data: {
          organizationName: '',
          systemName: 'New System',
          versionNumber: '1.0',
        },
      });
    }

    res.json(systemInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/system-info', async (req, res) => {
  try {
    const {
      organizationName,
      systemName,
      systemDescription,
      systemOwner,
      securityOfficer,
      systemBoundary,
      networkArchitecture,
      dataFlowDescription,
      informationTypes,
      preparedBy,
      preparedDate,
      versionNumber,
    } = req.body;

    // Get existing system info or create new
    const existing = await prisma.systemInfo.findFirst();

    let systemInfo;
    if (existing) {
      systemInfo = await prisma.systemInfo.update({
        where: { id: existing.id },
        data: {
          organizationName,
          systemName,
          systemDescription,
          systemOwner,
          securityOfficer,
          systemBoundary,
          networkArchitecture,
          dataFlowDescription,
          informationTypes,
          preparedBy,
          preparedDate: preparedDate ? new Date(preparedDate) : null,
          versionNumber,
        },
      });
    } else {
      systemInfo = await prisma.systemInfo.create({
        data: {
          organizationName,
          systemName,
          systemDescription,
          systemOwner,
          securityOfficer,
          systemBoundary,
          networkArchitecture,
          dataFlowDescription,
          informationTypes,
          preparedBy,
          preparedDate: preparedDate ? new Date(preparedDate) : null,
          versionNumber,
        },
      });
    }

    res.json(systemInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ SSP GENERATION ============
app.get('/api/ssp/preview', async (req, res) => {
  try {
    const systemInfo = await prisma.systemInfo.findFirst();

    const practices = await prisma.practice.findMany({
      include: {
        family: true,
        assessments: true,
        evidence: true,
        poams: {
          where: { status: { not: 'COMPLETED' } },
        },
      },
      orderBy: { id: 'asc' },
    });

    // Calculate statistics
    const stats = {
      totalPractices: practices.length,
      implemented: 0,
      inProgress: 0,
      notStarted: 0,
      notApplicable: 0,
      withStatements: 0,
      missingStatements: 0,
      openPoams: 0,
      evidenceCount: 0,
    };

    const warnings = [];

    practices.forEach((p) => {
      const assessment = p.assessments[0];
      const status = assessment?.status || 'NOT_STARTED';

      if (status === 'IMPLEMENTED') stats.implemented++;
      else if (status === 'IN_PROGRESS') stats.inProgress++;
      else if (status === 'NOT_APPLICABLE') stats.notApplicable++;
      else stats.notStarted++;

      if (assessment?.implementationStatement) {
        stats.withStatements++;
      } else {
        stats.missingStatements++;
      }

      if (p.poams.length > 0) stats.openPoams += p.poams.length;
      stats.evidenceCount += p.evidence.length;
    });

    // Generate warnings
    if (!systemInfo?.organizationName) {
      warnings.push('Organization name not specified');
    }
    if (!systemInfo?.systemName) {
      warnings.push('System name not specified');
    }
    if (!systemInfo?.systemBoundary) {
      warnings.push('System boundary not defined');
    }
    if (stats.missingStatements > 0) {
      warnings.push(`${stats.missingStatements} practices missing implementation statements`);
    }
    if (stats.notStarted > 0) {
      warnings.push(`${stats.notStarted} practices not yet assessed`);
    }

    res.json({
      systemInfo: systemInfo || {},
      statistics: stats,
      warnings,
      readyForGeneration: warnings.length <= 2, // Allow generation with minor warnings
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ssp/generate/docx', async (req, res) => {
  try {
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, HeadingLevel, AlignmentType } = require('docx');

    // Fetch all data
    const systemInfo = await prisma.systemInfo.findFirst();
    const families = await prisma.controlFamily.findMany({
      include: {
        practices: {
          include: {
            assessments: true,
            evidence: true,
            poams: {
              where: { status: { not: 'COMPLETED' } },
            },
          },
          orderBy: { id: 'asc' },
        },
      },
      orderBy: { id: 'asc' },
    });

    // Build document sections
    const children = [];

    // Title
    children.push(
      new Paragraph({
        text: 'System Security Plan',
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        text: systemInfo?.systemName || 'System Name',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        text: `Version ${systemInfo?.versionNumber || '1.0'} | Generated ${new Date().toLocaleDateString()}`,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({ text: '' })
    );

    // System Information Section
    children.push(
      new Paragraph({ text: '1. System Identification', heading: HeadingLevel.HEADING_1 }),
      new Paragraph({ text: '' })
    );

    const sysInfoRows = [
      ['Organization Name', systemInfo?.organizationName || 'Not specified'],
      ['System Name', systemInfo?.systemName || 'Not specified'],
      ['System Owner', systemInfo?.systemOwner || 'Not specified'],
      ['Security Officer', systemInfo?.securityOfficer || 'Not specified'],
      ['Prepared By', systemInfo?.preparedBy || 'Not specified'],
    ];

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: sysInfoRows.map(([label, value]) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 30, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ text: label, style: 'strong' })],
              }),
              new TableCell({
                width: { size: 70, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ text: value })],
              }),
            ],
          })
        ),
      }),
      new Paragraph({ text: '' })
    );

    // System Description
    if (systemInfo?.systemDescription) {
      children.push(
        new Paragraph({ text: 'System Description', heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: systemInfo.systemDescription }),
        new Paragraph({ text: '' })
      );
    }

    // System Boundary
    if (systemInfo?.systemBoundary) {
      children.push(
        new Paragraph({ text: 'System Boundary', heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: systemInfo.systemBoundary }),
        new Paragraph({ text: '' })
      );
    }

    // Information Types
    if (systemInfo?.informationTypes) {
      children.push(
        new Paragraph({ text: 'Information Types (CUI Categories)', heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: systemInfo.informationTypes }),
        new Paragraph({ text: '' })
      );
    }

    // Control Implementation Section
    children.push(
      new Paragraph({ text: '2. Security Control Implementation', heading: HeadingLevel.HEADING_1 }),
      new Paragraph({ text: '' })
    );

    // Iterate through each family
    for (const family of families) {
      children.push(
        new Paragraph({ text: `${family.id} - ${family.name}`, heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: family.description || '' }),
        new Paragraph({ text: '' })
      );

      for (const practice of family.practices) {
        const assessment = practice.assessments[0];
        const status = assessment?.status || 'NOT_STARTED';
        const statusText = status.replace('_', ' ');

        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${practice.id} - ${practice.title}`, bold: true }),
              new TextRun({ text: ` (Level ${practice.cmmcLevel})` }),
            ],
            heading: HeadingLevel.HEADING_3,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Status: ', bold: true }),
              new TextRun({ text: statusText }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Requirement: ', bold: true }),
              new TextRun({ text: practice.description }),
            ],
          })
        );

        // Implementation Statement
        const statement = assessment?.implementationStatement || practice.implementationTemplate || 'Implementation statement not provided.';
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Implementation: ', bold: true }),
              new TextRun({ text: statement }),
            ],
          })
        );

        // Responsible Role
        if (assessment?.responsibleRole) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Responsible Role: ', bold: true }),
                new TextRun({ text: assessment.responsibleRole }),
              ],
            })
          );
        }

        // Evidence
        if (practice.evidence.length > 0) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Evidence: ', bold: true }),
                new TextRun({ text: practice.evidence.map((e) => e.name).join(', ') }),
              ],
            })
          );
        }

        // POA&M reference
        if (practice.poams.length > 0) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'POA&M: ', bold: true }),
                new TextRun({ text: `${practice.poams.length} open item(s)` }),
              ],
            })
          );
        }

        children.push(new Paragraph({ text: '' }));
      }
    }

    // POA&M Summary Section
    const allPoams = families.flatMap((f) => f.practices.flatMap((p) => p.poams.map((poam) => ({ ...poam, practiceId: p.id, practiceTitle: p.title }))));

    if (allPoams.length > 0) {
      children.push(
        new Paragraph({ text: '3. Plan of Action and Milestones (POA&M) Summary', heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: '' })
      );

      const poamTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: ['Practice', 'Weakness', 'Status', 'Priority', 'Due Date'].map(
              (text) =>
                new TableCell({
                  children: [new Paragraph({ text, style: 'strong' })],
                })
            ),
          }),
          ...allPoams.slice(0, 20).map(
            (poam) =>
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: poam.practiceId })] }),
                  new TableCell({ children: [new Paragraph({ text: poam.weakness?.substring(0, 50) + '...' || '' })] }),
                  new TableCell({ children: [new Paragraph({ text: poam.status })] }),
                  new TableCell({ children: [new Paragraph({ text: poam.priority })] }),
                  new TableCell({ children: [new Paragraph({ text: poam.scheduledCompletionDate ? new Date(poam.scheduledCompletionDate).toLocaleDateString() : 'N/A' })] }),
                ],
              })
          ),
        ],
      });

      children.push(poamTable);
    }

    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children,
        },
      ],
    });

    // Generate buffer
    const buffer = await Packer.toBuffer(doc);

    // Set headers and send
    const filename = `SSP-${(systemInfo?.systemName || 'System').replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error('SSP Generation Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`CMMC Server running on port ${PORT}`);
});
