-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('Easy', 'Medium', 'Hard');

-- CreateTable
CREATE TABLE "Problem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "link" TEXT NOT NULL,
    "acceptance" DOUBLE PRECISION,
    "frequency" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pattern" (
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "keywords" TEXT[],
    "tagMappings" TEXT[],

    CONSTRAINT "Pattern_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "SourceSheet" (
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,

    CONSTRAINT "SourceSheet_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "Tag" (
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "ProblemPattern" (
    "problemId" TEXT NOT NULL,
    "patternName" TEXT NOT NULL,

    CONSTRAINT "ProblemPattern_pkey" PRIMARY KEY ("problemId","patternName")
);

-- CreateTable
CREATE TABLE "ProblemSheet" (
    "problemId" TEXT NOT NULL,
    "sheetName" TEXT NOT NULL,

    CONSTRAINT "ProblemSheet_pkey" PRIMARY KEY ("problemId","sheetName")
);

-- CreateTable
CREATE TABLE "ProblemTag" (
    "problemId" TEXT NOT NULL,
    "tagName" TEXT NOT NULL,

    CONSTRAINT "ProblemTag_pkey" PRIMARY KEY ("problemId","tagName")
);

-- CreateTable
CREATE TABLE "TestCaseSet" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "functionName" TEXT NOT NULL,
    "params" JSONB NOT NULL,
    "returnType" TEXT NOT NULL,
    "notes" TEXT,
    "outputOrderMatters" BOOLEAN NOT NULL DEFAULT true,
    "isDesignProblem" BOOLEAN NOT NULL DEFAULT false,
    "designMethods" JSONB,
    "status" TEXT NOT NULL DEFAULT 'scaffold',
    "problemId" TEXT NOT NULL,

    CONSTRAINT "TestCaseSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestCase" (
    "id" TEXT NOT NULL,
    "inputs" JSONB NOT NULL,
    "expected" JSONB NOT NULL,
    "explanation" TEXT,
    "tags" TEXT[],
    "testCaseSetId" TEXT NOT NULL,

    CONSTRAINT "TestCase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Problem_slug_key" ON "Problem"("slug");

-- CreateIndex
CREATE INDEX "Problem_difficulty_idx" ON "Problem"("difficulty");

-- CreateIndex
CREATE INDEX "ProblemPattern_patternName_idx" ON "ProblemPattern"("patternName");

-- CreateIndex
CREATE INDEX "ProblemSheet_sheetName_idx" ON "ProblemSheet"("sheetName");

-- CreateIndex
CREATE INDEX "ProblemTag_tagName_idx" ON "ProblemTag"("tagName");

-- CreateIndex
CREATE UNIQUE INDEX "TestCaseSet_slug_key" ON "TestCaseSet"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TestCaseSet_problemId_key" ON "TestCaseSet"("problemId");

-- CreateIndex
CREATE INDEX "TestCase_testCaseSetId_idx" ON "TestCase"("testCaseSetId");

-- AddForeignKey
ALTER TABLE "ProblemPattern" ADD CONSTRAINT "ProblemPattern_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemPattern" ADD CONSTRAINT "ProblemPattern_patternName_fkey" FOREIGN KEY ("patternName") REFERENCES "Pattern"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemSheet" ADD CONSTRAINT "ProblemSheet_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemSheet" ADD CONSTRAINT "ProblemSheet_sheetName_fkey" FOREIGN KEY ("sheetName") REFERENCES "SourceSheet"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemTag" ADD CONSTRAINT "ProblemTag_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemTag" ADD CONSTRAINT "ProblemTag_tagName_fkey" FOREIGN KEY ("tagName") REFERENCES "Tag"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCaseSet" ADD CONSTRAINT "TestCaseSet_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_testCaseSetId_fkey" FOREIGN KEY ("testCaseSetId") REFERENCES "TestCaseSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
