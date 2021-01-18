const fs = require('fs');
const got = require('got');
const path = require('path');

const keyFolder = 'keys';
const didDocFolder = 'didDocs';
const didFolder = 'dids';

const keyNameMap = {
    ['encryption.json']: 'encryptionPublicJwk',
    ['signing.json']: 'signingPublicJwk',
    ['recovery.json']: 'recoveryPublicJwk',
    ['update.json']: 'updatePublicJwk',
}

const API = 'http://localhost:8080/api/test/generate-did';

(async () => {
    try {
        const keys = [];
        const files = fs.readdirSync(path.join(__dirname, keyFolder));
        files.forEach(file => {
            if (!!keyNameMap[file]) {
                keys.push(new Promise((res, rej) => {
                    fs.readFile(path.join(__dirname, keyFolder, file), { encoding: 'utf-8' }, (err, data) => {
                        if (err) {
                            rej(err);
                        } else {
                            res({
                                name: keyNameMap[file],
                                keyJwk: JSON.parse(data)
                            })
                        }
                    })
                }))
            }
        });
        Promise.all(keys).then(values => {
            const body = {};
            values.forEach(value => {
                body[value.name] = value.keyJwk;
            });
            return body;
        }).then(async (json) => {
            const { body } = await got.post(API, {
                json,
                responseType: 'json'
            });
            const [_didConst, _method, didSuffix, didLongFormData, ..._extras] = body.split(':');
            console.log('Created did/doc for suffix %s', didSuffix);
            const didDoc = JSON.stringify(JSON.parse(Buffer.from(didLongFormData, 'base64').toString('ascii')), null, 2);
            fs.writeFileSync(path.join(__dirname, didFolder, `${didSuffix}.txt`), body);
            fs.writeFileSync(path.join(__dirname, didDocFolder, `${didSuffix}.json`), didDoc);
        });
    } catch (error) {
        console.error(error);
    }
})();