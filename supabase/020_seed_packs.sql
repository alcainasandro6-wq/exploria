-- Migrates the previously hardcoded homepage packs into the packs table.
INSERT INTO packs (slug, title, subtitle, image_url, sort_order) VALUES
('torrevieja', 'Pack Torrevieja', NULL, '/pack-torrevieja.png', 1),
('parasailing', 'Pack Aventura', NULL, '/pack-parasailing.png', 2),
('moto-agua', 'Pack Velocidad', NULL, '/pack-moto-agua.png', 3),
('banana', 'Pack Diversión', NULL, '/pack-banana.png', 4),
('mar-sal', 'Pack Mar y Sal', NULL, '/pack-mar-sal.png', 5)
ON CONFLICT (slug) DO NOTHING;
