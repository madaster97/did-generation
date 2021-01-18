// Workflow

// Write keys, did and did Doc to a single folder

// Folder name will be a command line argument, and we'll always clear a folder

const prompt = require('prompt');
const keyGen = require('./lib/keyGen');
const didGen = require('./lib/didGen');

var schema = {
    properties: {
      entityName: {
        pattern: /^[a-zA-Z\-\_]+$/,
        message: 'Folder name must only be letters, dashes, and underscores',
        required: true
      },
      willSign: {
        type: 'boolean',
        message: 'True/False, will this entity sign assertions?',
        required: true,
        default: true
      },
      willDecrypt: {
        type: 'boolean',
        message: 'True/False, will this entity decrypt responses?',
        required: true,
        default: false
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
    //
    // Log the results.
    //
    console.log('Command-line input received:');
    console.log(result);

    // // Key generation will return an empty promise once keys have been saved to file
    // keyGen(result).then(() => {
    //     console.log('Key gen finished!');
    //     return didGen(result.entityName);
    // });

    // Just debug reading/did gen
    didGen(result.entityName)
  });

