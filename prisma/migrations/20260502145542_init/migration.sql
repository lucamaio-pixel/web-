-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "iban" TEXT,
    "ownerName" TEXT,
    "color" TEXT NOT NULL DEFAULT '#059669',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Pilastro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "description" TEXT,
    "monthlyBudget" REAL NOT NULL,
    "goalAmount" REAL,
    "currentBalance" REAL NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Allocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pilastroId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "budgeted" REAL NOT NULL,
    "spent" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Allocation_pilastroId_fkey" FOREIGN KEY ("pilastroId") REFERENCES "Pilastro" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "pilastroId" TEXT,
    "date" DATETIME NOT NULL,
    "bookedDate" DATETIME,
    "type" TEXT NOT NULL,
    "merchant" TEXT,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "rawData" TEXT,
    "isInternalTransfer" BOOLEAN NOT NULL DEFAULT false,
    "isDebtPayment" BOOLEAN NOT NULL DEFAULT false,
    "isReceiptScanned" BOOLEAN NOT NULL DEFAULT false,
    "receiptImageUrl" TEXT,
    "notes" TEXT,
    "manualCategory" BOOLEAN NOT NULL DEFAULT false,
    "hashId" TEXT NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transaction_pilastroId_fkey" FOREIGN KEY ("pilastroId") REFERENCES "Pilastro" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CategoryRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pattern" TEXT NOT NULL,
    "matchField" TEXT NOT NULL DEFAULT 'merchant',
    "pilastroId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DebtPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Installment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "debtPlanId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "creditor" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Installment_debtPlanId_fkey" FOREIGN KEY ("debtPlanId") REFERENCES "DebtPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🎯',
    "targetAmount" REAL NOT NULL,
    "currentAmount" REAL NOT NULL DEFAULT 0,
    "monthlyContribution" REAL NOT NULL DEFAULT 0,
    "targetDate" DATETIME,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_name_key" ON "Account"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Pilastro_key_key" ON "Pilastro"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Allocation_pilastroId_month_key" ON "Allocation"("pilastroId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_hashId_key" ON "Transaction"("hashId");

-- CreateIndex
CREATE INDEX "Transaction_accountId_date_idx" ON "Transaction"("accountId", "date");

-- CreateIndex
CREATE INDEX "Transaction_pilastroId_idx" ON "Transaction"("pilastroId");

-- CreateIndex
CREATE UNIQUE INDEX "DebtPlan_name_key" ON "DebtPlan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Installment_debtPlanId_month_creditor_key" ON "Installment"("debtPlanId", "month", "creditor");
