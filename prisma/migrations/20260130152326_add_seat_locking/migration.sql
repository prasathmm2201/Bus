-- AlterEnum
ALTER TYPE "SeatStatus" ADD VALUE 'locked';

-- AlterTable
ALTER TABLE "schedule_seats" ADD COLUMN     "lock_token" VARCHAR(100),
ADD COLUMN     "locked_at" TIMESTAMP(3);
