import { createApp } from './app';
import { config } from './config';

createApp().listen(config.port, config.host, () => {
  console.log(`[ ready ] mock-idp listening at http://${config.host}:${config.port}`);
});
