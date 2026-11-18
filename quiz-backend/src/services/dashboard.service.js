import { StatusCodes } from 'http-status-codes'
import { prisma } from '../config/DB.js'
import ApiError from '../utils/ApiError.js'

const getUserDashboardInfo = async (userId) => {
  const userInfo = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true
    }
  })

  if (!userInfo) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy thông tin người dùng')
  }

  return userInfo
}

export const dashboardService = {
  getUserDashboardInfo
}
