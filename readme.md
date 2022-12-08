# Everscale FT distribute 


## Deploy

```shell
yarn
yarn build
npx everdev contract info -n main -d _randomNonce:0 build/FTDistribute
npx everdev contract info -n main -d _randomNonce:0 build/FTDistribute -i  'ftWalletBalanceInit:1000000000,ft:<tip-3-address>'
```

## Use

```shell
npx everdev cr -n main -d _randomNonce:0 build/FTDistribute distribute
```

Example: https://everscan.io/transactions/b1033003e154e54c8946af9eda9020ad827d9998e5d55bcfd0ed22084e1aa01a/diagram
