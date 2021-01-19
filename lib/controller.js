const keyGen = require('./keyGen');
const didGen = require('./didGen');
const logger = require('debug')('controller');

module.exports = async function (err, result) {
    logger("Returned prompt %o", result);
    
    try {
        // Key generation will return an empty promise once keys have been saved to file
        if (result.genKeys === true || result.genKeys === '') {
            logger('Key regen needed');
            return keyGen(result).then(() => {
                logger('Key gen finished!');
                return didGen(result.entityName);
            }).then(() => {
                logger('Did gen finished!')
            })
        } else {
            logger('Key regen NOT needed');
            return didGen(result.entityName).then(() => {
                logger('Did gen finished!') 
            })
        };
    } catch (error) {
        console.error(error);
    }
}