import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const ErrorComponent = ({ message }) => {
	return (
		<View style={styles.container}>
			<Text style={styles.errorText}>{message}</Text>
		</View>
	);
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
	container: {
		padding: 15,
		margin: 10,
		borderRadius: 5,
		backgroundColor: '#f8d7da',
		borderColor: '#f5c6cb',
		borderWidth: 1,
		width: '90%',
	},
	errorText: {
		color: '#721c24',
		fontSize: width * 0.025,
		textAlign: 'center',
		fontWeight: 'bold',
	},
});

export default ErrorComponent;