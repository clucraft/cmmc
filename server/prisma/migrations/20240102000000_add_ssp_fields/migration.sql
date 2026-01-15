-- Add SSP-related fields to Practice, Assessment, and SystemInfo tables

-- Add implementation template field to Practice
ALTER TABLE "Practice" ADD COLUMN "implementationTemplate" TEXT;

-- Add implementation statement and responsible role to Assessment
ALTER TABLE "Assessment" ADD COLUMN "implementationStatement" TEXT;
ALTER TABLE "Assessment" ADD COLUMN "responsibleRole" TEXT;

-- Add additional SSP fields to SystemInfo
ALTER TABLE "SystemInfo" ADD COLUMN "organizationName" TEXT;
ALTER TABLE "SystemInfo" ADD COLUMN "informationTypes" TEXT;
ALTER TABLE "SystemInfo" ADD COLUMN "preparedBy" TEXT;
ALTER TABLE "SystemInfo" ADD COLUMN "preparedDate" TIMESTAMP(3);
ALTER TABLE "SystemInfo" ADD COLUMN "versionNumber" TEXT DEFAULT '1.0';
