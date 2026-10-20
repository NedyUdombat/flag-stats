DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'registration_status' 
          AND e.enumlabel = 'invited'
    ) THEN
        ALTER TYPE registration_status ADD VALUE 'invited';
    END IF;
END $$;