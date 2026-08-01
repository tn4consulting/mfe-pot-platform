import { createApp } from './app';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3003;

createApp().listen(port, host, () => {
  console.log(`[ ready ] client-profile-service listening at http://${host}:${port}`);
});
