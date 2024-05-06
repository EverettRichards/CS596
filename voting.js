const web3 = new Web3("http://127.0.0.1:8545");

var abi;

fetch("./abi.json")
	.then((response) => response.json())
	.then((json) => (abi = json));

var addresses;

web3.eth.getAccounts().then((accounts) => {
	console.log("Done initializing accounts.");
	addresses = accounts;
});

var clientAddress;
var contractAddress;
var username;
var contract;

function annotate(result) {
	result
		.on("transactionHash", (hash) => {
			logOutput("Transaction hash:", hash);
		})
		.on("receipt", (receipt) => {
			logOutput("Transaction received!");
			return receipt;
		})
		.on("error", (error) => {
			logError(error);
		});
}

function getTime() {
    const currentTime = new Date();
    const hours = currentTime.getHours().toString().padStart(2, "0");
    const mins = currentTime.getMinutes().toString().padStart(2, "0");
    const secs = currentTime.getSeconds().toString().padStart(2, "0");
    const formattedTime = hours + ":" + mins + ":" + secs;
    return formattedTime;
}

function highlightText(text,color) {
    return "<span style='color:"+color+"'>"+text+"</span>";
}

function highlightPartOfString(text,part,color) {
    return text.replace(part,highlightText(part,color));
}

function logOutput(output){
    const now = getTime();
    output = now + " >> " + output;
    output = highlightPartOfString(output,"true","#90f090");
    output = highlightPartOfString(output,"false","#f09090");
    document.getElementById("output_log").innerHTML = output;
    document.getElementById("output_log").className = "invert";
    console.log(output);
}

function logError(error){
    const now = getTime();
    error = error.message;
    const match = error.split("transaction: revert")
    if (match && match.length > 1) {
        error = match[1];
    }
    error = now + " >> " + error;
    document.getElementById("output_log").innerHTML = error;
    document.getElementById("output_log").className = "red";
    console.error(error);
}

function selectAddress() {
	var value = document.getElementById("choose_address").value;
	clientAddress = addresses[value];
	web3.eth.defaultAccount = clientAddress;
    document.getElementById("LocalAddressLabel").innerHTML = clientAddress;
	document.getElementById("PickAddress").style.display = "none";
	document.getElementById("ChooseClient").style.display = "block";
    logOutput("Selected address: "+formatAddress(clientAddress));
}

function joinContract() {
    contractAddress = document.getElementById("contract_address").value;
	document.getElementById("ContractAddressLabel").innerHTML =
		contractAddress;
	username = document.getElementById("name").value;
    document.getElementById("username_slot").innerHTML = username;
	contract = new web3.eth.Contract(abi, contractAddress, {
		from: clientAddress,
		gas: 5000000000,
	});
    logOutput("Connected to contract at address: "+formatAddress(contractAddress));
}

function joinAsAdministrator() {
    joinContract();
	document.getElementById("ChooseClient").style.display = "none";
	document.getElementById("AdminForm").style.display = "block";
}

function joinExistingBallot() {
	joinContract();
	document.getElementById("ChooseClient").style.display = "none";
	document.getElementById("UserForm").style.display = "block";
}

function registerToVote() {
	annotate(contract.methods.register(username).send());
}

async function checkIfIsRegistered() {
    try {
        const result = await contract.methods.checkIfIsRegistered(clientAddress).call();
        logOutput("Is registered to vote: "+result);
    } catch (error) {
        logError(error);
    }
}

function selfNominate() {
	annotate(contract.methods.selfNominate().send());
}

function nominateCandidate() {
    const addr = document.getElementById("nomineeAddress").value;
    annotate(contract.methods.nominateCandidate(fixAddress(addr)).send());
}

async function checkIfIsCandidate() {
    try {
        const result = await contract.methods.checkIfIsCandidate(clientAddress).call();
        logOutput("Is registered as a candidate: "+result);
    } catch (error) {
        logError(error);
    }
}

function formatAddress(addr) {
    return highlightText(addr,"#30d0d0");
}

function formatName(name,address){
    return highlightText(name,"#f090f0") + " (" + formatAddress(address) + ")";
}

async function whoVotedFor() {
    try {
        const result = await contract.methods.whoDidIVoteFor().call();
        logOutput("You voted for: "+formatName(result[1],result[0]));
    } catch (error) {
        logError(error);
    }
}

async function getCandidates() {
    try {
        const result = await contract.methods.getCandidates().call();
        var output = "Candidates:<br>";
        for (let i = 0; i < result[0].length; i++) {
            output += formatName(result[1][i],result[0][i]) + "<br>";
        }
        logOutput(output);
    } catch (error) {
        logError(error);
    }
}

function fixAddress(addr) {
    return web3.utils.toChecksumAddress(addr);
}

function castBallot() {
    const addr = document.getElementById("chosen_candidate").value;
    annotate(contract.methods.castBallot(fixAddress(addr)).send());
}

function selfVote() {
    const addr = document.getElementById("chosen_candidate").value;
    annotate(contract.methods.castBallot(fixAddress(clientAddress)).send());
}

async function getResults() {
    try {
        const result = await contract.methods.getVoteResults().call();
        var output = "Candidates:<br>";
        for (let i = 0; i < result[0].length; i++) {
            output += highlightText("(" + result[2][i] + " Votes)","#f0f090") + " --> " + formatName(result[1][i],result[0][i]) + "<br>";
        }
        logOutput(output);
    } catch (error) {
        logError(error);
    }
}

async function getWinner() {
    try {
        const result = await contract.methods.getWinner().call();
        logOutput("Winner: " + formatName(result[1],result[0]));
    } catch (error) {
        logError(error);
    }
}

const stageNames = ["Voter Registration", "Candidate Nomination", "Voting", "Final Results"];

async function getCurrentStage() {
    try {
        const result = await contract.methods.getCurrentStage().call();
        logOutput("Current Stage: "+highlightText(result,"#f0f090")+" ("+highlightText(stageNames[result],"#f0f090")+")");
    } catch (error) {
        logError(error);
    }
}

// Admin functions:

async function getRegisteredVoters() {
    try {
        const result = await contract.methods.getRegisteredVoters().call();
        var output = "Registered Voters:<br>";
        for (let i = 0; i < result[0].length; i++) {
            output += formatName(result[1][i],result[0][i]) + "<br>";
        }
        logOutput(output);
    } catch (error) {
        logError(error);
    }
}

function purgeVoters() {
    annotate(contract.methods.purgeVoterRolls().send());
}

function nextStage() {
    annotate(contract.methods.nextRound().send());
}

function copyText(buttonID){
    const text = document.getElementById(buttonID).innerHTML;
    navigator.clipboard.writeText(text);
    logOutput("Copied to clipboard: "+highlightText(text,"#30d0d0"));
}

function clearLog(){
    document.getElementById("output_log").innerHTML = "";
}