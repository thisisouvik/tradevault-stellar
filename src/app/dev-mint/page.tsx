"use client";

import { useState } from "react";
import { isAllowed, setAllowed, getAddress, signTransaction } from "@stellar/freighter-api";
import { Horizon, Keypair, Asset, TransactionBuilder, Operation, Networks, Transaction } from "@stellar/stellar-sdk";

export default function DevMintPage() {
  const [status, setStatus] = useState("Idle");

  const mintTokens = async () => {
    try {
      setStatus("Connecting to Freighter...");
      if (!(await isAllowed())) await setAllowed();
      const { address } = await getAddress();
      if (!address) throw new Error("Could not get Freighter address");

      setStatus("Creating Temporary Testnet Issuer...");
      const server = new Horizon.Server("https://horizon-testnet.stellar.org");
      const issuerKeypair = Keypair.random();
      
      await fetch(`https://friendbot.stellar.org?addr=${issuerKeypair.publicKey()}`);

      setStatus("Requesting Trustline Signature in Freighter (Please approve)...");
      const usdcAsset = new Asset("USDC", issuerKeypair.publicKey());
      const userAccount = await server.loadAccount(address);

      const txTrust = new TransactionBuilder(userAccount, {
        fee: "10000",
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(Operation.changeTrust({ asset: usdcAsset }))
        .setTimeout(30)
        .build();

      let signedResponse = await signTransaction(txTrust.toXDR(), { 
        networkPassphrase: Networks.TESTNET
      });
      
      let finalXdr = typeof signedResponse === "string" ? signedResponse : (signedResponse as any).signedTxXdr || (signedResponse as any).signedTransaction;
      
      if (!finalXdr) throw new Error("Signature failed or was cancelled: " + JSON.stringify(signedResponse));

      const signedTrustTx = TransactionBuilder.fromXDR(finalXdr, Networks.TESTNET);
      
      setStatus("Submitting Trustline...");
      await server.submitTransaction(signedTrustTx);

      setStatus("Minting 10,000 USDC...");
      const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());
      const txPayment = new TransactionBuilder(issuerAccount, {
        fee: "10000",
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(Operation.payment({
          destination: address,
          asset: usdcAsset,
          amount: "10000",
        }))
        .setTimeout(30)
        .build();

      txPayment.sign(issuerKeypair);
      await server.submitTransaction(txPayment);

      setStatus("Success! You now have 10,000 USDC. You can close this page.");
    } catch (e: any) {
      console.error(e);
      setStatus(`Error: ${e.message}`);
    }
  };

  return (
    <div className="p-10 flex col gap-4 max-w-xl mx-auto mt-20 bg-slate-50 border rounded shadow">
      <h1 className="text-2xl font-bold mb-2">🛠️ Test Token Faucet (Dev)</h1>
      <p className="text-gray-600 mb-6">
        Click below to use Freighter to sign a trustline and mint 10,000 Testnet USDC directly into your wallet. No secret keys needed!
      </p>
      <button 
        onClick={mintTokens} 
        className="bg-black text-white px-6 py-3 rounded font-medium hover:bg-gray-800 transition"
      >
        Mint 10,000 USDC
      </button>
      <div className="mt-6 p-4 min-h-[60px] bg-slate-200 rounded font-mono text-sm text-gray-800 break-words">
        Status: {status}
      </div>
    </div>
  );
}
