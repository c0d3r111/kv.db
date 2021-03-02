import fs     from 'fs/promises';
import crypto from 'crypto';

export default class Database {
    constructor(config)      {
        this.root     = config.root + (config.root.endsWith('/') ? '' : '/');
        this.maxDirs  = config.maxDirs || 1e4;    
    }
    async open()             {
        return await this.setDir(this.root);
    }
    async clear()            {
        await this.setDir(this.root, true);
        await this.setDir(this.root);

        return;
    }
    async del(key)           {
        return Boolean(key)
            ? await fs.unlink(this.getFile(key)).catch(e => null)
            : null;
    }
    async each(method)       {
        for await (const bucket of await fs.readdir(this.root)) {
            for await (const file of await fs.readdir(this.root + bucket)) {                
                await method(
                    await this.read(this.root + bucket + '/' + file), 
                    file, 
                    bucket
                );
            }
        }
    }
    async has(key)           {
        return !Boolean(await fs.access(this.getFile(key)).catch(() => true));
    }
    async link(key, ref)     {
        if (Boolean(key) && Boolean(ref)) {
            const fileref = this.getFile(ref);
            const file    = this.getFile(key);

            await this.setDir(file.split('/').slice(0, -1).join('/'));
            await fs.link(fileref, file).catch(console.log);
        }
        
        return null;
    }
    async get(key)           {
        return Boolean(key)
            ? await this.read(this.getFile(key))
            : null;
    }
    async set(key, value)    {
        return Boolean(key) && typeof value === 'object'
            ? await this.write(this.getFile(key), JSON.stringify(value))
            : null;
    }
    async update(key, data)  {
        return Boolean(key) && typeof data === 'object'
            ? await this.write(this.getFile(key), JSON.stringify(Object.assign(await this.get(key) || {}, data)))
            : null;
    }
    async read(file)         {
        try {
            return JSON.parse(await fs.readFile(file, 'utf8'));
        }
        catch {
            return null;
        }
    }
    async write(file, data)  {
        await this.setDir(file.split('/').slice(0, -1).join('/'));
        await fs.writeFile(file, data).catch(console.log);
    }

    getDir(hash)             {
        let sum = 0;
        let len = hash.length;

        for (let i = 0; i < len; i++) {
            void (sum += hash.charCodeAt(i));
        }

        return sum % this.maxDirs;
    }
    getFile(key)             {
        if (!key) return null;

        const hash = this.getHash(key);

        return this.root + this.getDir(hash) + '/' + hash;
    }
    getHash(data)            {
        return crypto.createHash('sha1').update(data).digest('hex');
    }
    setDir(dir, remove)      {
        return fs[remove ? 'rmdir' : 'mkdir'](dir, {recursive: true});
    }
}
