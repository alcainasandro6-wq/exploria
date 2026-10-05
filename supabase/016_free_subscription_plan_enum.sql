-- Adds a 'free' tier to the subscription_plan enum so a no-cost plan can
-- exist alongside basic/pro/premium (self-serve free plan + admin-gifted
-- plans). ALTER TYPE ... ADD VALUE cannot be used in the same transaction
-- as a statement that references the new value, so the seed row for this
-- plan lives in the next migration file.
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'free';
