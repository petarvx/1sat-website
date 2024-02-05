"use client";

import { AssetType, toastErrorProps } from "@/constants";
import { payPk, pendingTxs, utxos } from "@/signals/wallet";
import { useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import {
  P2PKHAddress,
  PrivateKey,
  Script,
  SigHash,
  Transaction,
  TxIn,
  TxOut,
} from "bsv-wasm-web";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import toast from "react-hot-toast";
import { toSatoshi } from "satoshi-bitcoin-ts";

interface TransferModalProps {
  onClose: () => void;
  amount?: number;
  address?: string;
  type: AssetType;
  id: string;
  balance: number;
  sym?: string;
}

const TransferBsv20Modal: React.FC<TransferModalProps> = ({
  type,
  balance,
  sym,
  id,
  amount: amt,
  address: addr,
  onClose,
}) => {
  useSignals();
  const router = useRouter();
  // use signal for amount and address
  const amount = useSignal(amt?.toString() || "0");
  const address = useSignal(addr || "");

  const setAmountToBalance = useCallback(() => {
    amount.value = balance.toString();
    console.log(amount.value);
  }, [amount, balance]);

  const send = useCallback(
    async (address: string, satoshis: number) => {
      if (!payPk.value) {
        return;
      }

      if (!address?.startsWith("1")) {
        console.error("inivalid receive address");
        return;
      }
      toast(`Sending to ${address}`, {
        style: {
          background: "#333",
          color: "#fff",
        },
      });

      const feeSats = 20;
      const satsNeeded = satoshis + feeSats;
      const paymentPk = PrivateKey.from_wif(payPk.value);
      const tx = new Transaction(1, 0);

      // Outputs
      let inputValue = 0;
      for (let u of utxos.value || []) {
        inputValue += u.satoshis;
        if (inputValue >= satsNeeded) {
          break;
        }
      }
      const satsIn = inputValue;

      const change = satsIn - satoshis - feeSats;
      console.log({ feeSats, satsIn, satoshis, change });
      tx.add_output(
        new TxOut(
          BigInt(satoshis),
          P2PKHAddress.from_string(address).get_locking_script()
        )
      );

      // add change output
      if (change > 0) {
        tx.add_output(
          new TxOut(
            BigInt(change),
            P2PKHAddress.from_pubkey(
              PrivateKey.from_wif(payPk.value).to_public_key()
            ).get_locking_script()
          )
        );
      }

      // build txins from our UTXOs
      let idx = 0;
      let totalSats = 0;
      for (let u of utxos.value || []) {
        console.log({ u });
        const inx = new TxIn(
          Buffer.from(u.txid, "hex"),
          u.vout,
          Script.from_asm_string("")
        );
        console.log({ inx });
        inx.set_satoshis(BigInt(u.satoshis));
        tx.add_input(inx);

        const sig = tx.sign(
          paymentPk,
          SigHash.InputOutputs,
          idx,
          Script.from_asm_string(u.script),
          BigInt(u.satoshis)
        );

        console.log({ sig: sig.to_hex() });

        // const s = Script.from_asm_string(u.script);
        // inx.set_unlocking_script(
        //   P2PKHAddress.from_string(changeAddress || "").get_unlocking_script(
        //     paymentPk.to_public_key(),
        //     sig
        //   )
        // );

        inx.set_unlocking_script(
          Script.from_asm_string(
            `${sig.to_hex()} ${paymentPk.to_public_key().to_hex()}`
          )
        );

        tx.set_input(idx, inx);
        idx++;

        totalSats += u.satoshis;
        if (satsNeeded <= totalSats) {
          break;
        }
      }

      const rawTx = tx.to_hex();
      // const { rawTx, fee, size, numInputs, numOutputs } = resp;

      pendingTxs.value = [
        {
          rawTx,
          size: Math.ceil(rawTx.length / 2),
          fee: 20,
          numInputs: tx.get_ninputs(),
          numOutputs: tx.get_noutputs(),
          txid: tx.get_id_hex(),
          inputTxid: tx.get_input(0)!.get_prev_tx_id_hex(),
        },
      ];

      router.push("/preview");
    },
    [router]
  );

  const submit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!amount.value || !address.value) {
        return;
      }
      if (toSatoshi(amount.value) > balance) {
        toast.error("Not enough Bitcoin!", toastErrorProps);
        return;
      }
      console.log(amount.value, address.value);
      send(address.value, toSatoshi(amount.value));
    },
    [amount.value, address.value, balance, send]
  );

  return (
    <div
      className="z-10 flex items-center justify-center fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-50 overflow-hidden"
      onClick={() => onClose()}
    >
      <div
        className="w-full max-w-lg m-auto p-4 bg-[#111] text-[#aaa] rounded flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-64 md:h-full overflow-hidden mb-4">
          <form onSubmit={submit}>
            <div className="flex justify-between">
              <div className="text-lg font-semibold">Transfer {type}</div>
              <div
                className="text-xs cursor-pointer text-[#aaa]"
                onClick={setAmountToBalance}
              >
                Balance: {balance} {type === AssetType.BSV21 ? id : sym}
              </div>
            </div>

            <div className="flex flex-col w-full">
              <label className="text-sm font-semibold text-[#aaa] mb-2">
                Amount
              </label>
              <input
                type="number"
                placeholder="0.00000000"
                max={balance}
                className="input input-bordered w-full"
                value={amount.value || "0"}
                onChange={(e) => {
                  amount.value = e.target.value;
                }}
              />
            </div>
            <div className="flex flex-col mt-4">
              <label className="text-sm font-semibold text-[#aaa] mb-2">
                Address
              </label>
              <input
                type="text"
                placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
                className="input input-bordered w-full"
                value={address.value}
                onChange={(e) => {
                  address.value = e.target.value;
                }}
              />
            </div>
            <div className="modal-action">
              <button className="bg-[#222] p-2 rounded cusros-pointer hover:bg-emerald-600 text-white">
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransferBsv20Modal;
