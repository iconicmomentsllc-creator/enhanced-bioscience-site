-- CreateTable
CREATE TABLE "EvaluationRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "publicRef" TEXT NOT NULL,
    "encounterNumber" TEXT,
    "encounterId" TEXT,
    "orderId" TEXT,
    "orderNumber" TEXT,
    "productId" TEXT,
    "packageId" TEXT,
    "encounterTypeId" TEXT,
    "shippingState" TEXT,
    "customerStatus" TEXT NOT NULL DEFAULT 'received',
    "trackingNumber" TEXT,
    "paymentState" TEXT NOT NULL DEFAULT 'not_required',
    "gatewayTransactionId" TEXT,
    "amountCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "billingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isSandbox" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationRequest_idempotencyKey_key" ON "EvaluationRequest"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationRequest_publicRef_key" ON "EvaluationRequest"("publicRef");

-- CreateIndex
CREATE INDEX "EvaluationRequest_userId_idx" ON "EvaluationRequest"("userId");

-- CreateIndex
CREATE INDEX "EvaluationRequest_encounterId_idx" ON "EvaluationRequest"("encounterId");

-- CreateIndex
CREATE INDEX "EvaluationRequest_encounterNumber_idx" ON "EvaluationRequest"("encounterNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookDelivery_webhookId_key" ON "WebhookDelivery"("webhookId");

-- AddForeignKey
ALTER TABLE "EvaluationRequest" ADD CONSTRAINT "EvaluationRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
