// src/components/SocketStatusIndicator.jsx
import React from 'react';
import {Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useSelector} from 'react-redux';
import OrderManager from '../../services/order/OrderManager';

const SocketStatusIndicator = () => {
  const socketConnections = useSelector(state => state.bag?.socketConnections);

  if (!socketConnections) {
    return null;
  }

  const handleReconnectLongPress = () => {
    console.log(
      '[SocketIndicator] Iniciando reconexión manual (long press)...',
    );
    OrderManager.performSocketReconnection(false, 'SocketIndicator');
  };

  const getSocketColor = socketInfo => {
    if (socketInfo.connecting) {
      return '#FFA500'; // Naranja para conectando
    }
    if (socketInfo.connected) {
      return '#28a745'; // Verde para conectado
    }
    return '#dc3545'; // Rojo para desconectado
  };

  const getSocketSymbol = socketInfo => {
    if (socketInfo.connecting) {
      return '●';
    }
    if (socketInfo.connected) {
      return '●';
    }
    return '●';
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onLongPress={handleReconnectLongPress}
      delayLongPress={3000}
      activeOpacity={0.7}>
      {/* Socket de Mesa */}
      <Text
        style={[styles.dot, {color: getSocketColor(socketConnections.table)}]}>
        {getSocketSymbol(socketConnections.table)}
      </Text>

      {/* Socket de Orden */}
      <Text
        style={[styles.dot, {color: getSocketColor(socketConnections.order)}]}>
        {getSocketSymbol(socketConnections.order)}
      </Text>

      {/* Socket de Tablet */}
      <Text
        style={[styles.dot, {color: getSocketColor(socketConnections.tablet)}]}>
        {getSocketSymbol(socketConnections.tablet)}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dot: {
    fontSize: 10,
    marginHorizontal: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 0.5, height: 0.5},
    textShadowRadius: 1,
  },
});

export default SocketStatusIndicator;
