-- AlterTable
ALTER TABLE "route_boarding_points" ADD COLUMN     "is_next_day" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "route_dropping_points" ADD COLUMN     "is_next_day" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "route_via_cities" ADD COLUMN     "is_next_day" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "schedules" ADD COLUMN     "is_pickup" BOOLEAN NOT NULL DEFAULT true;
