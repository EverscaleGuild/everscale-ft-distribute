import { Command } from "commander";
import { isNumeric, Migration } from "./../scripts/utils";

import prompts from "prompts";

const migration = new Migration();
const program = new Command();

async function main() {
  const CONTRACT_NAME = "FTDistribute";
  const signer = (await locklift.keystore.getSigner("0"))!;
  const promptsData: Object[] = [];
  program
    .allowUnknownOption()
    .option("-kn, --key_number <key_number>", "Public key number")
    .option(
      "-b, --balance <balance>",
      "Initial balance in EVERs (will send from Your wallet)",
    )
  program.parse(process.argv);

  const options = program.opts();

  if (!options.balance) {
    promptsData.push({
      type: "text",
      name: "balance",
      message: "Initial balance (will send from Your wallet)",
      validate: value => (isNumeric(value) ? true : "Invalid number"),
    });
  }
  const response = await prompts(promptsData);
  const balance = +(options.balance || response.balance);
  const reward = +(options.reward || response.reward);
  const maxPlayers = +(options.max_players || response.maxPlayers);

  const tokenRootCtr = migration.load("TokenRoot", "token");

  const { contract: gitcoin } = await locklift.factory.deployContract({
    contract: CONTRACT_NAME,
    publicKey: signer.publicKey,
    initParams: {
      _randomNonce: locklift.utils.getRandomNonce(),
    },
    constructorParams: {
      ftWalletBalanceInit: locklift.utils.toNano(5),
      ft: tokenRootCtr.address,
    },
    value: locklift.utils.toNano(balance),
  });

  console.log(`deployed at: ${gitcoin.address.toString()}`);

  const tw = await gitcoin.methods.tokenWallet({}).call();
  console.log(tw);

  migration.store(gitcoin, "deploy");
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
