const fs = require('fs');
const got = require('got');
const path = require('path');
const jose = require('node-jose');
const logger = require('debug')('didGen');

const keyNameMap = {
    ['encryption.json']: 'encryptionPublicJwk',
    ['signing.json']: 'signingPublicJwk',
    ['recovery.json']: 'recoveryPublicJwk',
    ['update.json']: 'updatePublicJwk',
}

const API = 'http://localhost:8080/api/test/generate-did';

module.exports = function (entityName) {
    logger("Generating did for entity %s", entityName);
    const entityPath = path.join(__dirname, '../entities', entityName);
    logger('Checking for entity in folder %s',entityPath);
    const keys = [];
    const files = fs.readdirSync(entityPath);
    files.forEach(file => {
        if (!!keyNameMap[file]) {
            logger("File %s mapped to prop %s", file, keyNameMap[file])
            keys.push(new Promise((res, rej) => {
                fs.readFile(path.join(entityPath, file), { encoding: 'utf-8' }, (err, data) => {
                    if (err) {
                        rej(err);
                    } else {
                        logger("Private JWK read from file %s", file)
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
    return Promise.all(keys).then(privateKeys => {
        const promises = [];
        privateKeys.forEach(key => {
            promises.push(new Promise((res, rej) => {
                jose.JWK.asKey(key.keyJwk, 'json').then(privateKey => {
                    const publicJwk = privateKey.toJSON(false);

                    logger("Public key derived for key %s: %o", key.name, publicJwk)
                    res({
                        name: key.name,
                        keyJwk: publicJwk
                    });
                }).catch(rej);
            }));
        });
        return Promise.all(promises);
    })
        // Aggregate public key JWKs
        .then(publicKeys => {
            const body = {};
            publicKeys.forEach(key => {
                body[key.name] = key.keyJwk;
            });
            return body;
        })
        // Send public key payload to API for DID generation
        .then(async (json) => {
            json.customSuffix = entityName;
            logger('Constructed API payload %o',json);
            logger('Sending payload to %s', API);
            const { body } = await got.post(API, {
                json,
                responseType: 'json'
            });
            const [_didConst, _method, didSuffix, didLongFormString, ..._extras] = body.split(':');
            logger('Created did/doc for suffix %s. Saving...', didSuffix);
            const didDoc = JSON.stringify(JSON.parse(Buffer.from(didLongFormString, 'base64').toString('ascii')), null, 2);
            fs.writeFileSync(path.join(entityPath, `did.txt`), body);
            fs.writeFileSync(path.join(entityPath, `didDoc.json`), didDoc);
            logger('Saved did/doc for suffix %s', didSuffix);
        });
}
