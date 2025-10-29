import {StyleSheet} from 'react-native';

const createStyles = ({commonStyles, colors, dimensions, withOpacity}) => {
  return StyleSheet.create({
    ...commonStyles,
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    horizontalCards: {
      paddingHorizontal: 30,
      marginBottom: 20,
      marginTop: 20,
    },
    carouselWrapper: {
      position: 'relative',
      width: '100%',
      alignItems: 'center',
    },
    arrowButton: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      zIndex: 10,
      width: 80,
      justifyContent: 'center',
      alignItems: 'center',
    },
    arrowButtonLeft: {
      left: -20,
    },
    arrowButtonRight: {
      right: 0,
    },
    arrowText: {
      fontSize: 60,
      color: withOpacity(colors.primary, 1),
      fontWeight: 'bold',
    },
  });
};

export default createStyles;
