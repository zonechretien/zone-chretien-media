-- CreateTable
CREATE TABLE "newsletter_subscribers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_email_key" ON "newsletter_subscribers"("email");
