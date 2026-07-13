const prisma = require("../config/database");
const {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} = require("../utils/errors");

/**
 * Sends a message within a consultation.
 * Rules:
 *   - Only the assigned patient and doctor can send messages.
 *   - Messages cannot be sent in completed consultations.
 */
const sendMessage = async (consultationId, senderId, content) => {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    include: {
      doctorProfile: {
        select: { userId: true },
      },
    },
  });

  if (!consultation) {
    throw new NotFoundError("Consultation");
  }

  if (consultation.status === "COMPLETED") {
    throw new BadRequestError("Cannot send messages in a completed consultation");
  }

  // Check participant
  const isPatient = consultation.patientId === senderId;
  const isDoctor = consultation.doctorProfile.userId === senderId;

  if (!isPatient && !isDoctor) {
    throw new ForbiddenError("You are not a participant in this consultation");
  }

  const message = await prisma.message.create({
    data: {
      content: content.trim(),
      consultationId,
      senderId,
    },
    include: {
      sender: {
        select: { id: true, name: true, role: true },
      },
    },
  });

  return formatMessage(message);
};

/**
 * Retrieves all messages for a consultation, in chronological order.
 * Only participants can view messages.
 */
const getMessages = async (consultationId, userId, { page, limit }) => {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    include: {
      doctorProfile: {
        select: { userId: true },
      },
    },
  });

  if (!consultation) {
    throw new NotFoundError("Consultation");
  }

  // Check participant
  const isPatient = consultation.patientId === userId;
  const isDoctor = consultation.doctorProfile.userId === userId;

  if (!isPatient && !isDoctor) {
    throw new ForbiddenError("You are not a participant in this consultation");
  }

  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { consultationId },
      include: {
        sender: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: "asc" },
      skip,
      take: limit,
    }),
    prisma.message.count({ where: { consultationId } }),
  ]);

  return { messages: messages.map(formatMessage), total };
};

const formatMessage = (m) => ({
  id: m.id,
  content: m.content,
  createdAt: m.createdAt,
  sender: m.sender,
});

module.exports = { sendMessage, getMessages };
