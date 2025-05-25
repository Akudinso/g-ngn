//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract GNGN is ERC20, ERC20Burnable, AccessControl {
    // Define a role for the GOVERNOR
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");

    //Track blacklisted address
    mapping(address => bool) private blacklist;

    //constructor runs when contract is deployed
    constructor(address initialGovernor) ERC20("G-Naira", "GNGN") {
        _grantRole(DEFAULT_ADMIN_ROLE, initialGovernor); // admin role
        _grantRole(GOVERNOR_ROLE, initialGovernor); // governor role
    }

    // Mint new tokens (only GOVERNOR can do this)
    function mint(address to, uint256 amount) external onlyRole(GOVERNOR_ROLE) {
        _mint(to, amount);
    }

    // Burn tokens (only GOVERNOR can burn from any account)
    function governorBurn(
        address account,
        uint256 amount
    ) public onlyRole(GOVERNOR_ROLE) {
        _burn(account, amount);
    }

    // Blacklist an address
    function blacklistAddress(address user) external onlyRole(GOVERNOR_ROLE) {
        blacklist[user] = true;
    }

    // Remove from blacklist
    function unblacklistAddress(address user) external onlyRole(GOVERNOR_ROLE) {
        blacklist[user] = false;
    }

    //Check if address is blacklisted (public read)
    function isBlacklisted(address user) public view returns (bool) {
        return blacklist[user];
    }

    // ✅ Manually block transfer if blacklisted
    function transfer(
        address to,
        uint256 amount
    ) public override returns (bool) {
        require(!blacklist[msg.sender], "Sender is blacklisted");
        require(!blacklist[to], "Receiver is blacklisted");
        return super.transfer(to, amount);
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public override returns (bool) {
        require(!blacklist[from], "Sender is blacklisted");
        require(!blacklist[to], "Receiver is blacklisted");
        return super.transferFrom(from, to, amount);
    }

    //Multisig
    struct MintProposal {
        address to;
        uint256 amount;
        uint256 approvals;
        bool executed;
    }

    uint256 public mintProposalCount;

    mapping(uint256 => MintProposal) public mintProposals;
    mapping(uint256 => mapping(address => bool)) public mintApprovals;

    struct BurnProposal {
        address from;
        uint256 amount;
        uint256 approvals;
        mapping(address => bool) approvedBy;
        bool executed;
    }

    uint256 public burnProposalCount;

    mapping(uint256 => BurnProposal) private burnProposals;

    function proposeMint(
        address to,
        uint256 amount
    ) external onlyRole(GOVERNOR_ROLE) returns (uint256) {
        uint256 proposalId = mintProposalCount++;
        MintProposal storage p = mintProposals[proposalId];
        p.to = to;
        p.amount = amount;
        p.approvals = 0;
        p.executed = false;

        emit MintProposed(proposalId, to, amount, msg.sender);
        return proposalId;
    }

    function approveMint(uint256 proposalId) external onlyRole(GOVERNOR_ROLE) {
        MintProposal storage p = mintProposals[proposalId];

        require(!p.executed, "Already executed");
        require(!mintApprovals[proposalId][msg.sender], "Already approved");

        mintApprovals[proposalId][msg.sender] = true;
        p.approvals++;

        emit MintApproved(proposalId, msg.sender);

        if (p.approvals >= 2) {
            p.executed = true;
            _mint(p.to, p.amount);
            emit MintExecuted(proposalId, p.to, p.amount);
        }
    }

    function proposeBurn(
        address from,
        uint256 amount
    ) external onlyRole(GOVERNOR_ROLE) returns (uint256) {
        uint256 proposalId = burnProposalCount++;
        BurnProposal storage p = burnProposals[proposalId];
        p.from = from;
        p.amount = amount;
        p.approvals = 0;
        p.executed = false;

        emit BurnProposed(proposalId, from, amount, msg.sender);
        return proposalId;
    }

    function approveBurn(uint256 proposalId) external onlyRole(GOVERNOR_ROLE) {
        BurnProposal storage p = burnProposals[proposalId];

        require(!p.executed, "Already executed");
        require(!p.approvedBy[msg.sender], "Already approved");

        p.approvedBy[msg.sender] = true;
        p.approvals++;

        emit BurnApproved(proposalId, msg.sender);

        if (p.approvals >= 2) {
            p.executed = true;
            _burn(p.from, p.amount);
            emit BurnExecuted(proposalId, p.from, p.amount);
        }
    }

    event MintProposed(
        uint256 indexed proposalId,
        address indexed to,
        uint256 amount,
        address proposer
    );
    event MintApproved(uint256 indexed proposalId, address approver);
    event MintExecuted(uint256 indexed proposalId, address to, uint256 amount);

    event BurnProposed(
        uint256 indexed proposalId,
        address indexed from,
        uint256 amount,
        address proposer
    );
    event BurnApproved(uint256 indexed proposalId, address approver);
    event BurnExecuted(
        uint256 indexed proposalId,
        address from,
        uint256 amount
    );
}
