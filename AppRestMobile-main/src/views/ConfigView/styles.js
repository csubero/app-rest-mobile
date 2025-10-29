import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffff',
    paddingVertical: 40,
    paddingHorizontal: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 20,
    marginLeft: 10,
    // borderBottomWidth: 1,
    // borderBottomColor: '#e1e5e9',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 5,
  },
  content: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  sectionContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 10,
    fontSize: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  infoValue: {
        fontSize: 16,
        color: '#212529',
        fontWeight: '600',
    },
    infoValueSuccess: {
        color: '#28a745',
    },
    infoValueError: {
        color: '#dc3545',
    },
    deviceItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 5,
  },
  deviceInfo: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 3,
  },
  actionButtonsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    actionButton: {
        width: '48%',
        backgroundColor: '#007bff',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 10,
        alignItems: 'center',
        shadowColor: '#007bff',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
  actionButtonSecondary: {
    backgroundColor: '#ffc107',//amarillo
    shadowColor: '#ffc107',
  },
  actionButtonDanger: {
    backgroundColor: '#dc3545',
    shadowColor: '#dc3545',
  },
  actionButtonSuccess: {
    backgroundColor: '#28a745',
    shadowColor: '#28a745',
  },
  actionButtonLocked: {
    backgroundColor: '#6c757d',
    shadowColor: '#6c757d',
  },
  actionButtonDisabled: {
    backgroundColor: '#adb5bd',
    shadowColor: '#adb5bd',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
    flex: 1,
  },
  toggleDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 3,
  },
  toggle: {
    transform: [{scaleX: 1.2}, {scaleY: 1.2}],
  },
  toggleContent: {
    flex: 1,
  },
  toggleErrorText: {
    fontSize: 12,
    color: '#d32f2f',
    marginTop: 4,
  },
  toggleDisabled: {
    opacity: 0.5,
  },
  infoValueWarning: {
    color: '#ff9800',
  },
  noDevicesText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6c757d',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#6c757d',
  },
});

export default styles;
