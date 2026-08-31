import fs from 'fs';
import 'dotenv/config';

global.owner = [['50432955554'], ['5216711089134'], ['15614809253']];
global.dev1 = ['50432955554'];
global.developer = '𝙳𝚎𝚢𝚕𝚒𝚗 𝙴𝚕𝚒𝚊𝚌';
global.key = process.env.API_KEY;
global.v = JSON.parse(fs.readFileSync('./package.json', 'utf-8')).version;
