-- DropForeignKey
ALTER TABLE "poll_options" DROP CONSTRAINT "poll_options_poll_id_fkey";

-- DropForeignKey
ALTER TABLE "polls" DROP CONSTRAINT "polls_creator_id_fkey";

-- DropForeignKey
ALTER TABLE "votes" DROP CONSTRAINT "votes_poll_option_id_fkey";

-- DropForeignKey
ALTER TABLE "votes" DROP CONSTRAINT "votes_user_id_fkey";

-- CreateIndex
CREATE INDEX "poll_options_poll_id_idx" ON "poll_options"("poll_id");

-- CreateIndex
CREATE INDEX "polls_creator_id_idx" ON "polls"("creator_id");

-- CreateIndex
CREATE INDEX "polls_is_published_idx" ON "polls"("is_published");

-- CreateIndex
CREATE INDEX "polls_created_at_idx" ON "polls"("created_at");

-- CreateIndex
CREATE INDEX "polls_creator_id_is_published_idx" ON "polls"("creator_id", "is_published");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "votes_user_id_idx" ON "votes"("user_id");

-- CreateIndex
CREATE INDEX "votes_poll_option_id_idx" ON "votes"("poll_option_id");

-- CreateIndex
CREATE INDEX "votes_created_at_idx" ON "votes"("created_at");
