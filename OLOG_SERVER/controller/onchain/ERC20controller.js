//사용자에게 Wallet Sync 요청받으면 DB에 있는 데이터를 트랜잭션 시켜서 동기화, ERC20에서 event 에밋하도록 하자.
require("dotenv").config();
let Contract = require("web3-eth-contract");
const Web3 = require("web3");
const { LOCAL_GANACHE, ERC20_ADDRESS, SERVER_ADDRESS, SERVER_PRIVATE_KEY } =
  process.env;
const User = require("../../models/user");
const {
  abi,
  bytecode,
} = require("../../truffle/build/contracts/ProjectERC20.json");
const { sign } = require("jsonwebtoken");

module.exports = {
  walletSync: async (req, res) => {
    console.log(req.body.username);
    const username = req.body.username;
    const queryResult = await User.findByUsername(username);
    let expectedToken = queryResult.expectedToken;
    let receivedToken = queryResult.receivedToken;
    const userwalletaddress = queryResult.address;

    Contract.setProvider(LOCAL_GANACHE);
    let contract = new Contract(abi, ERC20_ADDRESS);
    const ERC20balance = await contract.methods
      .balanceOf(userwalletaddress)
      .call();

    console.log(ERC20balance);

    if (Number(ERC20balance) === receivedToken) {
      const web3 = new Web3(LOCAL_GANACHE);
      //web3객체로 노드에 연결
      const txData = await contract.methods
        .mintToken(userwalletaddress, expectedToken)
        .encodeABI();
      //컨트랙트의 메소드를 인코드해서 트랜잭션 오브젝트에 담아야함

      const tx = {
        from: SERVER_ADDRESS,
        to: ERC20_ADDRESS,
        gas: 3000000,
        data: txData,
      };

      // 비용이 발생하는 트랜잭션은 서명을 해야합니다.
      const serverAccount = await web3.eth.accounts.privateKeyToAccount(
        SERVER_PRIVATE_KEY
      );
      //프라이빗키로 먼저 어카운트 객체를 만든담에
      //그 어카운트 객체로 트랜잭션 객체에 사인
      const signedTx = await serverAccount.signTransaction(tx);

      web3.eth.sendSignedTransaction(signedTx.rawTransaction, (err, hash) => {
        if (!err) {
          receivedToken = receivedToken + expectedToken;
          console.log(receivedToken, hash);
        } else {
          console.log(err);
        }
      });

      const TEST = await contract.methods.balanceOf(userwalletaddress).call();

      console.log(TEST);

      // // add ethereum event listene

      const filter = { address: userwalletaddress };
      const update = {
        receivedToken: receivedToken,
        expectedToken: 0,
      };
      const opt = { new: true };
      let updatedResult = await User.findOneAndUpdate(filter, update, opt);
      const result = {
        username: updatedResult.username,
        expectedToken: updatedResult.expectedToken,
        receivedToken: updatedResult.receivedToken,
      };
      res.send(result);
    } else {
      res.send("Failed!");
    }
  },
  //특정 주소로 get 요청 받음, get 요청이면 userid는 어떻게 받지?
  //mongoose로 사용자의 received token, expected token 조회
  //web3로 ERC20에 접근해서 사용자의 토큰 밸런스 확인
  //사용자의 토큰 밸런스가 received token과 일치하는지 확인
  //다르다면 관리자에게 에러 전송, 아래 로직 취소
  //토큰 밸런스가 일치하다면 사용자에게 expected token만큼 ERC20에서 전송
  //전송 확인 후(event로 전송되었는지 확인, web3.subscribe) DB 에 received token 반영
  // 위 이벤트가 일어났을때 클라이언트에 알려야되나?
};
