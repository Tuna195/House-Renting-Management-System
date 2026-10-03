import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middlewares/error-handler';
import api from './routes';

export const app = express();

app.use(helmet()); // thêm các header bảo mật cơ bản
app.use(cors({ origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()) }));
app.use(express.json({ limit: '1mb' }));

app.use('/api', api);

// Hai middleware xử lý lỗi luôn đặt CUỐI CÙNG
app.use(notFoundHandler);
app.use(errorHandler);
