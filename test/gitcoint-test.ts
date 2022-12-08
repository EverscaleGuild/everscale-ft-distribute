import { expect } from "chai";
import { Contract, Signer, Address } from "locklift";
import { FactorySource } from "../build/factorySource";
import { zeroAddress, EMPTY_TVM_CELL } from "./../scripts/utils";

let contract: Contract<FactorySource["FTDistribute"]>;
let signer: Signer;
let tokenRoot: Contract<FactorySource["TokenRoot"]>;
const accountsFactory = locklift.factory.getAccountsFactory("Account");

let wallets: any[];

const keyNumber = "0";

const DECIMALS = 6;
const NAME = "Gitcoin Warmup TIP3 Token";
const SYMBOL = "GWT3";

describe("Test FTDistribute contract", async function () {
  before(async () => {
    signer = (await locklift.keystore.getSigner(keyNumber))!;
    const deploys: Promise<{ account: Object; tx: Object }>[] = [];

    for (let i = 0; i < 5; i++) {
      const signer = (await locklift.keystore.getSigner(i.toString()))!;
      deploys.push(
        accountsFactory.deployNewAccount({
          publicKey: signer.publicKey,
          initParams: {
            _randomNonce: locklift.utils.getRandomNonce(),
          },
          constructorParams: {},
          value: locklift.utils.toNano(300),
        }),
      );
    }
    wallets = (await Promise.all(deploys)).map(o => o.account);
  });

  describe("Contracts", async function () {
    it("Load contract factory", async function () {
      const gitcoinData =
        locklift.factory.getContractArtifacts("FTDistribute");

      expect(gitcoinData.code).not.to.equal(
        undefined,
        "Code should be available",
      );
      expect(gitcoinData.abi).not.to.equal(
        undefined,
        "ABI should be available",
      );
      expect(gitcoinData.tvc).not.to.equal(
        undefined,
        "tvc should be available",
      );
    });

    it("Deploy contract", async function () {
      const wallet = wallets[0];
      const tokenWalletData =
        locklift.factory.getContractArtifacts("TokenWallet");
      let { contract: _tokenRoot } = await locklift.factory.deployContract({
        workchain: 0,
        contract: "TokenRoot",
        publicKey: signer.publicKey,
        initParams: {
          deployer_: new Address(zeroAddress),
          randomNonce_: (Math.random() * 6400) | 0,
          rootOwner_: wallet.address,
          name_: NAME,
          symbol_: SYMBOL,
          decimals_: DECIMALS,
          walletCode_: tokenWalletData.code,
        },
        constructorParams: {
          initialSupplyTo: new Address(zeroAddress),
          initialSupply: 0,
          deployWalletValue: locklift.utils.toNano(10),
          mintDisabled: false,
          burnByRootDisabled: false,
          burnPaused: false,
          remainingGasTo: new Address(zeroAddress),
        },
        value: locklift.utils.toNano(15),
      });
      tokenRoot = _tokenRoot;
      const deploy = await locklift.factory.deployContract({
        contract: "FTDistribute",
        publicKey: signer.publicKey,
        initParams: {
          _randomNonce: locklift.utils.getRandomNonce(),
        },
        constructorParams: {
          ftWalletBalanceInit: locklift.utils.toNano(5),
          ft: tokenRoot.address,
        },
        value: locklift.utils.toNano(100),
      });
      console.log('deploy', deploy.contract.address.toString())
      contract = deploy.contract
      const myWallet = accountsFactory.getAccount(
        wallet.address,
        signer.publicKey,
      );
      await myWallet.runTarget(
        {
          contract: tokenRoot,
          value: locklift.utils.toNano(5),
        },
        tRoot => {
          return tRoot.methods.mint({
            amount: 1500 * 10 ** DECIMALS,
            recipient: deploy.contract.address,
            deployWalletValue: locklift.utils.toNano(1),
            remainingGasTo: wallet.address,
            notify: true,
            payload: EMPTY_TVM_CELL,
          });
        },
      );
      let out = await deploy.contract.methods.balance({}).call();
      console.log('DEBUG', out)
      expect(out.balance).to.be.equal(`${1500 * 10 ** DECIMALS}`);
      expect(
        await locklift.provider.getBalance(deploy.contract.address)
          .then(balance => Number(balance)),
      ).to.be.above(0);
    });
  });

  describe("Interact with contract", async function () {
    it("Distribute flow", async function () {
      console.log("contract", contract.address.toString());
      const out = await contract.methods.distribute({
        amount: [100],
        to: [wallets[1]],
      })
      console.log("DEBUG", out);
    });
  });
});
