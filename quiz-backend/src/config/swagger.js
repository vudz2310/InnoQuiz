import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Inno Quiz HUBT - API Documentation',
      version: '1.0.0',
      description:
        'Tài liệu Swagger API đầy đủ cho Hệ thống Khảo sát & Thi trắc nghiệm trực tuyến HUBT (Chỉ khả dụng trong môi trường Development)',
      contact: {
        name: 'Inno Quiz HUBT Dev Team',
        email: 'dev@innoquiz.edu.vn',
      },
    },
    servers: [
      {
        url: '/v1',
        description: 'API Version 1 Base Path (http://localhost:3201/v1)',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Xác thực tài khoản, OTP email, Đăng nhập / Đăng ký' },
      { name: 'Profile', description: 'Quản lý thông tin hồ sơ cá nhân và tài khoản' },
      { name: 'User', description: 'Tra cứu thông tin người dùng hệ thống' },
      { name: 'Categories', description: 'Danh mục môn học và chuyên ngành HUBT' },
      { name: 'Quizzes', description: 'Quản lý đề thi, tạo, chỉnh sửa, xuất bản và tìm kiếm' },
      { name: 'Questions', description: 'Quản lý câu hỏi và các phương án trả lời' },
      { name: 'Attempts', description: 'Làm bài thi, nộp bài, chấm điểm và xem kết quả thi' },
      { name: 'Upload', description: 'Tải lên hình ảnh avatar và ảnh minh họa đề thi' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Nhập JWT Access Token dạng: Bearer <token>',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Thao tác thành công' },
            data: { type: 'object' },
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer', example: 400 },
            message: { type: 'string', example: 'Yêu cầu không hợp lệ hoặc dữ liệu sai định dạng' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: 'c7f99142-3783-4a30-86ae-7a32d169bbf1' },
            name: { type: 'string', example: 'Công nghệ thông tin' },
            description: { type: 'string', example: 'Các môn học thuộc khoa CNTT' },
          },
        },
        Answer: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            content: { type: 'string', example: 'Ký hiệu chữ C ngược trong vòng tròn' },
            isCorrect: { type: 'boolean', example: true },
            order: { type: 'integer', example: 1 },
          },
        },
        Question: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            content: { type: 'string', example: 'Ký hiệu của Copyleft là gì?' },
            type: { type: 'string', enum: ['MULTIPLE_CHOICE', 'TRUE_FALSE'], example: 'MULTIPLE_CHOICE' },
            points: { type: 'integer', example: 10 },
            order: { type: 'integer', example: 1 },
            answers: {
              type: 'array',
              items: { $ref: '#/components/schemas/Answer' },
            },
          },
        },
        Quiz: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: 'Đề thi Tin học đại cương HUBT' },
            description: { type: 'string', example: 'Đề kiểm tra kiến thức tin học cơ bản' },
            durationMinutes: { type: 'integer', example: 45 },
            passScore: { type: 'integer', example: 50 },
            status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], example: 'PUBLISHED' },
            categoryId: { type: 'string', format: 'uuid' },
            category: { $ref: '#/components/schemas/Category' },
            questions: {
              type: 'array',
              items: { $ref: '#/components/schemas/Question' },
            },
          },
        },
        QuizAttempt: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            quizId: { type: 'string', format: 'uuid' },
            score: { type: 'number', example: 8.5 },
            isPassed: { type: 'boolean', example: true },
            startedAt: { type: 'string', format: 'date-time' },
            completedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js', './src/routes/**/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);

