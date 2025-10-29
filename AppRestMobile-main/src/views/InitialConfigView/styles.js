import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
    },
    formGroup: {
        width: '100%',
        padding: 12,
    },
    label: {
        fontSize: 28,
        marginBottom: 5,
        fontWeight: 'bold',
    },
    input: {
        width: '100%',
        height: 64,
        fontSize: 24,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
    },
    inputError: {
        borderColor: 'red',
    },
    buttonContainer: {
        width: '100%',
        padding: 12,
        borderRadius: 5,
    },
    button: {
        padding: 20,
        backgroundColor: '#007bff',
        borderRadius: 5,
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 24,
    },
    helpText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'left',
    },
    listContainer: {
        width: '100%',
        padding: 12,
    },
    listTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    item: {
        padding: 20,
        borderWidth: 1,
        borderColor: '#ccc',
        backgroundColor: '#fff',
        borderRadius: 5,
    },
    itemSelected: {
        backgroundColor: '#f0f0f0',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    pickerContainer: {
        height: 64,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        backgroundColor: '#fff',
    },
    pickerStyle: {
        fontSize: 24,
        paddingVertical: 14,
        paddingHorizontal: 15,
        borderWidth: 0,
        borderColor: 'transparent',
        color: '#000',
        backgroundColor: 'transparent',
        borderRadius: 5,
    },
});

export default styles;
