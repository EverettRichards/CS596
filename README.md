Video Demonstration:
**https://youtu.be/9of0OjKY4Uo**

Project Report:
**https://docs.google.com/document/d/16YtYtjMXNKOhIDEmvKrmIx3lkmeB0FyrRrHWY8YircA/edit?usp=sharing**

Prerequisites:
- Remix IDE
- Truffle Ganache or another Ethereum blockchain simulator
- Web browser (preferably Chrome)
- Python installation (optional)

Setup Instructions:
1. Download all the files from this repository.
3. Compile **ballot.sol** in Remix IDE using Solidity 0.6.12.
4. Deploy the _ballot_ contract to a local ETH network, such as Ganache, using the provided localhost endpoint. If possible, initialize the blockchain ledger with 100 addresses.
5. Open a command terminal. CD to the location of the project folder. Run the command: _python -m http.server_ to host the HTML/CSS/JS/JSON files on the localhost.
6. Open a web browser (preferably Chrome). Navigate to the localhost endpoint provided in step (3).
7. Begin interacting with the application from the web browser.
8. Create additional browser tabs to interact with the contract from various addresses.

Use Instructions:
1. From the browser interface, choose a number from 0 to 99 to select your EOA from one of the 100 addresses supplied by Ganache. Note: For the administrator client, you will need to select the index corresponding to the address that was selected when deploying the contract in Remix.
2. Enter a display name and paste the Contract Address (found in Remix IDE).
3. Interact with the Smart Contract using the available buttons. More explanation of the features and use cases can be found in the Project Report and Video Demonstration linked at the top of this document.
