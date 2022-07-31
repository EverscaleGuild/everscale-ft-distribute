import { Contract } from "locklift/.";

const { Command } = require("commander");
const {
  logContract,
  isValidEverAddress,
  isNumeric,
  Migration,
} = require("./../scripts/utils");

const logger = require("mocha-logger");
const program = new Command();
const prompts = require("prompts");
const fs = require("fs");
async function main() {
  const promptsData = [];
  program
    .allowUnknownOption()
    .option("-kn, --key_number <key_number>", "Public key number")
    .option(
      "-b, --balance <balance>",
      "Initial balance in EVERs (will send from Giver)",
    );

  program.parse(process.argv);

  const options = program.opts();

  if (!options.key_number) {
    promptsData.push({
      type: "text",
      name: "keyNumber",
      message: "Public key number",
      validate: value => (isNumeric(value) ? true : "Invalid number"),
    });
  }

  if (!options.balance) {
    promptsData.push({
      type: "text",
      name: "balance",
      message: "Initial balance (will send from Giver)",
      validate: value => (isNumeric(value) ? true : "Invalid number"),
    });
  }

  const response = await prompts(promptsData);

  const keyNumber = +(options.key_number || response.keyNumber);
  const balance = +(options.balance || response.balance);

  const signer = (await locklift.keystore.getSigner(keyNumber.toString()))!;
  let accountsFactory = locklift.factory.getAccountsFactory("Account");

  const { contract: MyAccount, tx } = await accountsFactory.deployNewAccount({
    publicKey: signer.publicKey,
    initParams: {
      _randomNonce: 0, //locklift.utils.getRandomNonce(),
    },
    constructorParams: {},
    value: locklift.utils.toNano(balance),
  });
  console.log(tx.transaction.outMessages[0].src);
  console.log(`Wallet deployed at: ${MyAccount}`);
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });