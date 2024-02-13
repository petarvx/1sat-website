"use client";

import DeleteWalletModal from "@/components/modal/deleteWallet";
import { useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

const DeleteWalletPage = () => {
  useSignals();
  const router = useRouter();
  const open = useSignal(true);

  const close = useCallback(
    (signedOut = false) => {
      open.value = false;
      if (signedOut) {
        router.push("/");
        return;
      }
      router.back();
    },
    [open, router]
  );

  return (
    <div className="mx-auto">
      <DeleteWalletModal open={open.value} close={close} />
    </div>
  );
};

export default DeleteWalletPage;
