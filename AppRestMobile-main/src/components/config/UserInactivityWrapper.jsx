import React, {useState, useEffect} from 'react';
import UserInactivity from 'react-native-user-inactivity';
import {useNavigation, useIsFocused, useRoute} from '@react-navigation/native';

const UserInactivityWrapper = ({
  children,
  timeoutMs = 120000, // 2 minutes por defecto
  enabled = true, // Permite habilitar/deshabilitar el wrapper
  onInactivity: customOnInactivity, // Callback personalizado
}) => {
  const [active, setActive] = useState(true);
  const timeout = timeoutMs; // Usar el parámetro personalizable
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const route = useRoute();
  const [isMounted, setIsMounted] = useState(true);

  const onInactivity = () => {
    // console.log('inactive');
    if (customOnInactivity) {
      customOnInactivity();
    } else {
      navigation.navigate('Inactivity');
    }
  };

  useEffect(() => {
    if (!active && isFocused && enabled) {
      onInactivity();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, isFocused, enabled]);

  useEffect(() => {
    setActive(true);
  }, [isFocused, route.key]);

  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      // console.log('Screen focused');
      setIsMounted(true);
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      // console.log('Screen unfocused');
      setIsMounted(false);
    });

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation]);

  if (!isMounted || !enabled) {
    return children;
  }

  return (
    <UserInactivity
      key={route.key}
      timeForInactivity={timeout}
      onAction={isActive => {
        setActive(isActive);
      }}>
      {children}
    </UserInactivity>
  );
};

export default UserInactivityWrapper;
