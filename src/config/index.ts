import path from 'path';
import * as dotenv from 'dotenv';

const configPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: configPath });
