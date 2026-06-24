-- Migration: add google_maps_url to activities
-- Run in: Supabase Dashboard → SQL Editor

ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS google_maps_url TEXT;
