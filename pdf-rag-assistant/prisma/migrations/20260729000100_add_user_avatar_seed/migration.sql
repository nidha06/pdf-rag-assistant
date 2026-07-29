-- Give existing users a unique DiceBear seed, then let Prisma generate one
-- automatically for every new account.
ALTER TABLE "User" ADD COLUMN "avatarSeed" TEXT;
UPDATE "User"
SET "avatarSeed" = md5(random()::text || clock_timestamp()::text || id)
WHERE "avatarSeed" IS NULL;
ALTER TABLE "User" ALTER COLUMN "avatarSeed" SET NOT NULL;
