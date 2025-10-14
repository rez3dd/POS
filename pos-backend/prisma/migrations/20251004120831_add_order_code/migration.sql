/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Menu` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN "code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Menu_name_key" ON "Menu"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Order_code_key" ON "Order"("code");
