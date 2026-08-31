import { fileURLToPath } from 'url';
import chalk from 'chalk';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import axios from 'axios';
import moment from 'moment-timezone';
import { promises as fs } from 'fs';
import { jidNormalizedUser } from '@whiskeysockets/baileys';

Object.assign(global, { cheerio, fs, fetch, axios, moment });

global.channelInfo = {
    forwardingScore: 1,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: ch,
        newsletterName: name()
    }
};
