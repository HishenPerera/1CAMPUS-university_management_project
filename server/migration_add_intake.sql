-- Migration: Add intake column to support January and July intakes
-- Run this script once against your PostgreSQL database.
-- Intake values: 'Jan-Jun' (January Intake) | 'Jul-Dec' (July Intake)

ALTER TABLE student_applications ADD COLUMN IF NOT EXISTS intake VARCHAR(10);
ALTER TABLE students              ADD COLUMN IF NOT EXISTS intake VARCHAR(10);
ALTER TABLE modules               ADD COLUMN IF NOT EXISTS intake VARCHAR(10);
ALTER TABLE module_materials      ADD COLUMN IF NOT EXISTS intake VARCHAR(10);
