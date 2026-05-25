ALTER TABLE "users" ALTER COLUMN "birth_date" TYPE date USING CASE
	WHEN "birth_date" ~ '^\d{4}-\d{2}-\d{2}$' THEN "birth_date"::date
	ELSE NULL
END;