const fs = require('fs');
const path = require('path');
const jose = require('node-jose');
const logger = require('debug')('keyGen');

const keystore = jose.JWK.createKeyStore();

const encryptionKeyProps = {
    'kty': 'EC',
    'crv': 'P-256',
    'alg': 'ECDH-ES',
}
const signingKeyProps = {
    'kty': 'EC',
    'crv': 'P-256',
    'alg': 'ES256',
}

const signingKeyTypes = ['update', 'recovery'];

module.exports = function (prompt) {
    logger('Received prompt %o', prompt);
    const {willDecrypt, willSign ,entityName: keyFolder} = prompt;
    const entityPath = path.join(__dirname, '../entities')
    logger('Generating keys for entity %s at path %s',keyFolder, entityPath);
    const keyPath = path.join(entityPath, keyFolder);

    if (willSign) {
        signingKeyTypes.push('signing');
        logger('Entity will have signing key');
    }
    
    function savePrivate(privateKey, type) {
        const privateJwk = privateKey.toJSON(true);
        return new Promise((res, rej) => {
            fs.writeFile(path.join(keyPath, `${type}.json`), JSON.stringify(privateJwk, null, 2), {
                encoding: 'utf-8'
            }, (err) => {
                if (err) {
                    rej(err);
                } else {
                    logger('%s key saved to %s folder', type, keyFolder);
                    res()
                }
            })
        });
    }
    
    const promises = [];



    if (!fs.existsSync(entityPath)) {
        logger('Creating %s folder at path %s', 'entities', entityPath);
        fs.mkdirSync(entityPath);
    };

    if (!fs.existsSync(keyPath)) {
        logger('Creating %s folder at path %s', keyFolder, keyPath);
        fs.mkdirSync(keyPath);
    };

    // Generate signing keys and save
    signingKeyTypes.forEach(type => {
        promises.push(new Promise((res, rej) => {
            keystore.generate('EC', 'P-256', signingKeyProps)
                .then(privateKey => {
                    return savePrivate(privateKey, type);
                })
                .then(res).catch(rej);
        }));

    });

    if (willDecrypt) {
        // Generate encryption key and save
        promises.push(new Promise((res, rej) => {
            keystore.generate('EC', 'P-256', encryptionKeyProps)
                .then(privateKey => {
                    savePrivate(privateKey, 'encryption');
                })
                .then(res).catch(rej);
        }));
    };

    return Promise.all(promises);
};
