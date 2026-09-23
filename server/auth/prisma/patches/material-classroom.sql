BEGIN;


ALTER TABLE "Material" ADD COLUMN IF NOT EXISTS "classroomId" TEXT;


CREATE INDEX IF NOT EXISTS "Material_classroomId_idx" ON "Material"("classroomId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Material_classroomId_fkey' AND conrelid = '"Material"'::regclass) THEN
    ALTER TABLE "Material" ADD CONSTRAINT "Material_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;


UPDATE "Material" m
SET "classroomId" = l."classroomId"
FROM "Lesson" l
WHERE m."lessonId" = l.id
  AND m."classroomId" IS NULL;


COMMIT;
