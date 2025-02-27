const prisma = require('../prismaClient'); // Ensure Prisma client is set up

/**
 * Get the logged-in user's profile
 */
exports.getUserProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                username: true,
                preferredTimezone: true,
                gmtOffset: true, // Include GMT offset in response
            },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user);
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Fetch all users except the logged-in user
 */
exports.getUsers = async (req, res) => {
    try {
        const loggedInUserId = req.user.id; // Ensure `authenticateToken` middleware is used

        const users = await prisma.user.findMany({
            where: {
                id: { not: loggedInUserId }
            },
            select: {
                id: true,
                name: true,
                username: true,
                preferredTimezone: true,
                gmtOffset: true, // Include GMT offset in response
            }
        });

        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
};


exports.getUsersWithPagination = async (req, res) => {
    try {
      const loggedInUserId = req.user.id; // Ensure `authenticateToken` middleware is used
      const { search = '', page = 1, limit = 10 } = req.query;
  
      // Convert limit and page to integers
      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);
  
      // Perform search, pagination, and sorting
      const users = await prisma.user.findMany({
        where: {
          id: { not: loggedInUserId },
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive', // Case-insensitive search
              },
            },
            {
              username: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              preferredTimezone: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        },
        skip: (pageNumber - 1) * limitNumber,  // Skip based on page
        take: limitNumber,  // Limit to the specified number of users
        orderBy: {
          name: 'asc',  // Sort users by name in ascending order
        },
      });
  
      // Get total count for pagination
      const totalCount = await prisma.user.count({
        where: {
          id: { not: loggedInUserId },
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              username: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              preferredTimezone: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        },
      });
  
      const totalPages = Math.ceil(totalCount / limitNumber);
  
      res.json({
        users,
        totalPages,
        currentPage: pageNumber,
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
  };
  


