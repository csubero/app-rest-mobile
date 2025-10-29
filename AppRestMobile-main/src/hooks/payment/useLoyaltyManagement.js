// src/hooks/useLoyaltyManagement.js
import {useState, useCallback} from 'react';
import apiClient from '../../services/api/apiClient';
import Constants from '../../helpers/config/Constants';

export const useLoyaltyManagement = ({serverIp, apiToken, t}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [tempUser, setTempUser] = useState(null);
  const [loyaltyToken, setLoyaltyToken] = useState(null);
  const [tokenValidated, setTokenValidated] = useState(false);
  const [accumulateUser, setAccumulateUser] = useState(null);
  const [isAccumulatingPoints, setIsAccumulatingPoints] = useState(false);
  const [idNumber, setIdNumber] = useState('');

  const getLoyaltyPoints = useCallback(
    async searchIdNumber => {
      try {
        const response = await apiClient(serverIp, apiToken).post(
          'loyalty/search-client/',
          {
            search_param: searchIdNumber,
          },
        );
        return response;
      } catch (err) {
        console.error('Error al obtener puntos de lealtad:', err);
        throw err;
      }
    },
    [serverIp, apiToken],
  );

  const getLoyaltyToken = useCallback(
    async clientCard => {
      try {
        const response = await apiClient(serverIp, apiToken).post(
          'loyalty/get-client-token/',
          {
            client_card: clientCard,
          },
        );
        return response;
      } catch (err) {
        console.error('Error al obtener token de lealtad:', err);
        throw err;
      }
    },
    [serverIp, apiToken],
  );

  const handleLoyaltyPlan = useCallback(
    async (provider, loyaltyCardType) => {
      setLoading(true);
      setError('');
      const __TEST__ = Constants.DEV_LINEUP;

      if (__TEST__) {
        try {
          const userdata = {
            name: 'Prueba',
            balance: 100000,
            card_number: '1234567890',
            id: 'test-user-123',
          };

          console.log('🧪 TEST MODE - Creating user:', userdata);

          if (loyaltyCardType === 'accumulate') {
            // Para accumulate, establecer directamente accumulateUser sin token
            setAccumulateUser(userdata);
            setTokenValidated(true);
          } else {
            // Para redeem/otros tipos, generar token
            const tokenResponse = {
              token: '1',
              email: 'usuario@email.com',
              waitTime: 5,
            };
            setLoyaltyToken(tokenResponse);
            setTempUser(userdata);
            setUser(userdata);
          }
        } catch (err) {
          setError(t('card_not_found'));
        } finally {
          setLoading(false);
        }
      } else {
        try {
          const userdata = await getLoyaltyPoints(idNumber);

          if (loyaltyCardType === 'accumulate') {
            // Para accumulate, establecer directamente accumulateUser sin generar token
            setAccumulateUser(userdata);
            setTokenValidated(true);
          } else {
            // Para redeem/otros tipos, generar token
            const tokenResponse = await getLoyaltyToken(userdata.card_number);
            setLoyaltyToken(tokenResponse);
            setTempUser(userdata);
            setUser(userdata);
          }
        } catch (err) {
          setError(t('card_not_found'));
        } finally {
          setLoading(false);
        }
      }
    },
    [idNumber, t, getLoyaltyPoints, getLoyaltyToken],
  );

  const resetLoyaltyState = useCallback(() => {
    setUser(null);
    setTempUser(null);
    setLoyaltyToken(null);
    setAccumulateUser(null);
    setIsAccumulatingPoints(false);
    setTokenValidated(false);
    setIdNumber('');
    setError('');
    setLoading(false);
  }, []);

  return {
    // Estados
    loading,
    error,
    user,
    tempUser,
    loyaltyToken,
    tokenValidated,
    accumulateUser,
    isAccumulatingPoints,
    idNumber,

    // Setters
    setError,
    setUser,
    setTempUser,
    setLoyaltyToken,
    setTokenValidated,
    setAccumulateUser,
    setIsAccumulatingPoints,
    setIdNumber,
    setLoading,

    // Actions
    handleLoyaltyPlan,
    resetLoyaltyState,
    getLoyaltyPoints,
    getLoyaltyToken,
  };
};
