const { validationResult } = require("express-validator");
const prisma = require('../prismaClient'); 
const moment = require("moment-timezone");

// Create a new appointment

exports.createAppointment = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, start, end, invitedUserIds } = req.body;
    const creatorId = req.user.id; // Get logged-in user ID

    console.log("✅ Raw User Input:", { start, end });

    // Ensure input is treated as Date objects
    const startChecking = new Date(start);
    const endChecking = new Date(end);

    if (startChecking >= endChecking) {
      return res.status(400).json({ message: "End time must be after start time." });
    }

    // Fetch creator's timezone
    const creator = await prisma.user.findUnique({ where: { id: creatorId } });

    if (!creator) {
      return res.status(404).json({ message: "Creator not found" });
    }

    const creatorTimezone = creator.preferredTimezone;
    console.log("🌍 Creator Timezone:", creatorTimezone);

    // 🔹 Step 1: Interpret user input as their local time
    const startTimeLocal = moment.tz(start, creatorTimezone);
    const endTimeLocal = moment.tz(end, creatorTimezone);
    
    console.log("⏰ Local Start Time:", startTimeLocal.format());
    console.log("⏰ Local End Time:", endTimeLocal.format());

    // 🔹 Step 2: Convert to UTC before saving
    const startTimeUTC = startTimeLocal.utc();
    const endTimeUTC = endTimeLocal.utc();

    console.log("🌎 UTC Start Time to be saved:", startTimeUTC.format());
    console.log("🌎 UTC End Time to be saved:", endTimeUTC.format());

    const startInput = moment(start);
    const endInput = moment(end);

    console.log("⏰ Start Time Local hour:", startInput.hour());
    console.log("⏰ End Time Local hour:", endInput.hour());

    let result = {
      message:[]
    };
    // 🔹 Step 3: Validate working hours in LOCAL time
    if (startInput.hour() < 8 || endInput.hour() > 17) {
  
      return res.json({ status:"warning", message: "Appointment must be between 08:00 - 17:00 (your timezone)." });
    }

    // 🔹 Step 4: Check conflicts for invited users in their own timezones
    for (const userId of invitedUserIds) {
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) continue;

      const userStartTime = moment.tz(start, user.preferredTimezone);
      const userEndTime = moment.tz(end, user.preferredTimezone);

      console.log(`📌 Checking availability for user ${user.name} (${user.preferredTimezone})`);
      console.log("🔸 User Local Start:", userStartTime.format());
      console.log("🔸 User Local End:", userEndTime.format());

      if (userStartTime.hour() < 8 || userEndTime.hour() > 17) {
        
        return res.json({ status:"warning", message: `User ${user.name} is unavailable during this time.` });
      }

      // Check for overlapping appointments (stored in UTC)
      const conflict = await prisma.appointment.findFirst({
        where: {
          participants: { some: { userId } },
          AND: [
            { start: { lt: userEndTime.utc().toDate() } },
            { end: { gt: userStartTime.utc().toDate() } }
          ]
        }
      });

      if (conflict) {
        return res.json({ status:"warning", message: `User ${user.name} is already in another meeting at this time.` });
      }
    }

    // 🔹 Step 5: Store UTC time in the database
    const uniqueUserIds = Array.from(new Set([creatorId, ...invitedUserIds])); // Remove duplicates

    const appointment = await prisma.appointment.create({
      data: {
        title,
        start: startTimeUTC.toDate(), // Store in UTC
        end: endTimeUTC.toDate(), // Store in UTC
        creatorId,
        participants: {
          create: uniqueUserIds.map(userId => ({ userId })), // Ensure unique users
        },
      },
      include: { participants: true },
    });
    
    console.log("✅ Appointment Successfully Created:", appointment);
    result.message.push("Appointment created successfully!");
    res.status(201).json(result);
    //res.status(201).json({ message: "Appointment created successfully!", appointment });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const { title, start, end, invitedUserIds } = req.body;
    const creatorId = req.user.id;
    const appointmentId = req.params.id;

    console.log("✅ Raw User Input:", { start, end });

    // Fetch the existing appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { participants: true },
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Fetch creator's timezone
    const creator = await prisma.user.findUnique({ where: { id: creatorId } });

    if (!creator) {
      return res.status(404).json({ message: "Creator not found" });
    }

    const creatorTimezone = creator.preferredTimezone;
    console.log("🌍 Creator Timezone:", creatorTimezone);

    // Convert input time from user's local timezone to UTC
    const startTimeUTC = moment.tz(start, creatorTimezone).utc();
    const endTimeUTC = moment.tz(end, creatorTimezone).utc();

    console.log("🌎 UTC Start Time to be saved:", startTimeUTC.format());
    console.log("🌎 UTC End Time to be saved:", endTimeUTC.format());

    // Validate working hours in LOCAL time
    const startTime = moment.tz(start, creatorTimezone);
    const endTime = moment.tz(end, creatorTimezone);

    if (startTime.hour() < 8 || endTime.hour() > 17) {
      return res.json({ status:"warning", message: "Appointment must be between 08:00 - 17:00 (your timezone)." });
    }

    // Ensure unique participants (including creator)
    const uniqueUserIds = Array.from(new Set([creatorId, ...invitedUserIds])); // Removes duplicates

    // Step 4: Check invited users' availability in their timezones
    for (const userId of uniqueUserIds) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) continue;

      const userStartTime = moment.tz(start, user.preferredTimezone);
      const userEndTime = moment.tz(end, user.preferredTimezone);

      console.log(`📌 Checking availability for user ${user.name} (${user.preferredTimezone})`);
      console.log("🔸 User Local Start:", userStartTime.hour());
      console.log("🔸 User Local End:", userEndTime.hour());

      if (userStartTime.hour() < 8 || userEndTime.hour() > 17) {
        return res.json({ status:"warning", message: `User ${user.name} is unavailable during this time.` });
      }

      // Check for overlapping appointments
      const conflict = await prisma.appointment.findFirst({
        where: {
          participants: { some: { userId } },
          id:{not: appointmentId},
          AND: [
            { start: { lt: userEndTime.utc().toDate() } },
            { end: { gt: userStartTime.utc().toDate() } }
          ]
        }
      });

      if (conflict) {
        return res.json({ status:"warning", message: `User ${user.name} is already in another meeting at this time.` });
      }
    }

    // Get current participants' IDs
    const currentParticipantIds = appointment.participants.map(p => p.userId);

    // Find users to remove (existing but not in the new list)
    //const usersToRemove = currentParticipantIds.filter(id => !uniqueUserIds.includes(id));

    // Step 5: Remove only the users that are no longer in the participants list
    // await prisma.appointmentParticipant.deleteMany({
    //   where: {
    //     appointmentId: appointmentId,
    //     userId: { in: usersToRemove }
    //   }
    // });

    // Step 6: Insert only new participants that are not already in the appointment
    const newParticipants = uniqueUserIds.filter(id => !currentParticipantIds.includes(id));

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        title: title || appointment.title,
        start: startTimeUTC.toDate(), // Store in UTC
        end: endTimeUTC.toDate(), // Store in UTC
        participants: {
          create: newParticipants.map(userId => ({ userId })), // Prevent duplicates
        },
      },
      include: { participants: true },
    });

    console.log("✅ Appointment Successfully Updated");

    res.status(200).json({ message: "Appointment updated successfully." });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ message: "Error updating appointment" });
  }
};



