const BlockClass = require('./Block.js');
const LevelSandbox = require('./LevelSandbox.js');
const memRequestClass = require('./memRequest.js');
const validRequestClass = require('./validRequest.js');

const SHA256 = require('crypto-js/sha256');
const hex2ascii = require('hex2ascii'); 
const bitcoinMessage = require('bitcoinjs-message'); 

/**
 * Controller Definition to encapsulate routes to work with blocks
 */
class BlockController {

    /**
     * Constructor to create a new BlockController, you need to initialize here all your endpoints
     * @param {*} server 
     */
    constructor(server) {
        this.bd = new LevelSandbox.LevelSandbox();
        this.server = server;
        this.getBlockByHash = this.getBlockByHash.bind(this);
        // this.blocks = [];
        this.mempool = [];
        this.mempoolValid = [];
        this.timeoutRequests = [];
        // this.initializeMockData();
        this.postNewBlock();
        this.validationRequest();
        this.getBlockByHashRoute();
        this.generateGenesisBlock();
        this.getBlockByHeightRoute();
        this.getBlockByAddressRoute();
        this.validateRequestByWallet();
    }

    async generateGenesisBlock(){
        let value = await this.bd.getBlocksCount();

        var height = value;
        if (height == 0) {
            let genesis = {
                address: "Genesis Block - Star Registry",
                star: {
                      ra: "Genesis Block - Star Registry",
                      dec: "Genesis Block - Star Registry",
                      mag: "Genesis Block - Star Registry",
                      cen: "Genesis Block - Star Registry",
                      story: Buffer("Genesis Block - Star Registry").toString('hex')
                      }
            };

            let genesisBlock = new BlockClass.Block(genesis);
            await this.addBlock(genesisBlock);
        }
    }

    async addBlock(block) {
        /* BLOCK SCHEMA:
        this.hash = '';
        this.height = '';
        this.time = '';
        this.data = data;
        this.previousHask = '0x';
        */

        //hash
        block.hash = SHA256(JSON.stringify(block)).toString();
        //time
        block.time = new Date().getTime().toString().slice(0, -3);

        //height
        block.height = await this.getBlockHeight();

        if (block.height > 0) {
            let value = await this.bd.getLevelDBData(block.height-1);
            block.previousHash = value.hash;
        }

        let value = await this.bd.addLevelDBData(block.height, JSON.stringify(block).toString());

        return value;
    }

    async getBlockByHeight(height) {
        let value = await this.bd.getLevelDBData(height);

        return value;
    }

    async getBlockHeight() {
        let value = await this.bd.getBlocksCount();

        return value;
    }

    async getBlockByHash(hash) {
        let value = await this.bd.getBlockByHash(hash);
        return value;
    }

    async getBlocksByAddress(address) {
        let value = await this.bd.getBlocksByAddress(address);
        console.log(value);
        return value;
    }



    validationRequest() {
        this.server.route({
            method: 'POST',
            path: '/requestValidation',
            handler: (request, h) => {

                let req = JSON.parse(JSON.stringify(request.payload));

                if(!req) {
                    return JSON.stringify({'ERROR': 'Blank payload not allowed.'});
                }; 

                let address = req.address;
                let mempool = this.mempool;
                let timeoutRequests = this.timeoutRequests;

                if (timeoutRequests.includes(address)) {
                    const TimeoutRequestsWindowTime = 5*60*1000;
                    timeoutRequests[address] = setTimeout(function(){
                        mempool.splice(mempool.indexOf(address),1); 
                        timeoutRequests.splice(timeoutRequests.indexOf(address),1);
                    }, TimeoutRequestsWindowTime);

                    let memRequest = mempool.find(mempool => mempool['walletAddress'] === address);
                    let timeElapse = (new Date().getTime().toString().slice(0,-3)) - memRequest.requestTimeStamp;
                    let timeLeft = (TimeoutRequestsWindowTime/1000) - timeElapse;
                    memRequest.validationWindow = timeLeft;
                }

                if (mempool.some(mempool => mempool['walletAddress'] === address)) {
                    let memRequest = mempool.find(mempool => mempool['walletAddress'] === address);
                    return JSON.stringify(memRequest);
                }

                let newMemRequest = new memRequestClass.memRequest(address);
                mempool.push(newMemRequest);
                timeoutRequests.push(address);
                return JSON.stringify(newMemRequest);
            }
        });
    }

