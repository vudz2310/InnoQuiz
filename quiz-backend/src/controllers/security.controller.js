import { StatusCodes } from "http-status-codes";
import { securityService } from "../services/security.service.js";

const getSecurityOverview = async (req, res, next) => {
  try {
    const { timeRange } = req.query;
    const overview = await securityService.getSecurityOverview(timeRange);
    res.status(StatusCodes.OK).json({
      success: true,
      data: overview,
    });
  } catch (error) {
    next(error);
  }
};

const getSecurityEvents = async (req, res, next) => {
  try {
    const { page, limit, search, eventType, riskLevel, fromDate, toDate } = req.query;
    const events = await securityService.getSecurityEvents({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      eventType,
      riskLevel,
      fromDate,
      toDate,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

const getSecurityAlerts = async (req, res, next) => {
  try {
    const { page, limit, status, severity } = req.query;
    const alerts = await securityService.getSecurityAlerts({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      status,
      severity,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
};

const updateSecurityAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, resolutionNote } = req.body;
    const updated = await securityService.updateSecurityAlert(
      id,
      { status, resolutionNote },
      req.user || req.jwtDecoded
    );

    // Ghi nhận Audit Log
    await securityService.recordAdminAuditLog({
      req,
      adminId: req.user?.id || req.jwtDecoded?.id,
      adminEmail: req.user?.email || req.jwtDecoded?.email,
      action: "UPDATE_SECURITY_ALERT",
      targetType: "ALERT",
      targetId: id,
      details: { status, resolutionNote },
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Cập nhật trạng thái cảnh báo bảo mật thành công!",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const getBlockedIdentifiers = async (req, res, next) => {
  try {
    const { page, limit, search, type } = req.query;
    const result = await securityService.getBlockedIdentifiers({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      type,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const blockIdentifier = async (req, res, next) => {
  try {
    const { type, value, reason, riskScore, blockedUntil, notes } = req.body;
    const newBlock = await securityService.blockIdentifier({
      type,
      value,
      reason,
      riskScore,
      blockedUntil,
      notes,
      adminUser: req.user || req.jwtDecoded,
    });

    // Ghi nhận Audit Log
    await securityService.recordAdminAuditLog({
      req,
      adminId: req.user?.id || req.jwtDecoded?.id,
      adminEmail: req.user?.email || req.jwtDecoded?.email,
      action: "BLOCK_IDENTIFIER",
      targetType: type,
      targetId: newBlock.id,
      details: { value, reason, blockedUntil },
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: `Đã đưa ${type} [${value}] vào danh sách chặn an toàn!`,
      data: newBlock,
    });
  } catch (error) {
    next(error);
  }
};

const unblockIdentifier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const unblocked = await securityService.unblockIdentifier(id, {
      adminUser: req.user || req.jwtDecoded,
      reason,
    });

    // Ghi nhận Audit Log
    await securityService.recordAdminAuditLog({
      req,
      adminId: req.user?.id || req.jwtDecoded?.id,
      adminEmail: req.user?.email || req.jwtDecoded?.email,
      action: "UNBLOCK_IDENTIFIER",
      targetType: unblocked.type,
      targetId: id,
      details: { value: unblocked.value, reason },
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: `Đã gỡ chặn cho ${unblocked.type} [${unblocked.value}] thành công!`,
      data: unblocked,
    });
  } catch (error) {
    next(error);
  }
};

const getSecuritySettings = async (req, res, next) => {
  try {
    const settings = await securityService.getSecuritySettings();
    res.status(StatusCodes.OK).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

const updateSecuritySettings = async (req, res, next) => {
  try {
    const updatedSettings = await securityService.updateSecuritySettings(
      req.body,
      req.user || req.jwtDecoded
    );

    // Ghi nhận Audit Log
    await securityService.recordAdminAuditLog({
      req,
      adminId: req.user?.id || req.jwtDecoded?.id,
      adminEmail: req.user?.email || req.jwtDecoded?.email,
      action: "UPDATE_SECURITY_SETTINGS",
      targetType: "SETTINGS",
      details: req.body,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Cập nhật tham số cấu hình bảo mật thành công!",
      data: updatedSettings,
    });
  } catch (error) {
    next(error);
  }
};

export const securityController = {
  getSecurityOverview,
  getSecurityEvents,
  getSecurityAlerts,
  updateSecurityAlert,
  getBlockedIdentifiers,
  blockIdentifier,
  unblockIdentifier,
  getSecuritySettings,
  updateSecuritySettings,
};
