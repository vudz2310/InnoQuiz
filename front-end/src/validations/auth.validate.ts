export const emailValidate = (email: string): string => {
  if (!email.trim()) {
    return "Bạn chưa nhập Email";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Email không đúng định dạng";
  }

  return "";
};

export const passwordValidate = (password: string): string => {
  if (!password) {
    return "Bạn chưa nhập Mật khẩu";
  }

  if (password.length < 6) {
    return "Mật khẩu phải có ít nhất 6 ký tự";
  }

  return "";
};

export const nameValidate = (name: string): string => {
  if (!name.trim()) {
    return "Bạn chưa nhập Họ và tên";
  }

  if (name.trim().length < 2) {
    return "Họ và tên phải có ít nhất 2 ký tự";
  }

  return "";
};

export const studentCodeValidate = (code: string): string => {
  const clean = (code || "").trim();
  if (!clean) {
    return "Vui lòng nhập mã sinh viên.";
  }

  if (clean.length < 3) {
    return "Mã sinh viên không đúng định dạng.";
  }

  return "";
};

export const majorValidate = (majorId: string): string => {
  if (!majorId || !majorId.trim()) {
    return "Vui lòng chọn ngành học.";
  }
  return "";
};

export const cohortValidate = (cohort: string): string => {
  if (!cohort || !cohort.trim()) {
    return "Vui lòng chọn khóa đào tạo của bạn.";
  }
  return "";
};

export const classValidate = (classId: string): string => {
  if (!classId || !classId.trim()) {
    return "Vui lòng chọn mã lớp học phần của bạn.";
  }
  return "";
};

export const confirmPasswordValidate = (
  confirmPassword: string,
  password: string,
): string => {
  if (!confirmPassword) {
    return "Bạn chưa nhập Mật khẩu xác nhận";
  }

  if (confirmPassword !== password) {
    return "Mật khẩu xác nhận không khớp!";
  }

  return passwordValidate(confirmPassword);
};

export const validateField = (
  field: string,
  value: unknown,
  allValues: Record<string, unknown> = {},
): string => {
  switch (field) {
    case "email":
      return emailValidate(String(value || ""));
    case "password":
      return passwordValidate(String(value || ""));
    case "fullname":
      return nameValidate(String(value || ""));
    case "studentCode":
      return studentCodeValidate(String(value || ""));
    case "majorId":
      return majorValidate(String(value || ""));
    case "cohort":
      return cohortValidate(String(value || ""));
    case "classId":
      return classValidate(String(value || ""));
    case "confirmPassword":
      return confirmPasswordValidate(
        String(value || ""),
        String(allValues.password || ""),
      );
    default:
      return "";
  }
};

export const validateLoginForm = (
  email: string,
  password: string,
): { email?: string; password?: string } => {
  const errors: { email?: string; password?: string } = {};

  const emailErr = emailValidate(email);
  if (emailErr) errors.email = emailErr;

  const passwordErr = passwordValidate(password);
  if (passwordErr) errors.password = passwordErr;

  return errors;
};

export const validateRegisterForm = (
  fullname: string,
  studentCode: string,
  email: string,
  password: string,
  confirmPassword: string,
  majorId: string,
  cohort: string,
  classId: string,
  agree: boolean,
): Record<string, string> => {
  const errors: Record<string, string> = {};

  const nameErr = nameValidate(fullname);
  if (nameErr) errors.fullname = nameErr;

  const codeErr = studentCodeValidate(studentCode);
  if (codeErr) errors.studentCode = codeErr;

  const majorErr = majorValidate(majorId);
  if (majorErr) errors.majorId = majorErr;

  const cohortErr = cohortValidate(cohort);
  if (cohortErr) errors.cohort = cohortErr;

  const classErr = classValidate(classId);
  if (classErr) errors.classId = classErr;

  const emailErr = emailValidate(email);
  if (emailErr) errors.email = emailErr;

  const passErr = passwordValidate(password);
  if (passErr) errors.password = passErr;

  const confirmErr = confirmPasswordValidate(confirmPassword, password);
  if (confirmErr) errors.confirmPassword = confirmErr;

  if (!agree) {
    errors.agree = "Bạn cần đồng ý với Điều khoản sử dụng!";
  }

  return errors;
};
