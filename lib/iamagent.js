
module.exports = IAMAgent;

function IAMAgent(iam) {
	this._iam = iam;
}

IAMAgent.prototype.deletePolicy = function(options, callback) {
	this._iam.DeleteUserPolicy({
		PolicyName: options.policyName,
		UserName: options.userName
	}, callback);
};

