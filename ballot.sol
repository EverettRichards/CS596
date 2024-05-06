pragma experimental ABIEncoderV2;
pragma solidity 0.6.12;

contract ballot{
    address owner;

    uint256 current_round;

    address[] voter_list;
    string[] voter_name_list;

    address[] candidate_list;
    string[] candidate_name_list;

    mapping(address => string) voter_names;
    mapping(address => string) candidate_names;

    mapping(address => address) votes;
    mapping(address => uint) vote_tally;
    uint[] vote_tally_list;


    address electionWinner;

    constructor() public {
        owner = msg.sender;

        voter_list = new address[](0);
        voter_name_list = new string[](0);

        candidate_list = new address[](0);
        candidate_name_list = new string[](0);

        current_round = 0; // 0 = registration, 1 = nomination, 2 = voting, 3 = closed/final
    }

    modifier onlyOwner {
        require(msg.sender==owner,"Only the CONTRACT OWNER can execute this function.");
        _;
    }

    modifier before_stage_3 {
        require(current_round<=2,"This function can't be executed once the VOTING STAGE has ended.");
        _;
    }

    modifier only_stage_3 {
        require(current_round==3,"This function can only be executed after the VOTING STAGE has ended.");
        _;
    }

    modifier after_stage_0 {
        require(current_round>0,"This function can only be executed once the CANDIDATE REGISTRATION STAGE begins.");
        _;
    }

    modifier after_stage_1 {
        require(current_round>1,"This function can only be executed once the VOTING STAGE begins.");
        _;
    }

    modifier only_stage_2 {
        require(current_round==2,"This function is only available during the VOTING STAGE.");
        _;
    }

    modifier only_stage_0 {
        require(current_round==0,"This function can't be executed after the VOTER REGISTRATION STAGE has ended.");
        _;
    }

    // PHASE 0: VOTER REGISTRATION

    function checkIfIsRegistered(address check) public view before_stage_3 returns(bool) {
        return bytes(voter_names[check]).length > 0;
    }

    function getVoterName(address check) private view before_stage_3 returns(string memory) {
        if (checkIfIsRegistered(check)) {
            return voter_names[check];
        } else {
            return "This address is not registered to vote.";
        }
    }

    function register(string calldata username) public only_stage_0 {
        require(!checkIfIsRegistered(msg.sender),"Your EOA is already registered to vote.");
        voter_list.push(msg.sender);
        voter_name_list.push(username);
        voter_names[msg.sender] = username;
    }
    
    function purgeVoterRolls() public onlyOwner only_stage_0 {
        uint256 i;
        for (i=voter_list.length; i>0; i--) {
            voter_names[voter_list[i]] = "";
            voter_list.pop();
            voter_name_list.pop();
        }
    }

    function getRegisteredVoters() public onlyOwner view returns(address[] memory, string[] memory) {
        return(voter_list,voter_name_list);
    }

    // PHASE 1: CANDIDATE REGISTRATION

    function checkIfIsCandidate(address check) public view after_stage_0 before_stage_3 returns(bool) {
        return bytes(candidate_names[check]).length > 0;
    }

    function getCandidateName(address check) private view before_stage_3 returns(string memory) {
        if (checkIfIsCandidate(check)) {
            return candidate_names[check];
        } else {
            return "This address is not registered to vote.";
        }
    }

    function nominateCandidate(address user) public {
        require(current_round==1,"This function is only available during the CANDIDATE NOMINATION STAGE.");
        require(!checkIfIsCandidate(user),"This address is already registered as a candidate.");
        require(checkIfIsRegistered(user),"The specified address is NOT a registered voter, and is therefore ineligible for candidacy.");
        candidate_list.push(user);
        string memory displayName = voter_names[user];
        candidate_name_list.push(displayName);
        candidate_names[user] = displayName;
    }

    function selfNominate() public {
        nominateCandidate(msg.sender);
    }

    function getCandidates() public view after_stage_1 returns(address[] memory, string[] memory) {
        return(candidate_list,candidate_name_list);
    }

    // STAGE 2: VOTING PHASE

    function checkIfDidVote(address check) public view before_stage_3 returns(bool) {
        return votes[check] != address(0);
    }

    function castBallot(address candidate) public only_stage_2  {
        require(checkIfIsRegistered(msg.sender),"You must be registered to vote in order to do this.");
        require(checkIfIsCandidate(candidate),"The specified address is not a valid candidate.");
        require(!checkIfDidVote(msg.sender),"You already voted! Cheater, cheater, pumpkin eater. :(");
        votes[msg.sender] = candidate;
    }

    function whoDidIVoteFor() public view only_stage_2 returns(address, string memory) {
        require(checkIfDidVote(msg.sender),"You haven't voted for anyone, yet.");
        return (votes[msg.sender],candidate_names[votes[msg.sender]]);
    }

    // STAGE 3: RESULTS PHASE

    function tallyVotes() private only_stage_3 {

        vote_tally_list = new uint[](candidate_list.length);

        uint256 i;
        for (i=0; i<voter_list.length; i++) {
            address choice = votes[voter_list[i]];
            if (choice != address(0)) {
                vote_tally[choice] = vote_tally[choice] + 1;
            }
        }

        uint highScore = 0;

        for (i=0; i<candidate_list.length; i++) {
            address candidate = candidate_list[i];
            uint tally = vote_tally[candidate];
            vote_tally_list[i] = tally;
            if (tally >= highScore) {
                highScore = tally;
                electionWinner = candidate;
            }
        }
    }

    function getWinner() public view only_stage_3 returns(address, string memory) {
        return(electionWinner,candidate_names[electionWinner]);
    }

    function getVoteResults() public view only_stage_3 returns(address[] memory, string[] memory, uint[] memory) {
        return(candidate_list,candidate_name_list,vote_tally_list);
    }

    // CONTROL METHODS

    function nextRound() public onlyOwner before_stage_3 {
        if (current_round==0){
            require(voter_list.length>0,"You can't move on to candidate registration until at least 1 VOTER is registered.");
        } else if (current_round==1){
            require(candidate_list.length>0,"You can't move on to voting until at least 1 CANDIDATE is registered.");
        }
        current_round++;

        if (current_round==3){
            tallyVotes();
        }
    }

    function getCurrentStage() public view returns(uint) {
        return current_round;
    }
}