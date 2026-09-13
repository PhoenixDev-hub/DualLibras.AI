-- Compatibility patch for existing databases predating classroom descriptions
-- and glossary-to-classroom links. Existing rows retain NULL for new fields.
BEGIN;
SET LOCAL lock_timeout = '5s';
ALTER TABLE public."Classroom" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE public."Glossary" ADD COLUMN IF NOT EXISTS "classroomId" TEXT;
CREATE INDEX IF NOT EXISTS "Glossary_classroomId_idx" ON public."Glossary"("classroomId");
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Glossary_classroomId_fkey'
      AND conrelid = 'public."Glossary"'::regclass
  ) THEN
    ALTER TABLE public."Glossary" ADD CONSTRAINT "Glossary_classroomId_fkey"
      FOREIGN KEY ("classroomId") REFERENCES public."Classroom"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
COMMIT;
