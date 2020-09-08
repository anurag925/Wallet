import React, { Component } from 'react';
import './App.css';
import Web3 from 'web3';
import DaiTokenMock from '../abis/DaiTokenMock.json'
import Biconomy from "@biconomy/mexa";

let biconomy;
class App extends Component {
  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadWeb3() {
    if (window.ethereum) {
      // window.web3 = new Web3(window.ethereum)
      biconomy = new Biconomy(window.ethereum, {apiKey: "V_uOICY02.ea8a2067-3fda-4c30-bb0c-db1d7444dc0b" });
      window.web3 = new Web3(biconomy);
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  async loadBlockchainData() {
    biconomy.onEvent(biconomy.READY, async() => {
      // Initialize your dapp here like getting user accounts etc
      const web3 = window.web3
      const accounts = await web3.eth.getAccounts()
      // console.log(accounts);
      this.setState({ account: accounts[0] })
      const daiTokenAddress = "0xF11680b76A10a2A78119504AdD106FaF92e71778" // Replace DAI Address Here
      const daiTokenMock = new web3.eth.Contract(DaiTokenMock.abi, daiTokenAddress)
      this.setState({ daiTokenMock: daiTokenMock })
      const balance = await daiTokenMock.methods.balanceOf(this.state.account).call()
      this.setState({ balance: web3.utils.fromWei(balance.toString(), 'Ether') })
      const transactions = await daiTokenMock.getPastEvents('Transfer', { fromBlock: 0, toBlock: 'latest', filter: { from: this.state.account } })
      this.setState({ transactions: transactions })
      console.log(transactions)
    }).onEvent(biconomy.ERROR, (error, message) => {
      // Handle error while initializing mexa
      console.log(message);
    });

    biconomy.onEvent(biconomy.LOGIN_CONFIRMATION, async(log) => {
      // User's Contract Wallet creation successful
      console.log("heyyyyyyyyyyyyyyyyy")
      console.log(`User contract wallet address: ${log.userContract}`);
      let contractAddress=await biconomy.getUserContract(this.state.account);
      console.log("This is the user contract address inside onEvent Login cns "+contractAddress);
     });
    
  }
  
  async onLogin(event){
    try{
      let response = await biconomy.login(this.state.account);
      if(response && response.transactionHash) {
         console.log("// First time user. Contract wallet transaction pending.");
         // Wait for confirmation.

      } else if (response && response.userContract) {
         console.log("// Existing user login successful");
      }
   } catch(error) {
      console.log(`Error Code: ${error.code} Error Message: ${error.message}`);
   }
  }

  transfer(recipient, amount) {
    this.state.daiTokenMock.methods.transfer(recipient, amount).send({ from: this.state.account })
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      daiTokenMock: null,
      balance: 0,
      transactions: []
    }

    this.transfer = this.transfer.bind(this)
    this.onLogin=this.onLogin.bind(this)
  }

  render() {
    return (
      <div>
        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          <a
            className="navbar-brand col-sm-3 col-md-2 mr-0"
            href="http://www.dappuniversity.com/bootcamp"
            target="_blank"
            rel="noopener noreferrer"
          >
            Dapp University
          </a>
        </nav>
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto" style={{ width: "500px" }}>
                <a
                  href="http://www.dappuniversity.com/bootcamp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src={daiLogo} width="150" />
                </a>
                <h1>{this.state.balance} DAI</h1>
                <form onSubmit={(event) => {
                  event.preventDefault()
                  const recipient = this.recipient.value
                  const amount = window.web3.utils.toWei(this.amount.value, 'Ether')
                  this.transfer(recipient, amount)
                }}>
                  <div className="form-group mr-sm-2">
                    <input
                      id="recipient"
                      type="text"
                      ref={(input) => { this.recipient = input }}
                      className="form-control"
                      placeholder="Recipient Address"
                      required />
                  </div>
                  <div className="form-group mr-sm-2">
                    <input
                      id="amount"
                      type="text"
                      ref={(input) => { this.amount = input }}
                      className="form-control"
                      placeholder="Amount"
                      required />
                  </div>
                  <button type="button" className="btn btn-primary btn-block" onClick={this.onLogin}>Login</button>

                  <button type="submit" className="btn btn-primary btn-block">Send</button>
                </form>
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Recipient</th>
                      <th scope="col">value</th>
                    </tr>
                  </thead>
                  <tbody>
                    { this.state.transactions.map((tx, key) => {
                      return (
                        <tr key={key} >
                          <td>{tx.returnValues.to}</td>
                          <td>{window.web3.utils.fromWei(tx.returnValues.value.toString(), 'Ether')}</td>
                        </tr>
                      )
                    }) }
                  </tbody>
                </table>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
