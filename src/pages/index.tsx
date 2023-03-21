import oneSatLogo from "@/assets/images/icon.svg";
import Inscribe from "@/components/inscriptions/inscribe";
import Wallet from "@/components/wallet";
import { addressFromWif } from "@/utils/address";
import { useLocalStorage } from "@/utils/storage";
import init from "bsv-wasm-web";
import { Inscription, Utxo } from "js-1sat-ord";
import { head } from "lodash";
import Head from "next/head";
import Image from "next/image";
import router from "next/router";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import toast, { Toaster } from "react-hot-toast";
import { FiCopy } from "react-icons/fi";
import { RxReset } from "react-icons/rx";
import { TbBroadcast } from "react-icons/tb";

export enum FetchStatus {
  Idle,
  Loading,
  Success,
  Error,
}

export type CallbackData = {
  numInputs: number;
  numOutputs: number;
  fee: number;
  rawTx: string;
};

const Home = () => {
  const [showInscribe, setShowInscribe] = useLocalStorage<boolean>(
    "1satsi",
    false
  );
  const [broadcastResponse, setBroadcastResponse] = useLocalStorage(
    "1satbrs",
    undefined
  );
  const [broadcastStatus, setBroadcastStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );
  const [showWallet, setShowWallet] = useLocalStorage<boolean>("1satsw", false);
  const [fee, setFee] = useLocalStorage<number>("1satfee", 0);
  const [rawTx, setRawTx] = useLocalStorage<string | undefined>(
    "1satrt",
    undefined
  );
  const [payPk, setPayPk] = useLocalStorage<string | undefined>(
    "1satfk",
    undefined
  );
  const [ordPk, setOrdPk] = useLocalStorage<string | undefined>(
    "1satok",
    undefined
  );
  const [initialized, setInitialized] = useState<boolean>(false);

  const [fundingUtxo, setFundingUtxo] = useLocalStorage<Utxo | undefined>(
    "1satuo",
    undefined
  );
  const [file, setFile] = useState<File>();

  const [artifacts, setArtifacts] = useState<Inscription[] | undefined>(
    undefined
  );
  const [inscribedUtxos, setInscribedUtxos] = useLocalStorage<
    Utxo[] | undefined
  >("1satiux", undefined);

  const changeAddress = useMemo(
    () => payPk && initialized && addressFromWif(payPk),
    [initialized, payPk]
  );

  const receiverAddress = useMemo(
    () => ordPk && initialized && addressFromWif(ordPk),
    [initialized, ordPk]
  );

  useEffect(() => {
    const fire = async () => {
      await init();
      setInitialized(true);
    };
    if (!initialized) {
      fire();
    }
  }, [initialized, setInitialized]);

  const importKeys = useCallback(() => {
    if (!file) {
      const el = document.getElementById("backupFile");
      el?.click();
      return;
    }

    // file.type
    // file.size
    console.log({ file });
  }, [file]);

  const deleteKeys = useCallback(() => {
    const c = confirm(
      "Are you sure you want to clear your keys from the browser? This cannot be undone!"
    );

    if (c) {
      setPayPk(undefined);
      setOrdPk(undefined);
      setShowWallet(false);
      setShowInscribe(false);
      setFundingUtxo(undefined);
      setArtifacts(undefined);
      setInscribedUtxos(undefined);

      toast("Keys Cleared");
    }
  }, []);

  const backupKeys = useCallback(
    (e: any) => {
      var dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify({ payPk, ordPk }));

      const clicker = document.createElement("a");
      clicker.setAttribute("href", dataStr);
      clicker.setAttribute("download", "1sat.json");
      clicker.click();
    },
    [payPk, ordPk]
  );

  const handleClickBroadcast = useCallback(async () => {
    if (!fundingUtxo) {
      return;
    }
    console.log("click broadcast", rawTx);
    if (!rawTx) {
      return;
    }
    setBroadcastStatus(FetchStatus.Loading);
    const body = Buffer.from(rawTx, "hex");
    const response = await fetch(`https://mapi.gorillapool.io/mapi/tx`, {
      method: "POST",
      headers: {
        "Content-type": "application/octet-stream",
      },
      body,
    });

    const data = await response.json();
    console.log({ data });
    if (data && data.payload) {
      const respData = JSON.parse(data.payload || "{}");
      if (respData?.returnResult === "success") {
        toast("Broadcasted tx", respData.txid);
        setBroadcastStatus(FetchStatus.Success);
        setBroadcastResponse(respData);
        return;
      } else {
        toast("Failed to broadcast", respData);
      }
      setBroadcastStatus(FetchStatus.Error);
    }
  }, [rawTx, setBroadcastResponse, fundingUtxo]);

  const handleFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const jsonString = await e.target.files[0].text();
        console.log({ jsonString });
        if (jsonString) {
          const json = JSON.parse(jsonString);
          const pPk = json.payPk;
          const oPk = json.ordPk;
          setPayPk(pPk);
          setOrdPk(oPk);
          setFile(e.target.files[0]);
          setShowWallet(true);
        }
      }
    },
    [setPayPk, setOrdPk, setShowWallet]
  );

  return (
    <>
      <Head>
        <title>1SatOrdinals.com</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Mono&family=Roboto+Slab&family=Ubuntu:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <main className="flex items-center justify-center h-screen w-screen">
        <div className="flex flex-col items-center justify-between w-full h-full">
          <div className="h-10">
            <h1
              className="text-2xl py-4 cursor-pointer"
              onClick={() => router.push("/")}
            >
              1Sat Ordinals
            </h1>
          </div>
          {!rawTx ? (
            <div className="h-full w-full flex flex-col items-center justify-center max-w-[600px] text-yellow-400 font-mono">
              {!showWallet && !showInscribe && (
                <div className="cursor-pointer my-8 w-full">
                  <Image
                    style={{
                      boxShadow: "0 0 0 0 rgba(0, 0, 0, 1)",
                      transform: "scale(1)",
                      animation: "pulse 2s infinite",
                      width: "12rem",
                      height: "12rem",
                    }}
                    src={oneSatLogo}
                    onClick={() => setShowWallet(true)}
                    alt={"1Sat Ordinals"}
                    className="mx-auto rounded"
                  />
                </div>
              )}
              {showWallet && (
                <div
                  className={`flex flex-col ${showInscribe ? "hidden" : ""}`}
                >
                  <Wallet
                    onArtifactsChange={(props) => {
                      setArtifacts(props.artifacts);
                      setInscribedUtxos(props.inscribedUtxos);
                    }}
                    onKeysGenerated={({ payPk, ordPk }) => {
                      setPayPk(payPk);
                      setOrdPk(ordPk);
                    }}
                    payPk={payPk}
                    ordPk={ordPk}
                    onInputTxidChange={(inputTxId: string) =>
                      console.log({ inputTxId })
                    }
                    onUtxoChange={(utxo: Utxo) => {
                      console.log({ utxo });
                      setFundingUtxo(utxo);
                      setShowWallet(true);
                      setShowInscribe(true);
                    }}
                    fundingUtxo={fundingUtxo}
                    onFileChange={function (utxo: Utxo): void {
                      throw new Error("Function not implemented.");
                    }}
                    file={file}
                  />
                </div>
              )}

              {initialized &&
                receiverAddress &&
                payPk &&
                showInscribe &&
                fundingUtxo && (
                  <Inscribe
                    reset={() => {
                      setRawTx(undefined);
                      setFee(undefined);
                      setShowInscribe(false);
                      setShowWallet(true);
                    }}
                    fundingUtxo={fundingUtxo}
                    callback={({ rawTx, fee, numInputs, numOutputs }) => {
                      // TODO: set more data on preview
                      console.log({ rawTx, fee, numInputs, numOutputs });
                      setRawTx(rawTx);
                      setFee(fee);
                    }}
                    payPk={payPk}
                    receiverAddress={receiverAddress}
                    initialized={initialized}
                  />
                )}
            </div>
          ) : (
            <div>
              <h1 className="text-center text-2xl">Ordinal Generated</h1>
              <div className="text-center text-[#aaa] my-2">
                You still need to broadcast this before it goes live.
              </div>
              <div className="w-[600px] w-full max-w-lg mx-auto p-2 h-[300px] whitespace-pre-wrap break-all font-mono rounded bg-[#111] text-xs text-ellipsis overflow-hidden p-2 text-teal-700 my-8 relative">
                {rawTx}
                <div className="p-4 absolute w-full text-white bg-black bg-opacity-75 bottom-0 left-0">
                  <div className="flex justify-between">
                    <div>Size</div>
                    <div>{rawTx.length / 2} Bytes</div>
                  </div>
                  <div className="flex justify-between">
                    <div>Fee</div>
                    <div>{fee} Satoshis</div>
                  </div>
                  {fee && (
                    <div className="flex justify-between">
                      <div>Fee Rate</div>
                      <div>{(fee / (rawTx.length / 2)).toFixed(5)} sat/B</div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <CopyToClipboard
                  text={rawTx}
                  onCopy={() => toast("Copied Raw Tx")}
                >
                  <button className="w-full p-2 text-lg bg-teal-400 rounded my-4 text-black font-semibold flex items-center">
                    <div className="mx-auto flex items-center justify-center">
                      <FiCopy className="w-10" />
                      <div>Copy</div>
                    </div>
                  </button>
                </CopyToClipboard>

                <button
                  onClick={handleClickBroadcast}
                  className="w-full p-2 text-lg disabled:bg-[#333] text-[#aaa] bg-orange-400 rounded my-4 text-black font-semibold"
                  disabled={broadcastStatus === FetchStatus.Loading}
                >
                  <div className="mx-auto flex items-center justify-center">
                    <TbBroadcast className="w-10" />
                    <div>Broadcast</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setFundingUtxo(undefined);
                    setRawTx(undefined);
                    setShowInscribe(false);
                    // setShowWallet(false);
                  }}
                  className="w-full p-2 text-lg bg-gray-400 rounded my-4 text-black font-semibold"
                >
                  <div className="mx-auto flex items-center justify-center">
                    <RxReset className="w-10" />
                    <div>Start Over</div>
                  </div>
                </button>
              </div>
            </div>
          )}
          {(artifacts?.length || 0) > 0 && (
            <div>
              <h1 className="text-center my-4 text-2xl">My Ordinals</h1>

              <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4 max-w-4xl mx-auto">
                {artifacts?.map((a) => {
                  return (
                    <a
                      key={a.outPoint}
                      target="_blank"
                      href={`https://whatsonchain.com/tx/${head(
                        a.outPoint.split("_")
                      )}`}
                    >
                      <img
                        className="w-full rounded"
                        // src={`https://ordinals.gorillapool.io/api/origin/${
                        //   a.outPoint.split("_")[0]
                        // }/${a.outPoint.split("_")[1]}`}
                        src={`data:${a.contentType};base64,${a.dataB64}`}
                      />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
          <div
            className="flex items-center font-mono text-yellow-400 py-8"
            style={{
              height: "4rem",
              textAlign: "center",
            }}
          >
            <a
              className="font-mono text-yellow-400"
              href="https://docs.1satordinals.com"
            >
              Read the Docs
            </a>
            <div className="mx-4">·</div>
            {payPk && (
              <div className="cursor-pointer" onClick={backupKeys}>
                Backup Keys
              </div>
            )}
            {!payPk && (
              <div className="cursor-pointer" onClick={importKeys}>
                Import Keys
              </div>
            )}
            {payPk && <div className="mx-4">·</div>}

            {payPk && (
              <div
                className="cursor-pointer text-orange-600"
                onClick={deleteKeys}
              >
                Delete Keys
              </div>
            )}
          </div>
        </div>
        <div>
          <Toaster />
          <input
            accept=".json"
            className="hidden"
            id="backupFile"
            onChange={handleFileChange}
            type="file"
          />
        </div>
      </main>
    </>
  );
};

export default Home;
