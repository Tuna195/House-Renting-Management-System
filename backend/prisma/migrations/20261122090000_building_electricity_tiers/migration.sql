CREATE TABLE "BuildingElectricityTier" (
    "id" SERIAL NOT NULL,
    "buildingId" INTEGER NOT NULL,
    "upTo" INTEGER,
    "price" INTEGER NOT NULL,

    CONSTRAINT "BuildingElectricityTier_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BuildingElectricityTier_upTo_positive" CHECK ("upTo" > 0),
    CONSTRAINT "BuildingElectricityTier_price_nonnegative" CHECK ("price" >= 0)
);

CREATE UNIQUE INDEX "BuildingElectricityTier_buildingId_upTo_key" ON "BuildingElectricityTier"("buildingId", "upTo");
CREATE UNIQUE INDEX "BuildingElectricityTier_one_final_tier" ON "BuildingElectricityTier"("buildingId") WHERE "upTo" IS NULL;

ALTER TABLE "BuildingElectricityTier" ADD CONSTRAINT "BuildingElectricityTier_buildingId_fkey"
    FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;
