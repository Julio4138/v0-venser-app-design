-- ============================================
-- Add program_duration support
-- Allows users to choose different program durations (7, 15, 30, 60, 90, 180, 365 days)
-- ============================================

-- Add program_duration to user_progress
ALTER TABLE public.user_progress 
ADD COLUMN IF NOT EXISTS program_duration INTEGER DEFAULT 90 CHECK (program_duration IN (7, 15, 30, 60, 90, 180, 365));

-- Add program_duration to program_day_templates
ALTER TABLE public.program_day_templates 
ADD COLUMN IF NOT EXISTS program_duration INTEGER DEFAULT 90 CHECK (program_duration IN (7, 15, 30, 60, 90, 180, 365));

-- Update unique constraint to include program_duration
-- First, drop the old unique constraint if it exists
ALTER TABLE public.program_day_templates 
DROP CONSTRAINT IF EXISTS program_day_templates_day_number_key;

-- Add new unique constraint with program_duration
ALTER TABLE public.program_day_templates 
ADD CONSTRAINT program_day_templates_day_duration_unique 
UNIQUE (day_number, program_duration);

-- Update program_days check constraint to allow up to 365 days
ALTER TABLE public.program_days 
DROP CONSTRAINT IF EXISTS program_days_day_number_check;

ALTER TABLE public.program_days 
ADD CONSTRAINT program_days_day_number_check 
CHECK (day_number >= 1 AND day_number <= 365);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_program_day_templates_duration 
ON public.program_day_templates(program_duration);

CREATE INDEX IF NOT EXISTS idx_user_progress_program_duration 
ON public.user_progress(program_duration);

