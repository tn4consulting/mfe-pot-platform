import { createApp } from './app';
import { config } from './config';
import { startRefreshLoop } from './refresh';

startRefreshLoop();

createApp().listen(config.port, config.host, () => {
  console.log(`[ ready ] aws-cost-exporter listening at http://${config.host}:${config.port}`);
});
