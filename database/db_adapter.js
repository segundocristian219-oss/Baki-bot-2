import path from 'path';
import fs from 'fs';
import { open } from 'lmdb';

const DB_DIR = path.resolve(process.cwd(), 'database_lmdb');

if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

const rootEnv = open({
    path: DB_DIR,
    compression: true,
    maxDbs: 50,
    overlappingSync: false
});

function deepEqual(a, b) {
    if (a === b) return true;
    if (a === null || b === null || a === undefined || b === undefined) return a === b;
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        return a.every((v, i) => deepEqual(v, b[i]));
    }
    if (typeof a === 'object' && typeof b === 'object') {
        return JSON.stringify(a) === JSON.stringify(b);
    }
    return false;
}

function getField(doc, field) {
    if (!field.includes('.')) return doc ? doc[field] : undefined;
    const parts = field.split('.');
    let cur = doc;
    for (const p of parts) {
        if (cur === undefined || cur === null) return undefined;
        cur = cur[p];
    }
    return cur;
}

function setField(doc, field, value) {
    if (!field.includes('.')) { doc[field] = value; return; }
    const parts = field.split('.');
    let cur = doc;
    for (let i = 0; i < parts.length - 1; i++) {
        if (typeof cur[parts[i]] !== 'object' || cur[parts[i]] === null) cur[parts[i]] = {};
        cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
}

function deleteField(doc, field) {
    if (!field.includes('.')) { delete doc[field]; return; }
    const parts = field.split('.');
    let cur = doc;
    for (let i = 0; i < parts.length - 1; i++) {
        if (cur[parts[i]] === undefined || cur[parts[i]] === null) return;
        cur = cur[parts[i]];
    }
    delete cur[parts[parts.length - 1]];
}

function matchValue(actual, condition) {
    if (condition && typeof condition === 'object' && !Array.isArray(condition) && !(condition instanceof RegExp)) {
        for (const op in condition) {
            const val = condition[op];
            switch (op) {
                case '$eq':
                    if (!deepEqual(actual, val)) return false;
                    break;
                case '$ne':
                    if (deepEqual(actual, val)) return false;
                    break;
                case '$gt':
                    if (!(actual > val)) return false;
                    break;
                case '$gte':
                    if (!(actual >= val)) return false;
                    break;
                case '$lt':
                    if (!(actual < val)) return false;
                    break;
                case '$lte':
                    if (!(actual <= val)) return false;
                    break;
                case '$in':
                    if (!Array.isArray(val) || !val.some(v => deepEqual(actual, v))) return false;
                    break;
                case '$nin':
                    if (Array.isArray(val) && val.some(v => deepEqual(actual, v))) return false;
                    break;
                case '$exists': {
                    const exists = actual !== undefined;
                    if (exists !== !!val) return false;
                    break;
                }
                case '$regex': {
                    const re = val instanceof RegExp ? val : new RegExp(val, condition.$options || '');
                    if (typeof actual !== 'string' || !re.test(actual)) return false;
                    break;
                }
                case '$options':
                    break;
                default:
                    if (!deepEqual(actual, val)) return false;
            }
        }
        return true;
    }
    if (condition instanceof RegExp) {
        return typeof actual === 'string' && condition.test(actual);
    }
    return deepEqual(actual, condition);
}

function matchesQuery(doc, query) {
    if (!query || Object.keys(query).length === 0) return true;
    for (const key in query) {
        if (key === '$or') {
            if (!query.$or.some(sub => matchesQuery(doc, sub))) return false;
            continue;
        }
        if (key === '$and') {
            if (!query.$and.every(sub => matchesQuery(doc, sub))) return false;
            continue;
        }
        if (key === '$nor') {
            if (query.$nor.some(sub => matchesQuery(doc, sub))) return false;
            continue;
        }
        const actual = getField(doc, key);
        if (!matchValue(actual, query[key])) return false;
    }
    return true;
}

function applyUpdate(doc, update) {
    const hasOperators = Object.keys(update).some(k => k.startsWith('$'));
    if (!hasOperators) {
        Object.assign(doc, update);
        return doc;
    }
    for (const op in update) {
        const fields = update[op];
        switch (op) {
            case '$set':
                for (const f in fields) setField(doc, f, fields[f]);
                break;
            case '$setOnInsert':
                for (const f in fields) if (getField(doc, f) === undefined) setField(doc, f, fields[f]);
                break;
            case '$unset':
                for (const f in fields) deleteField(doc, f);
                break;
            case '$inc':
                for (const f in fields) setField(doc, f, (getField(doc, f) || 0) + fields[f]);
                break;
            case '$min': {
                for (const f in fields) {
                    const cur = getField(doc, f);
                    if (cur === undefined || fields[f] < cur) setField(doc, f, fields[f]);
                }
                break;
            }
            case '$max': {
                for (const f in fields) {
                    const cur = getField(doc, f);
                    if (cur === undefined || fields[f] > cur) setField(doc, f, fields[f]);
                }
                break;
            }
            case '$push': {
                for (const f in fields) {
                    const arr = getField(doc, f) || [];
                    const val = fields[f];
                    if (val && typeof val === 'object' && Object.prototype.hasOwnProperty.call(val, '$each')) {
                        setField(doc, f, arr.concat(val.$each));
                    } else {
                        setField(doc, f, arr.concat([val]));
                    }
                }
                break;
            }
            case '$addToSet': {
                for (const f in fields) {
                    const arr = getField(doc, f) || [];
                    const val = fields[f];
                    if (!arr.some(v => deepEqual(v, val))) setField(doc, f, arr.concat([val]));
                }
                break;
            }
            case '$pull': {
                for (const f in fields) {
                    const arr = getField(doc, f) || [];
                    const cond = fields[f];
                    setField(doc, f, arr.filter(v => !matchValue(v, cond)));
                }
                break;
            }
            default:
                setField(doc, op, fields);
        }
    }
    return doc;
}

let autoIncrement = 0;
function generateObjectId() {
    autoIncrement = (autoIncrement + 1) % 0xffffff;
    const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
    const random = Math.floor(Math.random() * 0xffffffffff).toString(16).padStart(10, '0');
    const counter = autoIncrement.toString(16).padStart(6, '0');
    return timestamp + random + counter;
}

class LMDBEngine {
    constructor(name, schemaDefaults = {}, options = {}) {
        this.name = name;
        this.schemaDefaults = schemaDefaults;
        this.primaryKey = options.primaryKey || 'id';
        this.uniqueFields = options.uniqueFields || null;
        this.store = rootEnv.openDB({ name, encoding: 'json' });
    }

    _storageKey(doc) {
        if (this.uniqueFields) {
            return this.uniqueFields.map(f => String(doc[f])).join('::');
        }
        return String(doc[this.primaryKey]);
    }

    _applyDefaults(data) {
        const out = { ...data };
        for (const field in this.schemaDefaults) {
            if (out[field] === undefined) {
                const def = this.schemaDefaults[field];
                out[field] = typeof def === 'function' ? def() : def;
            }
        }
        return out;
    }

    _allDocs() {
        const docs = [];
        for (const { value } of this.store.getRange()) {
            docs.push(value);
        }
        return docs;
    }

    _put(doc) {
        const key = this._storageKey(doc);
        this.store.putSync(key, doc);
        return doc;
    }

    async findOne(query = {}) {
        for (const doc of this._allDocs()) {
            if (matchesQuery(doc, query)) return doc;
        }
        return null;
    }

    async find(query = {}) {
        return this._allDocs().filter(d => matchesQuery(d, query));
    }

    async findById(id) {
        return this.findOne({ [this.primaryKey]: id });
    }

    async countDocuments(query = {}) {
        return this._allDocs().filter(d => matchesQuery(d, query)).length;
    }

    async exists(query = {}) {
        const found = await this.findOne(query);
        return found ? { _id: found[this.primaryKey] } : null;
    }

    async create(data) {
        const withDefaults = this._applyDefaults(data);
        this._put(withDefaults);
        return withDefaults;
    }

    async insertMany(dataArray = []) {
        const results = [];
        for (const data of dataArray) {
            const withDefaults = this._applyDefaults(data);
            this._put(withDefaults);
            results.push(withDefaults);
        }
        return results;
    }

    async updateOne(filter, update, options = {}) {
        const existing = this._allDocs().find(d => matchesQuery(d, filter));
        if (existing) {
            applyUpdate(existing, update);
            this._put(existing);
            return { acknowledged: true, matchedCount: 1, modifiedCount: 1, upsertedCount: 0 };
        }
        if (options.upsert) {
            let base = this._applyDefaults({ ...filter });
            base = applyUpdate(base, update);
            this._put(base);
            return { acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedCount: 1 };
        }
        return { acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedCount: 0 };
    }

    async updateMany(filter, update, options = {}) {
        const docs = this._allDocs().filter(d => matchesQuery(d, filter));
        for (const doc of docs) {
            applyUpdate(doc, update);
            this._put(doc);
        }
        if (docs.length === 0 && options.upsert) {
            let base = this._applyDefaults({ ...filter });
            base = applyUpdate(base, update);
            this._put(base);
            return { acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedCount: 1 };
        }
        return { acknowledged: true, matchedCount: docs.length, modifiedCount: docs.length, upsertedCount: 0 };
    }

    async findOneAndUpdate(filter, update, options = {}) {
        const existing = this._allDocs().find(d => matchesQuery(d, filter));
        if (existing) {
            applyUpdate(existing, update);
            this._put(existing);
            return existing;
        }
        if (options.upsert) {
            let base = this._applyDefaults({ ...filter });
            base = applyUpdate(base, update);
            this._put(base);
            return base;
        }
        return null;
    }

    async deleteOne(filter = {}) {
        const doc = this._allDocs().find(d => matchesQuery(d, filter));
        if (!doc) return { acknowledged: true, deletedCount: 0 };
        this.store.removeSync(this._storageKey(doc));
        return { acknowledged: true, deletedCount: 1 };
    }

    async deleteMany(filter = {}) {
        const docs = this._allDocs().filter(d => matchesQuery(d, filter));
        for (const doc of docs) {
            this.store.removeSync(this._storageKey(doc));
        }
        return { acknowledged: true, deletedCount: docs.length };
    }

    async bulkWrite(ops = [], options = {}) {
        let matched = 0, modified = 0, upserted = 0, inserted = 0, deleted = 0;
        for (const op of ops) {
            try {
                if (op.updateOne) {
                    const { filter, update, upsert } = op.updateOne;
                    const res = await this.updateOne(filter, update, { upsert });
                    matched += res.matchedCount;
                    modified += res.modifiedCount;
                    upserted += res.upsertedCount;
                } else if (op.updateMany) {
                    const { filter, update, upsert } = op.updateMany;
                    const res = await this.updateMany(filter, update, { upsert });
                    matched += res.matchedCount;
                    modified += res.modifiedCount;
                    upserted += res.upsertedCount;
                } else if (op.insertOne) {
                    await this.create(op.insertOne.document);
                    inserted += 1;
                } else if (op.deleteOne) {
                    const res = await this.deleteOne(op.deleteOne.filter);
                    deleted += res.deletedCount;
                } else if (op.deleteMany) {
                    const res = await this.deleteMany(op.deleteMany.filter);
                    deleted += res.deletedCount;
                }
            } catch (e) {
                if (options.ordered) throw e;
            }
        }
        return {
            acknowledged: true,
            matchedCount: matched,
            modifiedCount: modified,
            upsertedCount: upserted,
            insertedCount: inserted,
            deletedCount: deleted
        };
    }
}

function getSortValue(doc, field) {
    return getField(doc, field);
}

function compareValues(a, b) {
    if (a === b) return 0;
    if (a === undefined || a === null) return -1;
    if (b === undefined || b === null) return 1;
    if (a instanceof Date || b instanceof Date) {
        return new Date(a).getTime() - new Date(b).getTime();
    }
    if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
    return a > b ? 1 : (a < b ? -1 : 0);
}

function parseSortSpec(spec) {
    if (!spec) return [];
    if (typeof spec === 'string') {
        return spec.trim().split(/\s+/).filter(Boolean).map(token => {
            if (token.startsWith('-')) return { field: token.slice(1), dir: -1 };
            if (token.startsWith('+')) return { field: token.slice(1), dir: 1 };
            return { field: token, dir: 1 };
        });
    }
    return Object.keys(spec).map(field => ({
        field,
        dir: (spec[field] === -1 || spec[field] === 'desc' || spec[field] === 'descending') ? -1 : 1
    }));
}

function applySort(docs, spec) {
    const rules = parseSortSpec(spec);
    if (rules.length === 0) return docs;
    return [...docs].sort((a, b) => {
        for (const { field, dir } of rules) {
            const cmp = compareValues(getSortValue(a, field), getSortValue(b, field));
            if (cmp !== 0) return cmp * dir;
        }
        return 0;
    });
}

function parseSelectSpec(spec) {
    if (!spec) return null;
    let fields = [];
    let mode = null;
    if (typeof spec === 'string') {
        fields = spec.trim().split(/\s+/).filter(Boolean);
    } else {
        fields = Object.keys(spec).filter(f => spec[f] !== undefined);
        return {
            mode: fields.length && (spec[fields[0]] === 0 || spec[fields[0]] === false) ? 'exclude' : 'include',
            fields: fields.map(f => f.replace(/^-/, ''))
        };
    }
    mode = fields.length && fields[0].startsWith('-') ? 'exclude' : 'include';
    return { mode, fields: fields.map(f => f.replace(/^-/, '')) };
}

function applySelect(doc, spec) {
    if (!doc) return doc;
    const parsed = parseSelectSpec(spec);
    if (!parsed) return doc;
    const source = doc.toObject ? doc.toObject() : doc;
    if (parsed.mode === 'include') {
        const out = {};
        for (const f of parsed.fields) out[f] = getField(source, f);
        return out;
    }
    const out = { ...source };
    for (const f of parsed.fields) delete out[f];
    return out;
}

class Query {
    constructor(executor) {
        this._executor = executor;
        this._lean = false;
        this._sort = null;
        this._limit = null;
        this._skip = null;
        this._select = null;
    }

    lean() {
        this._lean = true;
        return this;
    }

    sort(spec) {
        this._sort = spec;
        return this;
    }

    limit(n) {
        this._limit = n;
        return this;
    }

    skip(n) {
        this._skip = n;
        return this;
    }

    select(fields) {
        this._select = fields;
        return this;
    }

    populate() {
        return this;
    }

    async _run() {
        let result = await this._executor();
        if (Array.isArray(result)) {
            if (this._sort) result = applySort(result, this._sort);
            if (this._skip) result = result.slice(this._skip);
            if (this._limit !== null && this._limit !== undefined) result = result.slice(0, this._limit);
            if (this._select) result = result.map(r => applySelect(r, this._select));
            if (this._lean) result = result.map(r => (r && r.toObject ? r.toObject() : r));
        } else if (result) {
            if (this._select) result = applySelect(result, this._select);
            if (this._lean && result.toObject) result = result.toObject();
        }
        return result;
    }

    exec() {
        return this._run();
    }

    then(onFulfilled, onRejected) {
        return this._run().then(onFulfilled, onRejected);
    }

    catch(onRejected) {
        return this._run().catch(onRejected);
    }

    finally(onFinally) {
        return this._run().finally(onFinally);
    }
}

function createModel(name, schemaDefaults = {}, options = {}) {
    const engine = new LMDBEngine(name, schemaDefaults, options);

    class Model {
        constructor(data = {}) {
            const withDefaults = engine._applyDefaults(data);
            Object.assign(this, withDefaults);
            Object.defineProperty(this, '_engine', { value: engine, enumerable: false, writable: false });
        }

        async save() {
            const plain = { ...this };
            delete plain._engine;
            if (!engine.uniqueFields && (plain[engine.primaryKey] === undefined || plain[engine.primaryKey] === null)) {
                plain[engine.primaryKey] = generateObjectId();
                this[engine.primaryKey] = plain[engine.primaryKey];
            }
            engine._put(plain);
            return this;
        }

        toObject() {
            const plain = { ...this };
            delete plain._engine;
            return plain;
        }

        toJSON() {
            return this.toObject();
        }

        static findOne(query) {
            return new Query(async () => {
                const doc = await engine.findOne(query);
                return doc ? new Model(doc) : null;
            });
        }

        static find(query) {
            return new Query(async () => {
                const docs = await engine.find(query);
                return docs.map(d => new Model(d));
            });
        }

        static findById(id) {
            return new Query(async () => {
                const doc = await engine.findById(id);
                return doc ? new Model(doc) : null;
            });
        }

        static async countDocuments(query) {
            return engine.countDocuments(query);
        }

        static async exists(query) {
            return engine.exists(query);
        }

        static async create(data) {
            const doc = await engine.create(data);
            return new Model(doc);
        }

        static async insertMany(data) {
            const docs = await engine.insertMany(data);
            return docs.map(d => new Model(d));
        }

        static async updateOne(filter, update, opts) {
            return engine.updateOne(filter, update, opts);
        }

        static async updateMany(filter, update, opts) {
            return engine.updateMany(filter, update, opts);
        }

        static findOneAndUpdate(filter, update, opts) {
            return new Query(async () => {
                const doc = await engine.findOneAndUpdate(filter, update, opts);
                return doc ? new Model(doc) : null;
            });
        }

        static async deleteOne(filter) {
            return engine.deleteOne(filter);
        }

        static async deleteMany(filter) {
            return engine.deleteMany(filter);
        }

        static async bulkWrite(ops, opts) {
            return engine.bulkWrite(ops, opts);
        }
    }

    return Model;
}

class DatabaseManager {
    constructor() {
        this.db = null;
    }

    async init() {
        try {
            global.Chat = createModel('chats', {
                isBanned: false
            }, { primaryKey: 'id' });

            global.Warns = createModel('warns', {
                reasons: () => [],
                warnCount: 0,
                date: () => new Date()
            }, { primaryKey: 'id', uniqueFields: ['userId', 'groupId'] });

            global.User = createModel('users', {
                monedas: 0,
                marry: null,
                name: 'Usuario',
                exp: 0,
                warnAntiLink: 0,
                col: 0,
                banned: false,
                lastSeen: () => new Date(),
                gender: 'No definido',
                identity: 'No definido',
                age: 0,
                description: '',
                repPoints: 0,
                repGivenBy: () => []
            }, { primaryKey: 'id' });

            global.db = rootEnv;
            this.startGarbageCollector();
            console.log('┃ SYSTEM ┃ Conectado con éxito a la base de datos local (LMDB).');
        } catch (e) {
            console.error('┃ SYSTEM ERROR ┃ Error al conectar con la base de datos local:', e);
            throw e;
        }
    }

    async saveUsersBulk(dataArray) {
        const ops = dataArray.map(data => ({
            updateOne: {
                filter: { id: data.id },
                update: { $set: data },
                upsert: true
            }
        }));
        if (ops.length > 0) {
            await global.User.bulkWrite(ops, { ordered: false });
        }
    }

    startGarbageCollector() {
        setInterval(async () => {
            try {
                const targetQuery = {
                    monedas: { $lte: 0 },
                    exp: { $lte: 0 },
                    marry: null,
                    banned: false,
                    age: { $lte: 0 },
                    repPoints: { $lte: 0 },
                    $or: [
                        { description: '' },
                        { description: 'Hola' },
                        { description: { $exists: false } }
                    ],
                    gender: 'No definido',
                    identity: 'No definido'
                };

                const result = await global.User.deleteMany(targetQuery);

                if (result && result.deletedCount > 0) {
                    console.log(`┃ SYSTEM ┃ Limpieza completada: ${result.deletedCount} usuarios fantasma eliminados.`);
                }
            } catch (e) {
                console.error('┃ SYSTEM ERROR ┃ Error en recolector de basura de la base de datos:', e);
            }
        }, 1000 * 60 * 60 * 2);
    }

    async close() {
        try {
            if (rootEnv.flushed) await rootEnv.flushed;
            rootEnv.close();
        } catch (_) {}
    }
}

export const databaseManager = new DatabaseManager();

process.on('SIGINT', async () => { await databaseManager.close(); process.exit(0); });
process.on('SIGTERM', async () => { await databaseManager.close(); process.exit(0); });
