import { createEIP712, createInstance as createFhevmInstance, generateKeypair } from "fhevmjs/node";
import { FhevmInstance } from "fhevmjs/node";
import { network } from "hardhat";

import { ACL_ADDRESS, GATEWAY_URL, KMSVERIFIER_ADDRESS } from "./constants";
import { createEncryptedInputMocked, reencryptRequestMocked } from "./fhevmjsMocked";
import { PublicParams } from "fhevmjs/lib/sdk/encrypt";

const kmsAdd = KMSVERIFIER_ADDRESS;
const aclAdd = ACL_ADDRESS;

export const createInstance = async (): Promise<FhevmInstance> => {
  if (network.name === "hardhat") {
    const instance = {
      reencrypt: reencryptRequestMocked,
      createEncryptedInput: createEncryptedInputMocked,
      getPublicKey: () => ({ publicKeyId: "id", publicKey: Uint8Array.from(Buffer.from("0xFFAA44433", "hex")) }),
      generateKeypair: generateKeypair,
      createEIP712: createEIP712(network.config.chainId),
      getPublicParams: (_bits: keyof PublicParams) => null,
    };
    return instance;
  } else {
    const instance = await createFhevmInstance({
      kmsContractAddress: kmsAdd,
      aclContractAddress: aclAdd,
      networkUrl: network.config.url,
      gatewayUrl: GATEWAY_URL,
    });
    return instance;
  }
};
