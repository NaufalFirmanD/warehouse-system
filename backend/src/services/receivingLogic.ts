export interface LineItemQuantity {
  expectedQuantity: number;
  receivedQuantity: number;
}

export class ReceivingDomainError extends Error {
  code: string;
  statusCode: number;
  constructor(message: string, code = 'BUSINESS_RULE_VIOLATION', statusCode = 422) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Calculates remaining receivable quantity for a line item
 */
export function calculateRemainingQuantity(expectedQuantity: number, receivedQuantity: number): number {
  return Math.max(0, expectedQuantity - receivedQuantity);
}

/**
 * Validates whether an incoming receipt quantity is valid.
 * Strict Rule: Prevent users from receiving more than the remaining expected quantity.
 */
export function validateReceivingQuantity(
  expectedQuantity: number,
  alreadyReceivedQuantity: number,
  incomingQuantity: number
): { valid: boolean; remainingBefore: number; remainingAfter: number } {
  if (!Number.isInteger(incomingQuantity) || incomingQuantity <= 0) {
    throw new ReceivingDomainError(
      `Receipt quantity must be a positive integer. Received: ${incomingQuantity}`,
      'INVALID_QUANTITY',
      400
    );
  }

  const remainingBefore = expectedQuantity - alreadyReceivedQuantity;

  if (incomingQuantity > remainingBefore) {
    throw new ReceivingDomainError(
      `Over-receiving rejected: Cannot receive ${incomingQuantity} units. Only ${remainingBefore} units remaining expected (Expected: ${expectedQuantity}, Already Received: ${alreadyReceivedQuantity}).`,
      'OVER_RECEIVING_ERROR',
      422
    );
  }

  return {
    valid: true,
    remainingBefore,
    remainingAfter: remainingBefore - incomingQuantity,
  };
}

/**
 * Validates document completion rule:
 * A receiving document must not be completed unless all its items have been fully received.
 */
export function isDocumentEligibleForCompletion(items: LineItemQuantity[]): boolean {
  if (!items || items.length === 0) return false;
  return items.every((item) => item.receivedQuantity === item.expectedQuantity);
}

/**
 * Validates receiving document status transitions
 */
export function validateDocumentStatusTransition(
  currentStatus: string,
  targetStatus: string,
  items: LineItemQuantity[]
): { allowed: boolean; reason?: string } {
  if (currentStatus === targetStatus) {
    return { allowed: true };
  }

  if (currentStatus === 'COMPLETED') {
    throw new ReceivingDomainError('Completed documents cannot change status.', 'DOCUMENT_LOCKED');
  }

  if (currentStatus === 'CANCELED') {
    throw new ReceivingDomainError('Canceled documents cannot change status.', 'DOCUMENT_LOCKED');
  }

  if (targetStatus === 'COMPLETED') {
    const eligible = isDocumentEligibleForCompletion(items);
    if (!eligible) {
      throw new ReceivingDomainError(
        'Cannot complete receiving document: not all items have been fully received.',
        'INCOMPLETE_ITEMS_ERROR',
        422
      );
    }
  }

  if (targetStatus === 'CANCELED') {
    const anyReceived = items.some((it) => it.receivedQuantity > 0);
    if (anyReceived) {
      throw new ReceivingDomainError(
        'Cannot cancel receiving document: items have already been received into inventory.',
        'CANCELLATION_ERROR',
        422
      );
    }
  }

  return { allowed: true };
}
