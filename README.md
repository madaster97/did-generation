# did-generation
This project provides a command line tool for creating DID **entities** (devices with private keys).

## Usage
```
git clone ...
npm install
npm start
```
## Microsoft Demo API
This projects relies upon the test endpoints exposed in this branch PR(https://github.com/microsoft-healthcare-madison/health-wallet-demo/pull/34) of Microsoft's 
[health-wallet-demo](https://github.com/microsoft-healthcare-madison/health-wallet-demo) 
project, which would expose an `/api/test/generate-did` endpoint that can accept public keys 
and generate DIDs representing the entity holding the corresponding private keys.

