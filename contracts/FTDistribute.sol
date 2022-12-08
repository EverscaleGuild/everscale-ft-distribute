pragma ton-solidity >= 0.57.3;
pragma AbiHeader expire;
pragma AbiHeader pubkey;

import '@broxus/contracts/contracts/utils/CheckPubKey.sol';

import "@broxus/tip3/contracts/interfaces/ITokenRoot.sol";
import "@broxus/tip3/contracts/interfaces/ITokenWallet.sol";

import "@broxus/tip3/contracts/libraries/TokenMsgFlag.sol";

import "./abstract/FTDistributeBase.sol";
import "./libraries/GitcoinErrors.sol";

contract FTDistribute is FTDistributeBase, CheckPubKey {
    uint128 ftWalletBalance;

    constructor(
        uint128 ftWalletBalanceInit,
        address ft
    ) public checkPubKey {
        tvm.accept();
        ftRoot = ft;
        ftWalletBalance = ftWalletBalanceInit;
        ITokenRoot(ftRoot).deployWallet{
            value: ftWalletBalance + msgFee,
            flag: TokenMsgFlag.IGNORE_ERRORS,
            callback: FTDistributeBase.receiveTokenWalletAddress
        }(
            address(this),
            ftWalletBalance
        );
    }

    function distribute(uint128[] amount, address[] to) view public checkPubKey {
        tvm.accept();
        // TODO add checks
        for (uint i=0; i < to.length; i++) {
            _payReward(amount[i], to[i]);
        }
    }

    function _payReward(uint128 amount, address to) private inline view {
        TvmCell _empty;
        ITokenWallet(tokenWallet).transfer{
            value: ftWalletBalance + msgFee,
            flag: TokenMsgFlag.IGNORE_ERRORS,
            bounce: true
            } ({
                amount: amount,
                recipient: to,
                deployWalletValue: ftWalletBalance,
                remainingGasTo: address(this),
                notify: true,
                payload: _empty
        });
    }

    function destruct(address dest) public checkPubKey {
        selfdestruct(dest);
    }
}
