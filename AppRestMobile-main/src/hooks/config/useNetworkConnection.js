import {useState, useEffect} from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useNetworkConnection = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionType, setConnectionType] = useState('unknown');
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
      setConnectionType(state.type);
      setIsInternetReachable(state.isInternetReachable ?? false);
    });

    // Verificar estado inicial
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected ?? false);
      setConnectionType(state.type);
      setIsInternetReachable(state.isInternetReachable ?? false);
    });

    return () => unsubscribe();
  }, []);

  return {
    isConnected,
    connectionType,
    isInternetReachable,
    hasInternetConnection: isConnected && isInternetReachable,
  };
};
