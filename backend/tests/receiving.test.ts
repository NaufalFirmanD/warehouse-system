import { describe, it, expect } from 'vitest';
import {
  calculateRemainingQuantity,
  validateReceivingQuantity,
  isDocumentEligibleForCompletion,
  validateDocumentStatusTransition,
  ReceivingDomainError,
} from '../src/services/receivingLogic';

describe('Warehouse Receiving Domain Rules & Quantity Validation', () => {
  describe('Rule 1: Remaining Quantity Calculation', () => {
    it('calculates remaining quantity correctly when zero received', () => {
      const remaining = calculateRemainingQuantity(100, 0);
      expect(remaining).toBe(100);
    });

    it('calculates remaining quantity correctly after partial receipt', () => {
      const remaining = calculateRemainingQuantity(100, 45);
      expect(remaining).toBe(55);
    });

    it('returns zero remaining when fully received', () => {
      const remaining = calculateRemainingQuantity(50, 50);
      expect(remaining).toBe(0);
    });
  });

  describe('Rule 2: Over-Receiving Prevention (Strict Enforcement)', () => {
    it('accepts valid partial receipt within remaining bound', () => {
      // Expected 20, Already 0, Incoming 8
      const res = validateReceivingQuantity(20, 0, 8);
      expect(res.valid).toBe(true);
      expect(res.remainingBefore).toBe(20);
      expect(res.remainingAfter).toBe(12);
    });

    it('accepts exact full receipt matching remaining quantity', () => {
      // Expected 20, Already 12, Incoming 8
      const res = validateReceivingQuantity(20, 12, 8);
      expect(res.valid).toBe(true);
      expect(res.remainingBefore).toBe(8);
      expect(res.remainingAfter).toBe(0);
    });

    it('REJECTS receipt if incoming quantity exceeds remaining expected (Initial batch)', () => {
      // Expected 10, Already 0, Attempting to receive 15 -> REJECT
      expect(() => validateReceivingQuantity(10, 0, 15)).toThrowError(ReceivingDomainError);
      try {
        validateReceivingQuantity(10, 0, 15);
      } catch (err: any) {
        expect(err.code).toBe('OVER_RECEIVING_ERROR');
        expect(err.statusCode).toBe(422);
        expect(err.message).toContain('Over-receiving rejected');
      }
    });

    it('REJECTS receipt if incoming quantity exceeds remaining expected (Partial batch)', () => {
      // Expected 50, Already received 45 (Remaining = 5), Attempting 6 -> REJECT
      expect(() => validateReceivingQuantity(50, 45, 6)).toThrowError(ReceivingDomainError);
    });

    it('rejects invalid non-positive or decimal quantities', () => {
      expect(() => validateReceivingQuantity(10, 0, 0)).toThrowError();
      expect(() => validateReceivingQuantity(10, 0, -5)).toThrowError();
      expect(() => validateReceivingQuantity(10, 0, 4.5)).toThrowError();
    });
  });

  describe('Rule 3: Document Completion Criteria', () => {
    it('prevents completion if document has no items', () => {
      expect(isDocumentEligibleForCompletion([])).toBe(false);
    });

    it('prevents completion if any line item has received_quantity < expected_quantity', () => {
      const items = [
        { expectedQuantity: 20, receivedQuantity: 20 },
        { expectedQuantity: 50, receivedQuantity: 49 }, // 1 item missing!
      ];
      expect(isDocumentEligibleForCompletion(items)).toBe(false);

      expect(() =>
        validateDocumentStatusTransition('RECEIVING', 'COMPLETED', items)
      ).toThrowError(ReceivingDomainError);
    });

    it('allows completion when 100% of items are fully received', () => {
      const items = [
        { expectedQuantity: 20, receivedQuantity: 20 },
        { expectedQuantity: 50, receivedQuantity: 50 },
      ];
      expect(isDocumentEligibleForCompletion(items)).toBe(true);

      const transition = validateDocumentStatusTransition('RECEIVING', 'COMPLETED', items);
      expect(transition.allowed).toBe(true);
    });

    it('prevents status alteration once document is COMPLETED', () => {
      const items = [{ expectedQuantity: 10, receivedQuantity: 10 }];
      expect(() =>
        validateDocumentStatusTransition('COMPLETED', 'RECEIVING', items)
      ).toThrowError(ReceivingDomainError);
    });

    it('prevents cancellation if any items have already been received into stock', () => {
      const items = [
        { expectedQuantity: 100, receivedQuantity: 5 }, // 5 units in stock!
      ];
      expect(() =>
        validateDocumentStatusTransition('RECEIVING', 'CANCELED', items)
      ).toThrowError(ReceivingDomainError);
    });
  });

  describe('Rule 4: Multi-Step Receiving Lifecycle Simulation', () => {
    it('simulates accurate stock progression across multiple split shipments', () => {
      const expectedTotal = 100;
      let alreadyReceived = 0;
      let inventoryStock = 0;

      // Delivery 1: 30 units arrive
      const batch1 = validateReceivingQuantity(expectedTotal, alreadyReceived, 30);
      alreadyReceived += 30;
      inventoryStock += 30;
      expect(batch1.remainingAfter).toBe(70);
      expect(alreadyReceived).toBe(30);
      expect(inventoryStock).toBe(30);

      // Delivery 2: 50 units arrive
      const batch2 = validateReceivingQuantity(expectedTotal, alreadyReceived, 50);
      alreadyReceived += 50;
      inventoryStock += 50;
      expect(batch2.remainingAfter).toBe(20);
      expect(alreadyReceived).toBe(80);
      expect(inventoryStock).toBe(80);

      // Delivery 3: Operator accidentally types 25 instead of 20 -> Must fail and preserve stock!
      expect(() => validateReceivingQuantity(expectedTotal, alreadyReceived, 25)).toThrow();
      expect(inventoryStock).toBe(80); // Inventory remains untouched!

      // Delivery 4: Operator corrects to 20 units -> Completes line
      const batch4 = validateReceivingQuantity(expectedTotal, alreadyReceived, 20);
      alreadyReceived += 20;
      inventoryStock += 20;
      expect(batch4.remainingAfter).toBe(0);
      expect(alreadyReceived).toBe(100);
      expect(inventoryStock).toBe(100);
    });
  });
});
