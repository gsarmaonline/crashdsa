-- AlterTable
ALTER TABLE "Problem" ADD COLUMN "description" TEXT,
ADD COLUMN "examples" JSONB,
ADD COLUMN "constraints" JSONB;

-- AlterTable
ALTER TABLE "TestCaseSet" ADD COLUMN "starterCode" JSONB,
ADD COLUMN "functionNameMap" JSONB;
