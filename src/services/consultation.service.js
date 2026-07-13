const prisma = require("../config/database");
const {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} = require("../utils/errors");

const consultationInclude = {
  patient: {
    select: { id: true, name: true, email: true },
  },
  doctorProfile: {
    select: {
      id: true,
      specialization: true,
      user: { select: { id: true, name: true, email: true } },
    },
  },
};

/**
 * Creates a new consultation. Only patients can do this.
 */
const createConsultation = async (patientId, doctorProfileId) => {
  // Verify the doctor exists
  const doctor = await prisma.doctorProfile.findUnique({
    where: { id: doctorProfileId },
  });

  if (!doctor) {
    throw new NotFoundError("Doctor");
  }

  const consultation = await prisma.consultation.create({
    data: {
      patientId,
      doctorProfileId,
    },
    include: consultationInclude,
  });

  return formatConsultation(consultation);
};

/**
 * Lists consultations visible to the requesting user.
 * Patients see their own; doctors see those assigned to them.
 */
const getConsultations = async (user, { page, limit }) => {
  const skip = (page - 1) * limit;

  const where =
    user.role === "PATIENT"
      ? { patientId: user.id }
      : { doctorProfile: { userId: user.id } };

  const [consultations, total] = await Promise.all([
    prisma.consultation.findMany({
      where,
      include: consultationInclude,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.consultation.count({ where }),
  ]);

  return { consultations: consultations.map(formatConsultation), total };
};

/**
 * Gets a single consultation by ID. Only participants can access it.
 */
const getConsultationById = async (consultationId, user) => {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    include: consultationInclude,
  });

  if (!consultation) {
    throw new NotFoundError("Consultation");
  }

  assertParticipant(consultation, user);

  return formatConsultation(consultation);
};

/**
 * Updates the consultation status.
 * Rules:
 *   - Only the assigned doctor can change status.
 *   - PENDING → ACTIVE or COMPLETED
 *   - ACTIVE  → COMPLETED
 *   - COMPLETED → nothing (immutable)
 */
const updateConsultationStatus = async (consultationId, newStatus, user) => {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    include: consultationInclude,
  });

  if (!consultation) {
    throw new NotFoundError("Consultation");
  }

  // Only the assigned doctor can change status
  if (consultation.doctorProfile.user.id !== user.id) {
    throw new ForbiddenError("Only the assigned doctor can update consultation status");
  }

  // Cannot modify completed consultations
  if (consultation.status === "COMPLETED") {
    throw new BadRequestError("Completed consultations cannot be modified");
  }

  // Validate state transitions
  const validTransitions = {
    PENDING: ["ACTIVE", "COMPLETED"],
    ACTIVE: ["COMPLETED"],
  };

  const allowed = validTransitions[consultation.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new BadRequestError(
      `Cannot transition from ${consultation.status} to ${newStatus}. Allowed: ${allowed.join(", ")}`
    );
  }

  const updated = await prisma.consultation.update({
    where: { id: consultationId },
    data: { status: newStatus },
    include: consultationInclude,
  });

  return formatConsultation(updated);
};

// ---------- Helpers ----------

/**
 * Throws ForbiddenError if the user is not the patient or assigned doctor.
 */
const assertParticipant = (consultation, user) => {
  const isPatient = consultation.patientId === user.id;
  const isDoctor = consultation.doctorProfile.user.id === user.id;

  if (!isPatient && !isDoctor) {
    throw new ForbiddenError("You are not a participant in this consultation");
  }
};

const formatConsultation = (c) => ({
  id: c.id,
  status: c.status,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
  patient: c.patient,
  doctor: {
    profileId: c.doctorProfile.id,
    userId: c.doctorProfile.user.id,
    name: c.doctorProfile.user.name,
    email: c.doctorProfile.user.email,
    specialization: c.doctorProfile.specialization,
  },
});

module.exports = {
  createConsultation,
  getConsultations,
  getConsultationById,
  updateConsultationStatus,
  assertParticipant,
};
