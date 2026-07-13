const prisma = require("../config/database");
const { NotFoundError } = require("../utils/errors");

const doctorSelect = {
  id: true,
  specialization: true,
  yearsOfExperience: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
};

/**
 * Returns a paginated list of all doctors with their profiles.
 */
const getAllDoctors = async ({ page, limit }) => {
  const skip = (page - 1) * limit;

  const [doctors, total] = await Promise.all([
    prisma.doctorProfile.findMany({
      select: doctorSelect,
      skip,
      take: limit,
      orderBy: { user: { name: "asc" } },
    }),
    prisma.doctorProfile.count(),
  ]);

  // Flatten for cleaner API response
  const formatted = doctors.map(formatDoctor);

  return { doctors: formatted, total };
};

/**
 * Gets a single doctor by their DoctorProfile ID.
 */
const getDoctorById = async (doctorId) => {
  const doctor = await prisma.doctorProfile.findUnique({
    where: { id: doctorId },
    select: doctorSelect,
  });

  if (!doctor) {
    throw new NotFoundError("Doctor");
  }

  return formatDoctor(doctor);
};

/**
 * Flattens the nested user/profile structure into a clean response.
 */
const formatDoctor = (doctor) => ({
  id: doctor.id,
  userId: doctor.user.id,
  name: doctor.user.name,
  email: doctor.user.email,
  specialization: doctor.specialization,
  yearsOfExperience: doctor.yearsOfExperience,
});

module.exports = { getAllDoctors, getDoctorById };
