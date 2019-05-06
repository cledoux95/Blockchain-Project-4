# Blockchain Star Notary API

This API uses the hapi.js framework. 

Blockchain API which handles POSTing of:
- Request for validation of Bitcoin Wallet address
- Validation of Bitcoin Wallet address via signature
- Creation of a block holding star data which the user wants to notarize

and GETting of:
- Block by height
- Block by hash
- Block(s) by Bitcoin Wallet address


## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

Clone the repository to somewhere you want to work on it.

```
git clone <git url>

```


### Installing

Navigate to the directory inside terminal and then:

```
npm install

```

Then just run:

```
node app.js

```

to start the server.

Use Postman or Curl at http://localhost:8000 

## Routing

Use the following to interact with the API

### POST Request Validation

Use this to POST your Bitcoin Wallet address to receive a message to sign within a 5 minute validation window.

```
http://localhost:8000/requestValidation
body: 
{
    "address": "YOURADDRESS"
}

```
Returns:

```
{
	"walletAddress":"YOURADDRESS",
	"requestTimeStamp":"1552415940",
	"message":"YOURADDRESS:1552415940:starRegistry",
	"validationWindow":300
}

```

Then do this:

### POST Signature Validation

Use this to POST your Bitcoin Wallet address Signature to receive a validated request, and a 5 minute window wherein you can POST a star.

```
http://localhost:8000/message-signature/validate
body:
{
    "address": "YOURADDRESS",
    "signature": "YOURSIGNATURE"
}

```
Returns:

```
{
    "registerStar": true,
    "status": {
        "address": "YOURADDRESS",
        "requestTimeStamp": "1552415940",
        "message": "YOURADDRESS:1552415940:starRegistry",
        "validationWindow": 300,
        "messageSignature": true
    }
}

```

Then do this:

### POST Block with Star Data

Use this to POST your Star Data into a block to forever notarize it into an indelible and impermeable blockchain of infinite power.

Note X, Y and Z are just placeholders for numbers, not actual XYZ coordinates.
```
http://localhost:8000/block
body:
{
    "address": "YOURADDRESS",
    "star": {
                "dec": "X° Y' Z",
                "ra": "Xh Ym Zs",
                "story": "WHEREYOUFOUNDTHESTAR"
            }
}

```
Returns:

```
{
    "hash": "BLOCKHASH",
    "height": CURRENTHEIGHT,
    "body": {
        "address": "YOURADDRESS",
        "star": {
            "ra": "Xh Ym Zs",
            "dec": "X° Y' Z",
            "story": "YOURHEXSTORY"
        }
    },
    "time": "1552415956",
    "previousHash": "PREVIOUSHASH"
}

```

Then you can explore with the GET routes:

### GET by block height (Returns block)

Use this to GET the block at given height.

```
http://localhost:8000/block/{index}

```
set index = the desired height:

```
index = int

```
Example:

```
http://localhost:8000/block/1

```

```
{
    "hash": "BLOCKHASH",
    "height": BLOCKHEIGHT,
    "body": {
        "address": "YOURADDRESS",
        "star": {
            "ra": "Xh Ym Zs",
            "dec": "X° Y' Z",
            "story": "YOURHEXSTORY",
            "storyDecoded": "YOUR ASCII STORY"
        }
    },
    "time": "1552415956",
    "previousHash": "PREVIOUSHASH"
}
```

### GET by block hash (Returns block)

Use this to GET the block at given height.

```
http://localhost:8000/stars/hash:{hash}

```
set hash = the block hash:

```
hash = hash

```
Example:

```
http://localhost:8000/stars/hash:BLOCKHASH

```

```
{
    "hash": "BLOCKHASH",
    "height": BLOCKHEIGHT,
    "body": {
        "address": "YOURADDRESS",
        "star": {
            "ra": "Xh Ym Zs",
            "dec": "X° Y' Z",
            "story": "YOURHEXSTORY",
            "storyDecoded": "YOUR ASCII STORY"
        }
    },
    "time": "1552415956",
    "previousHash": "PREVIOUSHASH"
}


```

### GET blocks by address (Returns array of block(s))

Use this to GET the block at given height.

```
http://localhost:8000/stars/address:{address}

```
set address = Bitcoin Wallet Address:

```
address = address

```
Example:

```
http://localhost:8000/stars/address:BITCOINWALLETADDRESS

```
Returns array of blocks if multiple blocks submitted by same address.

```
[
    {
        "hash": "BLOCKHASH",
        "height": 1,
        "body": {
            "address": "WALLETADDRESS",
            "star": {
                "ra": "Xh Ym Zs",
                "dec": "X° Y' Z",
                "story": "YOURHEXSTORY",
                "storyDecoded": "YOUR ASCII STORY"
            }
        },
        "time": "1552415887",
        "previousHash": "PREVIOUSHASH"
    },
    {
        "hash": "BLOCKHASH",
        "height": 2,
        "body": {
            "address": "WALLETADDRESS",
            "star": {
                "ra": "Xh Ym Zs",
                "dec": "X° Y' Z",
                "story": "YOURHEXSTORY",
                "storyDecoded": "YOUR ASCII STORY"
            }
        },
        "time": "1552415956",
        "previousHash": "PREVIOUSHASH"
    }
]


```


## Deployment

Deploy it by rewriting and establishing the server connection to a real server lol.

## Built With

*  Udacity (lol)
*  Code Editor (any one will do)

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

Versioning? psh.

## Authors

* **Christian Le Doux - Best guy.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Hat tip to Udacity
* Inspiration to Udacity
* etc to Udacity
