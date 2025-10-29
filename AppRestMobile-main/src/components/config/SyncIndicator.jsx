import React from 'react';
import {View, Text, ActivityIndicator, StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';

const SyncIndicator = () => {
  const {isSilentSyncing} = useSelector(state => state.auth);

  if (!isSilentSyncing) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color="#ffffff" style={styles.spinner} />
      <Text style={styles.text}>Actualizando...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 10, // Para Android
    shadowColor: '#000', // Para iOS
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  spinner: {
    marginRight: 8,
  },
  text: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default SyncIndicator;
