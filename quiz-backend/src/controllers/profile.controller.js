import { StatusCodes } from "http-status-codes";
import { profileService } from "../services/profile.service.js";

const getMyProfile = async (req, res, next) => {
  try {
    const userInfo = await profileService.getMyProfile(req.jwtDecoded);
    res.status(StatusCodes.OK).send({ userInfo });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const updatedUser = await profileService.updateProfile(
      req.jwtDecoded,
      req.body,
    );
    res.status(StatusCodes.OK).send({
      message: "Cập nhật thông tin thành công",
      userInfo: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const result = await profileService.changePassword(
      req.jwtDecoded,
      newPassword,
    );
    res.status(StatusCodes.OK).send(result);
  } catch (error) {
    next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    const result = await profileService.deleteAccount(req.jwtDecoded);
    res.status(StatusCodes.OK).send(result);
  } catch (error) {
    next(error);
  }
};

export const profileController = {
  getMyProfile,
  updateProfile,
  changePassword,
  deleteAccount,
};