import { StatusCodes } from "http-status-codes";
import { getUserById } from "../services/user.service.js";

export const getProfile = async (req, res, next) => {
    try {
        const user = await getUserById(req.params.id);

        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: "Không tìm thấy người dùng",
            });
        }

        return res.status(StatusCodes.OK).json(user);
    } catch (error) {
        next(error);
    }
};