import { jidNormalizedUser } from '@whiskeysockets/baileys';
import axios from 'axios';

global.name = (c) => global.botNames[Math.floor(Math.random() * global.botNames.length)];

global.surl = (c) => 'https://dix.lat/s/channel';

global.img = (c) => global.botImages[Math.floor(Math.random() * global.botImages.length)];

global.bufferCache = global.bufferCache || new Map();
global.getBuffer = async (u, o = {}) => {
    try {
        let r = await axios.get(u, { ...o, responseType: 'arraybuffer' });
        return r.status === 200 ? r.data : null;
    } catch { return null; }
};