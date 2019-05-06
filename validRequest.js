/* ===== Valid Request Class ====================================================
|  Class with a constructor for mempool requests that have been validated	    |
|  ============================================================================*/

class validRequest {
	constructor(walletAddress, requestTimeStamp, message, validationWindow, valid){
		this.registerStar = true;
		this.status = {
		   address: walletAddress,
		   requestTimeStamp: requestTimeStamp,
		   message: message,
		   validationWindow: validationWindow,
		   messageSignature: valid
		};
	}
}

module.exports.validRequest = validRequest;