    validateRequestByWallet() {
        this.server.route({
            method: 'POST',
            path: '/message-signature/validate',
            handler: (request, h) => {

                let req = JSON.parse(JSON.stringify(request.payload));

                if(!req) {
                    return JSON.stringify({'ERROR': 'Blank payload not allowed.'});
                };

                let address = req.address;
                let signature = req.signature;
                let mempool = this.mempool;
                let mempoolValid = this.mempoolValid;
                let timeoutRequests = this.timeoutRequests;

                if (mempool.some(mempool => mempool['walletAddress'] === address)) {
                    let memRequest = mempool.find(mempool => mempool['walletAddress'] === address);
                    let message = memRequest.message;
                    let requestTimeStamp = memRequest.requestTimeStamp;
                    let validationWindow = memRequest.validationWindow;

                    if (timeoutRequests.includes(address)) {
                        const TimeoutRequestsWindowTime = 5*60*1000;
                        timeoutRequests[address] = setTimeout(function(){
                            mempool.splice(mempool.indexOf(address),1); 
                            timeoutRequests.splice(timeoutRequests.indexOf(address),1);
                        }, TimeoutRequestsWindowTime);

                        let memRequest = mempool.find(mempool => mempool['walletAddress'] === address);
                        let timeElapse = (new Date().getTime().toString().slice(0,-3)) - memRequest.requestTimeStamp;
                        let timeLeft = (TimeoutRequestsWindowTime/1000) - timeElapse;
                        memRequest.validationWindow = timeLeft;
                    }

                    let isValid = bitcoinMessage.verify(message, address, signature);

                    if(!isValid){
                        return JSON.stringify({
                            'ERROR':'Bitcoin Address Signature Invalid',
                            'address': address,
                            'signature': signature
                        });
                    }

                    let validatedRequest = new validRequestClass.validRequest(address, requestTimeStamp, message, validationWindow, isValid);
                    mempool.splice(mempool.indexOf(address),1); 
                    timeoutRequests.splice(timeoutRequests.indexOf(address),1);                      
                    mempoolValid.push(validatedRequest);
                    return JSON.stringify(validatedRequest);
                }

                return JSON.stringify(
                    {'Status':`Request not found with address: ${address}`}
                );
            }
        });
    }

    /**
     * Implement a POST Endpoint to add a new Block, url: "/api/block"
     */
    postNewBlock() {
        this.server.route({
            method: 'POST',
            path: '/block',
            handler: async (request, h) => {

                let req = JSON.parse(JSON.stringify(request.payload));

                if(!req) {
                    return JSON.stringify({'ERROR': 'Blank payload not allowed.'});
                };
                if(Object.keys(req).length === 0) {
                    return JSON.stringify({'ERROR': 'Blank block not allowed.'});
                };

                let address = req.address;
                let mempoolValid = this.mempoolValid

                if(mempoolValid.some(mempoolValid => mempoolValid.status['address'] === address)) {
                    if(Object.keys(req).length === 2) {
                        
                        let RA = req.star.ra;
                        let DEC = req.star.dec;
                        let MAG = req.star.mag;
                        let CEN = req.star.cen;
                        let starStory = req.star.story;

                        let newStar = {
                                address: address,
                                star: {
                                      ra: RA,
                                      dec: DEC,
                                      mag: MAG,
                                      cen: CEN,
                                      story: Buffer(starStory).toString('hex')
                                      }
                            };

                        let newBlock = new BlockClass.Block(newStar);
                        let block = await this.addBlock(newBlock);

                        return block;
                    }

                    return JSON.stringify(
                        {'Status':'Request invalid, did you try to add more than one star?'}
                    );   

                };

                return JSON.stringify(
                    {'Status':`Request not found with address: ${address}`}
                );   

            }
        });
    }


    /**
     * Implement a GET Endpoint to retrieve a block by hash, url: "/api/block/:index"
     */
    getBlockByHashRoute() {
        this.server.route({
            method: 'GET',
            path: '/stars/hash:{hash}',
            handler: async (request, h) => {
                const hash = request.params.hash;

                console.log(hash);
                console.log(typeof hash);

                let block = await this.getBlockByHash(hash);

                console.log(typeof block);

                if(!block) {
                    return `No block found with hash ${hash}`;
                }

                const obj = JSON.parse(block.value);

                obj.body.star["storyDecoded"] = hex2ascii(obj.body.star.story);
                return obj;
            }
        });
    }

    getBlockByHeightRoute() {
        this.server.route({
            method: 'GET',
            path: '/block/{height}',
            handler: async (request, h) => {
                const height = parseInt(request.params.height);
                let chainHeight = await this.bd.getBlocksCount();
                if (height > chainHeight) {
                    return `Requested block height is greater than height of chain.\nCurrent chain height: ${chainHeight}.`
                }

                let block = await this.getBlockByHeight(height);

                const obj = block;

                obj.body.star["storyDecoded"] = hex2ascii(obj.body.star.story);

                return block;
            }
        });
    }

    getBlockByAddressRoute() {
        this.server.route({
            method: 'GET',
            path: '/stars/address:{address}',
            handler: async (request, h) => {
                const address = request.params.address;

                let blocks = await this.getBlocksByAddress(address);

                console.log(blocks.length);

                if(!blocks.length) {
                    return `No blocks found with address ${address}`;
                }

                for (let index = 0; index < blocks.length; index++) {

                    let obj = blocks[index];
                    obj.body.star["storyDecoded"] = hex2ascii(obj.body.star.story);

                }



                //const obj = JSON.parse(block.value);

                //console.log(hex2ascii(obj.body.star.story));

                //obj.body.star["storyDecoded"] = hex2ascii(obj.body.star.story);
                return blocks;
            }
        });
    }

    /**
     * Help method to inizialized Mock dataset, adds 10 test blocks to the blocks array
     */
    initializeMockData() {
        if(this.blocks.length === 0){
            for (let index = 0; index < 10; index++) {
                let blockAux = new BlockClass.Block(`Test Data #${index}`);
                blockAux.height = index;
                blockAux.hash = SHA256(JSON.stringify(blockAux)).toString();
                this.blocks.push(blockAux);
            }
        }
    }


}


/**
 * Exporting the BlockController class
 * @param {*} server 
 */

module.exports = (server) => { return new BlockController(server);}