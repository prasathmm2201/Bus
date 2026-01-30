/*
  Warnings:

  - You are about to drop the column `from_city` on the `routes` table. All the data in the column will be lost.
  - You are about to drop the column `to_city` on the `routes` table. All the data in the column will be lost.
  - You are about to drop the `seats` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[mobile_no]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `from_city_id` to the `routes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `to_city_id` to the `routes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "booking_passengers" DROP CONSTRAINT "booking_passengers_booking_id_fkey";

-- DropForeignKey
ALTER TABLE "booking_passengers" DROP CONSTRAINT "booking_passengers_seat_id_fkey";

-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_schedule_id_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_booking_id_fkey";

-- DropForeignKey
ALTER TABLE "seats" DROP CONSTRAINT "seats_schedule_id_fkey";

-- AlterTable
ALTER TABLE "bus_template_seats" ADD COLUMN     "price" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "buses" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "routes" DROP COLUMN "from_city",
DROP COLUMN "to_city",
ADD COLUMN     "from_city_id" UUID NOT NULL,
ADD COLUMN     "to_city_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "schedules" ADD COLUMN     "addon_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "discount_percentage" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "password" DROP NOT NULL;

-- DropTable
DROP TABLE "seats";

-- CreateTable
CREATE TABLE "otps" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mobile_no" VARCHAR(15) NOT NULL,
    "code" VARCHAR(6) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_via_cities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "route_id" UUID NOT NULL,
    "city_id" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "arrival_time" VARCHAR(10),

    CONSTRAINT "route_via_cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boarding_points" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "city_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boarding_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_boarding_points" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "route_id" UUID NOT NULL,
    "boarding_point_id" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "time" VARCHAR(10),

    CONSTRAINT "route_boarding_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_dropping_points" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "route_id" UUID NOT NULL,
    "dropping_point_id" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "time" VARCHAR(10),

    CONSTRAINT "route_dropping_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_seats" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schedule_id" UUID NOT NULL,
    "bus_id" UUID NOT NULL,
    "route_id" UUID NOT NULL,
    "template_seat_id" UUID,
    "seat_number" VARCHAR(10) NOT NULL,
    "status" "SeatStatus" NOT NULL DEFAULT 'available',
    "gender_lock" "Gender",
    "type" "SeatType" NOT NULL DEFAULT 'SEATER',
    "deck" "Deck" NOT NULL DEFAULT 'LOWER',
    "row" INTEGER NOT NULL DEFAULT 0,
    "col" INTEGER NOT NULL DEFAULT 0,
    "price" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_seats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "otps_mobile_no_idx" ON "otps"("mobile_no");

-- CreateIndex
CREATE UNIQUE INDEX "boarding_points_name_city_id_key" ON "boarding_points"("name", "city_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_mobile_no_key" ON "users"("mobile_no");

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_from_city_id_fkey" FOREIGN KEY ("from_city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_to_city_id_fkey" FOREIGN KEY ("to_city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_via_cities" ADD CONSTRAINT "route_via_cities_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_via_cities" ADD CONSTRAINT "route_via_cities_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boarding_points" ADD CONSTRAINT "boarding_points_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_boarding_points" ADD CONSTRAINT "route_boarding_points_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_boarding_points" ADD CONSTRAINT "route_boarding_points_boarding_point_id_fkey" FOREIGN KEY ("boarding_point_id") REFERENCES "boarding_points"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_dropping_points" ADD CONSTRAINT "route_dropping_points_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_dropping_points" ADD CONSTRAINT "route_dropping_points_dropping_point_id_fkey" FOREIGN KEY ("dropping_point_id") REFERENCES "boarding_points"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_seats" ADD CONSTRAINT "schedule_seats_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_passengers" ADD CONSTRAINT "booking_passengers_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_passengers" ADD CONSTRAINT "booking_passengers_seat_id_fkey" FOREIGN KEY ("seat_id") REFERENCES "schedule_seats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
