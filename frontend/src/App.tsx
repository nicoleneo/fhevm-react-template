import { useEffect, useState } from 'react';
import { init } from './fhevmjs';
import './App.css';
import { Connect } from './components/Connect';
import { Counter } from './components/Counter/Counter';

function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    init()
      .then(() => {
        setIsInitialized(true);
      })
      .catch(() => setIsInitialized(false));
  }, []);

  if (!isInitialized) return null;

  return (
    <>
      <h1>Counter dApp</h1>
      <Connect>
        {(account, provider, readOnlyProvider) => (
          <Counter
            account={account}
            provider={provider}
            readOnlyProvider={readOnlyProvider}
          />
        )}
      </Connect>
      <p className="read-the-docs">
        <a href="https://docs.zama.ai/fhevm">
          See the documentation for more information
        </a>
      </p>
    </>
  );
}

export default App;
