// Workflow

// Write keys, did and did Doc to a single folder

// Folder name will be a command line argument, and we'll always clear a folder

const fs = require('fs');
const path = require('path');
const prompt = require('prompt');
const logger = require('debug')('prompt');
const keyGen = require('./lib/keyGen');
const didGen = require('./lib/didGen');

var schema = {
    properties: {
        entityName: {
            pattern: /^[a-zA-Z\-\_]+$/,
            message: 'Folder name must only be letters, dashes, and underscores',
            required: true
        },
        genKeys: {
            type: 'boolean',
            message: 'Generate new keys for this entity?',
            required: true,
            default: false,
            /**
             * Only ask if:
             * 1. Entity with entered name exists (has a folder of the same name)
             * 2. Entity has update/recovery keys already. 
             *  - We'll clear all other potential keys if the user wants to regen (see `before`)
             */
            ask: function () {
                const entityName = prompt.history('entityName').value;
                logger('Keygen checking entityName %s', entityName);
                const entityPath = path.join(__dirname,'entities',entityName);
                const updatePath = path.join(entityPath,'update.json');
                const recoveryPath = path.join(entityPath,'recovery.json');
                
                logger('Checking for directory %s', entityPath);
                if (!fs.existsSync(entityPath)) {
                    logger('Entity %s does not exist, skipping key regen prompt', entityName);
                    return false;
                };
                logger('Directory %s exists', entityPath);

                logger('Checking for update/recovery keys');
                if (!(fs.existsSync(updatePath) && fs.existsSync(recoveryPath))) {
                    logger('Entity %s Missing update/recovery keys, skipping key regen prompt', entityName);
                    return false;
                };
                logger('Directory %s has update/recovery keys', entityPath);
                 
                // Default to true, in that we'll always ask otherwise to regen or not
                return true;
            },
            /**
             * If true, we'll quickly clear current keys/dids and make a note
             * We'll assume the entityName has an existing directory if true was returned, see `ask`
             * @param {boolean} value 
             */
            before: function (value) {
                logger('Received genKeys value', value)
                const entityName = prompt.history('entityName').value;
                if (value === true) {
                    logger('Deleting contents of %s entity', entityName);
                };

                logger('Skipping key regen for %s entity', entityName);
                return value;
            }
        },
        willSign: {
            type: 'boolean',
            message: 'True/False, will this entity sign assertions?',
            required: true,
            default: true,
            ask: function () {
                const genKeys = prompt.history('genKeys');
                logger("Siging retrieving genKeys result %o", genKeys);
                if (genKeys && genKeys.value === false) {
                    logger('Skipping signing key generation')
                    return false
                }
                return true;
            }
        },
        willDecrypt: {
            type: 'boolean',
            message: 'True/False, will this entity decrypt responses?',
            required: true,
            default: false,
            ask: function () {
                const genKeys = prompt.history('genKeys');
                logger("Encrypt retrieving genKeys result %o", genKeys);
                if (genKeys && genKeys.value === false) {
                    logger('Skipping encryption key generation')
                    return false
                }
                return true;
            }
        }
    }
};

//
// Start the prompt
//
prompt.start();

//
// Get two properties from the user: email, password
//
prompt.get(schema, function (err, result) {
    logger("Returned prompt %o", result);
    
    try {
        // Key generation will return an empty promise once keys have been saved to file
        if (result.genKeys === true || result.genKeys === '') {
            logger('Key regen needed');
            keyGen(result).then(() => {
                logger('Key gen finished!');
                return didGen(result.entityName);
            }).then(() => {
                logger('Did gen finished!')
            });
        } else {
            logger('Key regen NOT needed');
            didGen(result.entityName).then(() => {
                logger('Did gen finished!') 
            });
        };
    } catch (error) {
        console.error(error);
    }
});

