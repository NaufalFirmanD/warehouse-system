-- Seed Users (passwords hashed with bcrypt: 'password123')
INSERT INTO users (id, username, password_hash, full_name, role)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'supervisor', '$2a$10$iM.o50i7uP62gU3yYtWjO.qQ.W2eW/oN2dI9u64P6u00yF1o6f3Wy', 'Sarah Supervisor', 'SUPERVISOR'),
    ('22222222-2222-2222-2222-222222222222', 'operator', '$2a$10$iM.o50i7uP62gU3yYtWjO.qQ.W2eW/oN2dI9u64P6u00yF1o6f3Wy', 'Alex Operator', 'OPERATOR')
ON CONFLICT (username) DO NOTHING;

-- Seed Products
INSERT INTO products (id, sku, name, description, uom)
VALUES 
    ('33333333-3333-3333-3333-333333333331', 'SKU-SCAN-01', 'Handheld 2D Barcode Scanner', 'IP65 rugged wireless scanner with cradle', 'PCS'),
    ('33333333-3333-3333-3333-333333333332', 'SKU-LBL-02', 'Direct Thermal Shipping Labels (4x6)', 'Pack of 6 rolls, 500 labels per roll', 'BOX'),
    ('33333333-3333-3333-3333-333333333333', 'SKU-JACK-03', 'Hydraulic Pallet Jack 2500kg', 'Heavy-duty steel warehouse hand truck', 'PCS'),
    ('33333333-3333-3333-3333-333333333334', 'SKU-WRAP-04', 'Industrial Stretch Film Wrap', '500mm x 300m 23-micron stretch film', 'BOX')
ON CONFLICT (sku) DO NOTHING;

-- Initial Demo Inbound Receiving Document
INSERT INTO receiving_documents (id, document_number, supplier_name, status, expected_date, notes, created_by)
VALUES 
    ('44444444-4444-4444-4444-444444444441', 'RCV-20261028-001', 'Apex Logistics & Supplies', 'PENDING', CURRENT_DATE + INTERVAL '1 day', 'Morning dock delivery Bay 4', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (document_number) DO NOTHING;

-- Line Items for RCV-20261028-001
INSERT INTO receiving_document_items (id, document_id, product_id, expected_quantity, received_quantity)
VALUES 
    ('55555555-5555-5555-5555-555555555551', '44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333331', 20, 0),
    ('55555555-5555-5555-5555-555555555552', '44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333332', 50, 0)
ON CONFLICT (document_id, product_id) DO NOTHING;
