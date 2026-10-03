import { app } from './app';
import { env } from './config/env';

app.listen(env.PORT, () => {
  console.log(`✅ API đang chạy tại http://localhost:${env.PORT}/api`);
});