// Get all appointments (show all fields)
exports.getAppointmentsAllFields = async (req, res) => {
    try {
      const userId = req.user.id;
  
      //show all data
      const appointments = await prisma.appointment.findMany({
        where: {
          OR: [
            { creatorId: userId },
            { participants: { some: { userId } } },
          ],
        },
        include: {
          creator: true, // Include the creator information
          participants: {
            include: {
              user: {
                select: {
                  name: true, // Only select the name of the user
                }
              }
            }
          }
        },
        orderBy: {
            start: 'asc', // Sorting appointments by start date in ascending order
        },
      });

      
  
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};


// Get upcoming future/past appointments (show several fields)
exports.getAppointments = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user to get their preferred timezone
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferredTimezone: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get current time in the user's preferred timezone
    const now = moment().tz(user.preferredTimezone).toISOString();

    // Fetch future appointments
    const appointments = await prisma.appointment.findMany({
      where: {
        // OR: [
        //   { creatorId: userId },
        //   { participants: { some: { userId } } },
        // ],
        participants: { some: { userId } },
        start: { gte: now }, // Only get future appointments
        //start: { lt: now } // Only past appointments
      },
      select: {
        id: true,
        title: true,
        start: true,
        end: true,
        creatorId:true,
        creator: { // Fetch creator's name
          select: {
            name: true,
          },
        },
        participants: {
          select: {
            user: {
              select: {
                name: true,
              }
            }
          }
        }
      },
      orderBy: {
        start: 'asc',
      },
    });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

  
//success 
exports.getAvailableUsers = async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      console.log("[DEBUG] Missing start or end time.");
      return res.status(400).json({ message: "Start and end time are required." });
    }

    const creatorId = req.user.id;
    console.log(`[DEBUG] Creator ID: ${creatorId}`);

    const creator = await prisma.user.findUnique({ where: { id: creatorId } });

    if (!creator) {
      console.log("[DEBUG] Creator not found in database.");
      return res.status(404).json({ message: "User not found." });
    }

    console.log(`[DEBUG] Creator timezone: ${creator.preferredTimezone}`);

    // **Convert start and end from the creator's local time to UTC**
    const startUTC = moment.tz(start, creator.preferredTimezone).utc();
    const endUTC = moment.tz(end, creator.preferredTimezone).utc();

    console.log(`[DEBUG] User Input Start (local): ${start}`);
    console.log(`[DEBUG] User Input End (local): ${end}`);
    console.log(`[DEBUG] Converted Start UTC: ${startUTC.format("YYYY-MM-DD HH:mm")}`);
    console.log(`[DEBUG] Converted End UTC: ${endUTC.format("YYYY-MM-DD HH:mm")}`);

    // **Check if the creator has a conflicting appointment**
   
    
    console.log("[DEBUG] UTC start todate:", startUTC.toDate());
    console.log("[DEBUG] UTC end todate:", endUTC.toDate());

    const creatorConflict = await prisma.appointment.findFirst({
      where: {
        OR: [
          { creatorId: creatorId }, // Check if the user is the creator
          { participants: { some: { userId: creatorId } } }, // Check if the user is a participant
        ],
        AND: [
          { start: { lt: endUTC.toDate() } }, // Appointment starts before this one ends
          { end: { gt: startUTC.toDate() } }, // Appointment ends after this one starts
        ],
      },
    });

    let result = [];
    const availableUsers = [];
    if (creatorConflict) {
      console.log("[DEBUG] Conflict found for creator.");

      result = {
        message : `You already have an appointment at this time.`,
        conflictMeeting : {
          start: moment(creatorConflict.start).tz(creator.preferredTimezone).format("YYYY-MM-DD HH:mm"),
          end: moment(creatorConflict.end).tz(creator.preferredTimezone).format("YYYY-MM-DD HH:mm"),
        },
        nextAvailableTime : moment(creatorConflict.end).tz(creator.preferredTimezone).format("YYYY-MM-DD HH:mm"),
      };
    }

    console.log("[DEBUG] No conflict for creator.");

    // **Fetch all users except the creator**
    const users = await prisma.user.findMany({
      where: { id: { not: creatorId } },
    });

    console.log(`[DEBUG] Total users fetched (excluding creator): ${users.length}`);

    for (const user of users) {
      console.log(`\n[DEBUG] Checking user: ${user.name} (${user.preferredTimezone})`);

      // **Convert UTC to the user's local time**
      const userStartLocal = startUTC.clone().tz(user.preferredTimezone);
      const userEndLocal = endUTC.clone().tz(user.preferredTimezone);

      console.log(`[DEBUG] Start in ${user.preferredTimezone}: ${userStartLocal.format("YYYY-MM-DD HH:mm")}`);
      console.log(`[DEBUG] End in ${user.preferredTimezone}: ${userEndLocal.format("YYYY-MM-DD HH:mm")}`);

      // **Check if appointment falls within user's working hours (08:00 - 17:00)**
      if (userStartLocal.hour() < 8 || userEndLocal.hour() > 17) {
        console.log(`[DEBUG] ❌ ${user.name} is outside working hours.`);
        continue; // Skip users outside working hours
      }

      console.log(`[DEBUG] ✅ ${user.name} is within working hours.`);

      // **Check if the user has a conflicting appointment in UTC**
      const conflict = await prisma.appointment.findFirst({
        where: {
          participants: { some: { userId: user.id } },
          AND: [
            { start: { lt: endUTC.toDate() } }, // Existing appointment starts before this one ends
            { end: { gt: startUTC.toDate() } }, // Existing appointment ends after this one starts
          ],
        },
      });

      if (conflict) {
        console.log(`[DEBUG] ❌ Conflict found for ${user.name}, skipping.`);
        continue;
      }

      console.log(`[DEBUG] ✅ ${user.name} is available.`);
      availableUsers.push({ id: user.id, name: user.name });
    }

    console.log(`[DEBUG] Total available users: ${availableUsers.length}`);
    
    if(Object.keys(result).length > 0)
    {
      result.availableUsers = availableUsers;
    }
    else
    {
      result = {availableUsers: availableUsers};
    }
    res.json({ result });
  } catch (error) {
    console.error("[ERROR] Error fetching available users:", error);
    res.status(500).json({ message: "Failed to fetch available users." });
  }
};


