-- Add a unique account username. Nullable so existing accounts keep working
-- (they can still sign in with email); the seed and registration set it.
ALTER TABLE "User" ADD COLUMN "username" TEXT;

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
