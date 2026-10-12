-- CreateEnum
CREATE TYPE "Role" AS ENUM ('EMPLOYEE', 'MANAGER', 'HR', 'EXECUTIVE');
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('TODO', 'PROGRESS', 'BLOCKED', 'DONE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "title" TEXT,
    "dept" TEXT,
    "city" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "onLeave" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);
-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sub" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "pct" INTEGER NOT NULL,
    "team" INTEGER NOT NULL,
    "lead" TEXT NOT NULL,
    "milestone" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "desc" TEXT NOT NULL DEFAULT '',
    "priority" TEXT NOT NULL,
    "due" TIMESTAMP(3) NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'TODO',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT,
    "projectId" TEXT NOT NULL,
    "assigneeId" TEXT,
    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "who" TEXT NOT NULL,
    "what" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "from" TIMESTAMP(3) NOT NULL,
    "to" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Risk" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "dept" TEXT NOT NULL,
    "next" TEXT NOT NULL,
    CONSTRAINT "Risk_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "due" TIMESTAMP(3) NOT NULL,
    "note" TEXT NOT NULL,
    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "Revenue" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "product" INTEGER NOT NULL,
    "services" INTEGER NOT NULL,
    "sales" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "Revenue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
CREATE UNIQUE INDEX "Project_name_key" ON "Project"("name");
CREATE INDEX "Task_assigneeId_idx" ON "Task"("assigneeId");
CREATE INDEX "Activity_userId_idx" ON "Activity"("userId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