// Function to get a specific appointment by ID
exports.getAppointmentById = async (req, res) => {
    try {
        const appointmentId = req.params.id;

         // Fetch appointment and include related participants (users)
         const appointment = await prisma.appointment.findUnique({
            where: {
                id: appointmentId,  // Specify the appointment ID to search
            },
            include: {
                creator: {
                    select: { name: true },  // Include the creator's name
                },
                participants: {
                    include: {
                        user: {
                            select: { name: true },  // Include the participant's name
                        },
                    },
                },
            },
        });

        // Return the appointment data
        res.status(200).json(appointment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching appointment details' });
    }
};


// Function to delete an appointment
exports.deleteAppointment = async (req, res) => {
    const appointmentId = req.params.id;  // Get the appointment ID from the URL params
  
    try {
      // Step 1: Fetch the appointment to ensure it exists
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { participants: true }  // Include participants to check relations
      });
  
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
  
      // Step 2: Delete participants from the appointment
      await prisma.appointmentParticipant.deleteMany({
        where: { appointmentId: appointmentId }
      });
  
      // Step 3: Delete the appointment itself
      await prisma.appointment.delete({
        where: { id: appointmentId }
      });
  
      // Respond with success message
      res.status(200).json({ message: "Appointment deleted successfully" });
    } catch (error) {
      console.error("Error deleting appointment:", error);
      res.status(500).json({ message: "Error deleting appointment", error: error.message });
    }
};
  
  





