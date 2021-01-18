const fs = require('fs');
const path = require('path');
const jose = require('node-jose');

const keystore = jose.JWK.createKeyStore();

const keyFolder = 'keys';
const keyPath = path.join(__dirname, keyFolder);

if (!fs.existsSync(keyPath)) {
    console.log('Creating %s folder at path',keyFolder, keyPath);
    fs.mkdirSync(keyPath);
};

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

const signingKeyTypes = ['signing', 'update', 'recovery'];

// Generate signing keys and save
signingKeyTypes.forEach(type => {
    keystore.generate('EC', 'P-256', signingKeyProps)
        .then(privateKey => {
            savePrivate(privateKey, type);
        });
});

// Generate encryption key and save
keystore.generate('EC', 'P-256', encryptionKeyProps)
    .then(privateKey => {
        savePrivate(privateKey, 'encryption');
    });

function savePrivate(privateKey, type) {    
    const privateJwk = privateKey.toJSON(true);
    fs.writeFile(path.join(keyPath,`${type}.json`), JSON.stringify(privateJwk, null, 2), {
        encoding: 'utf-8'
    }, (err) => {
        if (err) {
            console.error(err);
        } else {
            console.log('%s key saved to %s folder', type, keyFolder);
        }
    })
}
