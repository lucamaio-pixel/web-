-- AlterTable
ALTER TABLE "CategoryRule" ADD COLUMN "subcategoryId" TEXT;

-- CreateTable
CREATE TABLE "Subcategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pilastroId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subcategory_pilastroId_fkey" FOREIGN KEY ("pilastroId") REFERENCES "Pilastro" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "pilastroId" TEXT,
    "subcategoryId" TEXT,
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
    CONSTRAINT "Transaction_pilastroId_fkey" FOREIGN KEY ("pilastroId") REFERENCES "Pilastro" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("accountId", "amount", "bookedDate", "createdAt", "date", "deleted", "description", "hashId", "id", "isDebtPayment", "isInternalTransfer", "isReceiptScanned", "manualCategory", "merchant", "notes", "pilastroId", "rawData", "receiptImageUrl", "type", "updatedAt") SELECT "accountId", "amount", "bookedDate", "createdAt", "date", "deleted", "description", "hashId", "id", "isDebtPayment", "isInternalTransfer", "isReceiptScanned", "manualCategory", "merchant", "notes", "pilastroId", "rawData", "receiptImageUrl", "type", "updatedAt" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE UNIQUE INDEX "Transaction_hashId_key" ON "Transaction"("hashId");
CREATE INDEX "Transaction_accountId_date_idx" ON "Transaction"("accountId", "date");
CREATE INDEX "Transaction_pilastroId_idx" ON "Transaction"("pilastroId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Subcategory_pilastroId_key_key" ON "Subcategory"("pilastroId", "key");
