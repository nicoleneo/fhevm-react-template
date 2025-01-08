import { SetStateAction, useEffect, useState } from 'react';
import { getInstance } from '../../fhevmjs';
import { Eip1193Provider, Provider, ZeroAddress } from 'ethers';
import { ethers } from 'ethers';
import { reencryptEuint64 } from '../../../../hardhat/test/reencrypt.ts';

import { Box, Button, Container } from '@mui/material';
import { Unstable_NumberInput as NumberInput, NumberInputOwnProps } from '@mui/base';
import { EncryptedCounter3__factory } from '../../../types/factories/contracts/EncryptedCounter.sol/index.ts';

const toHexString = (bytes: Uint8Array) =>
  '0x' +
  bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

export type CounterProps = {
  account: string;
  provider: Eip1193Provider;
  readOnlyProvider: Provider;
};

export const Counter = ({
  account,
  provider,
  readOnlyProvider,
}: CounterProps) => {
  const [contractAddress, setContractAddress] = useState(ZeroAddress);

  const [decryptedCount, setDecryptedCount] = useState('???');

  const [handles, setHandles] = useState<Uint8Array[]>([]);
  const [encryption, setEncryption] = useState<Uint8Array>();

  const [value, setValue] = useState<number>(0);


  const [errorMessage, setErrorMessage] = useState('');

  const [decryptedSecret, setDecryptedResult] = useState('???');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Conditional import based on MOCKED environment variable
        let Counter;
        console.log(import.meta)
        /* if (!import.meta.env.MOCKED) {
          MyConfidentialERC20 = await import(
            '@deployments/sepolia/MyConfidentialERC20.json'
          );
          console.log(
            `Using ${MyConfidentialERC20.address} for the token address on Sepolia`,
          );
        } else { */
        Counter = await import(
          '@deployments/localhost/EncryptedCounter3.json'
        );
        console.log(
          `Using ${Counter.address} for the token address on Hardhat Local Node`,
        );
        //}

        setContractAddress(Counter.address);
      } catch (error) {
        console.error(
          'Error loading data - you probably forgot to deploy the token contract before running the front-end server:',
          error,
        );
      }
    };

    void loadData()
  }, []);


  const instance = getInstance();

  const getCounterValue = async () => {
    if (contractAddress != ZeroAddress) {
      const signer = await provider.getSigner();
      const contract = EncryptedCounter3__factory.connect(contractAddress, signer);
      console.log("requesting decryption");
      const tx = await contract.requestDecryptCounter();
      await tx.wait();
      // Wait for decryption to complete
      await awaitAllDecryptionResults();
      const decryptedValue = await contract.decryptedCounter();
      setDecryptedCount(decryptedValue.toString());
    }
  };


  const encrypt = async (val: number) => {
    const now = Date.now();
    try {
      const result = await instance
        .createEncryptedInput(contractAddress, account)
        .add8(val)
        .encrypt();
      console.log(`Took ${(Date.now() - now) / 1000}s`);
      setHandles(result.handles);
      setEncryption(result.inputProof);
    } catch (e) {
      console.error('Encryption error:', e);
      console.log(Date.now() - now);
    }
  };

  const decrypt = async () => {
    const signer = await provider.getSigner();
    try {
      const clearBalance = await reencryptEuint64(
        signer,
        instance,
        BigInt(handleBalance),
        contractAddress,
      );
      setDecryptedCount(clearBalance.toString());
    } catch (error) {
      if (error === 'Handle is not initialized') {
        // if handle is uninitialized - i.e equal to 0 - we know for sure that the balance is null
        setDecryptedCount('0');
      } else {
        throw error;
      }
    }
  };

  const handleIncrementCounter = async () => {
    const signer = await provider.getSigner();
    const contract = EncryptedCounter3__factory.connect(contractAddress, signer);
    console.log(`incrementing counter by ${value}`);
    const tx = await contract.incrementBy(toHexString(handles[0]), toHexString(encryption));
    await tx.wait();
    // Wait for decryption to complete
    const decryptedValue = await contract.decryptedCounter();
    setDecryptedCount(decryptedValue.toString());
  };

  return (
    <Container maxWidth="sm">
      <h1>Decrypted count: {decryptedCount}</h1>
      <h2>Increment counter by:</h2>
      <NumberInput
        aria-label="Demo number input"
        placeholder="Type a number…"
        value={value}
        onChange={(_event, val: number) => setValue(val)}
      />
      <Button onClick={() => void encrypt(value)}>Encrypt increment value</Button>

      <Box>
        <p>This is an encryption of {value}:</p>
        <pre>Handle: {handles.length ? toHexString(handles[0]) : ''}
        </pre>
        <pre>Input Proof: {encryption ? toHexString(encryption) : ''}
        </pre>
      </Box>
      <Button onClick={() => void handleIncrementCounter()}>Increment Counter</Button>
      <Button color="secondary" onClick={() => void getCounterValue()}>Update counter value</Button>
    </Container>
  );
};
