-- The "Vista al mar Mediterráneo" demo image (catamarán activity) points to
-- a dead Unsplash URL (404), which is why that gallery thumbnail rendered
-- as a broken-image icon with blank space around it instead of a photo.
UPDATE activity_images
SET url = 'https://images.unsplash.com/photo-1439405326854-014607f694d7?w=1200&q=80'
WHERE url = 'https://images.unsplash.com/photo-1500036064239-3c6ba8153123?w=1200&q=80';
