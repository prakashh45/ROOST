/* ─────────────────────────────────────────────────────────────────────────
   src/modules/analytics/analytics.service.js
   Owner dashboard analytics
───────────────────────────────────────────────────────────────────────── */

const prisma = require("../../config/db");

const getOwnerSummary = async (tenantId) => {
  const tenant = BigInt(tenantId);

  // Properties
  const propertiesCount = await prisma.properties.count({
    where: {
      tenant_id: tenant,
    },
  });

  // Rooms
  const roomsCount = await prisma.rooms.count({
    where: {
      tenant_id: tenant,
    },
  });

  // Beds
  const bedsCount = await prisma.beds.count({
    where: {
      tenant_id: tenant,
    },
  });

  // Active bookings
  const activeBookings = await prisma.bookings.count({
    where: {
      tenant_id: tenant,
      status: "CONFIRMED",
    },
  });

  // Total bookings
  const totalBookings = await prisma.bookings.count({
    where: {
      tenant_id: tenant,
    },
  });

  // Occupied beds
  const occupiedBeds = await prisma.bookings.count({
    where: {
      tenant_id: tenant,
      status: "CONFIRMED",
    },
  });

  const occupancy =
    bedsCount > 0
      ? Math.round((occupiedBeds / bedsCount) * 100)
      : 0;

  return {
    stats: [
      {
        label: "Properties",
        value: propertiesCount,
      },
      {
        label: "Rooms",
        value: roomsCount,
      },
      {
        label: "Beds",
        value: bedsCount,
      },
      {
        label: "Active bookings",
        value: activeBookings,
      },
    ],

    occupancy: [
      occupancy,
      occupancy,
      occupancy,
      occupancy,
      occupancy,
      occupancy,
      occupancy,
    ],

    occupancyLabels: [
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Today",
    ],

    bookings: {
      total: totalBookings,
      active: activeBookings,
    },
  };
};
// add 
module.exports = {
  getOwnerSummary,
};