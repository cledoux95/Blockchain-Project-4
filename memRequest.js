/* ===== Mempool Request Class =========================
|  Class with a constructor for mempool requests	    |
|  ===================================================*/

class memRequest {
	constructor(address){
		this.walletAddress = address;
		this.requestTimeStamp = new Date().getTime().toString().slice(0,-3);
		this.message = `${address}:${new Date().getTime().toString().slice(0,-3)}:starRegistry`;
		this.validationWindow = 300;
	}
}

module.exports.memRequest = memRequest;