const fs = require('fs');
const got = require('got');
const path = require('path');
const jose = require('node-jose');

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
        // Convert private keys to public before transmitting
        Promise.all(keys).then(privateKeys => {
            const promises = [];
            privateKeys.forEach(key => {
                promises.push(new Promise((res,rej) => {
                    jose.JWK.asKey(key.keyJwk,"json").then(privateKey => {
                        res({
                            name: key.name,
                            keyJwk: privateKey.toJSON(false)
                        });
                    }).catch(rej);
                }));
            });
            return promises;
        })
        // Aggregate public key JWKs
        .then(publicKeys => {
            const body = {};
            publicKeys.forEach(key => {
                body[key.name] = key.keyJwk;
            });
            return body; 
        })
        // Send public key payload to API
        .then(async (json) => {
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