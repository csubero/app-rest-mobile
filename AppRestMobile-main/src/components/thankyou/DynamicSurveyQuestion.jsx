import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import {QUESTION_TYPES} from '../../services/payment/surveyService';

const DynamicSurveyQuestion = ({
  question,
  value,
  onChange,
  colors,
  fontSize,
  fontFamily,
  dimensions,
  language,
  alignLeft = true,
}) => {
  // Función para obtener el texto traducido
  const getLocalizedText = (text, textEn) => {
    return language === 'en' && textEn ? textEn : text;
  };
  const containerStyle = {
    marginBottom: 30,
    width: '100%',
    alignItems: alignLeft ? 'flex-start' : 'center',
  };

  const labelStyle = {
    fontSize: dimensions.width * 0.015,
    fontFamily: fontFamily.semibold,
    color: colors.text,
    marginBottom: 20,
    // marginTop: -10,
    textAlign: alignLeft ? 'left' : 'center',
  };

  const styles = StyleSheet.create({
    starsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 6,
      marginTop: -15,
    },
    star: {
      marginHorizontal: 4,
    },
    starText: {
      fontSize: dimensions.width * 0.04,
    },
    starSelected: {
      color: '#FFD700',
      textShadowOffset: {width: 1, height: 1},
      textShadowRadius: 2,
    },
    starUnselected: {
      color: '#ccc',
    },
    choicesContainer: {
      width: '100%',
    },
    choiceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    radioContainer: {
      marginRight: 12,
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioInner: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    checkboxContainer: {
      marginRight: 12,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 3,
    },
    checkmark: {
      fontSize: 14,
      fontFamily: fontFamily.lite,
    },
    choiceText: {
      flex: 1,
    },
    textInput: {
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      padding: 12,
      minHeight: 60,
      fontFamily: fontFamily.regular,
      color: colors.text,
      width: '100%',
      fontSize: dimensions.width * 0.014,
      textAlignVertical: 'top',
    },
  });

  const renderRatingQuestion = () => {
    const starsRowStyle = [
      styles.starsRow,
      alignLeft ? {justifyContent: 'flex-start'} : {justifyContent: 'center'},
    ];

    return (
      <View style={starsRowStyle}>
        {[1, 2, 3, 4, 5].map(num => (
          <TouchableOpacity key={num} onPress={() => onChange(num)}>
            <Text
              style={[
                styles.star,
                styles.starText,
                value >= num ? styles.starSelected : styles.starUnselected,
              ]}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderTextQuestion = () => {
    return (
      <TextInput
        style={styles.textInput}
        multiline
        value={value || ''}
        onChangeText={onChange}
        placeholder={
          language === 'en' ? 'Write your answer...' : 'Escribe tu respuesta...'
        }
        placeholderTextColor="#aaa"
      />
    );
  };

  const renderRadioQuestion = () => {
    return (
      <View style={styles.choicesContainer}>
        {question.choices.map(choice => (
          <TouchableOpacity
            key={choice.id}
            style={styles.choiceRow}
            onPress={() => onChange(choice.id)}>
            <View style={styles.radioContainer}>
              <View
                style={[
                  styles.radioOuter,
                  {borderColor: colors.button},
                  value === choice.id && {backgroundColor: colors.button},
                ]}>
                {value === choice.id && (
                  <View
                    style={[styles.radioInner, {backgroundColor: colors.white}]}
                  />
                )}
              </View>
            </View>
            <Text
              style={[
                styles.choiceText,
                {
                  fontFamily: fontFamily.regular,
                  color: colors.text,
                  fontSize: dimensions.width * 0.014,
                },
              ]}>
              {getLocalizedText(choice.choice_text, choice.choice_text_en)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderCheckboxQuestion = () => {
    const selectedValues = Array.isArray(value) ? value : [];

    const toggleChoice = choiceId => {
      if (selectedValues.includes(choiceId)) {
        onChange(selectedValues.filter(id => id !== choiceId));
      } else {
        onChange([...selectedValues, choiceId]);
      }
    };

    return (
      <View style={styles.choicesContainer}>
        {question.choices.map(choice => (
          <TouchableOpacity
            key={choice.id}
            style={styles.choiceRow}
            onPress={() => toggleChoice(choice.id)}>
            <View style={styles.checkboxContainer}>
              <View
                style={[
                  styles.checkbox,
                  {borderColor: colors.button},
                  selectedValues.includes(choice.id) && {
                    backgroundColor: colors.button,
                  },
                ]}>
                {selectedValues.includes(choice.id) && (
                  <Text style={[styles.checkmark, {color: colors.white}]}>
                    ✓
                  </Text>
                )}
              </View>
            </View>
            <Text
              style={[
                styles.choiceText,
                {
                  fontFamily: fontFamily.regular,
                  color: colors.text,
                  fontSize: dimensions.width * 0.014,
                },
              ]}>
              {getLocalizedText(choice.choice_text, choice.choice_text_en)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderQuestionInput = () => {
    switch (question.question_type.key) {
      case QUESTION_TYPES.RATING:
        return renderRatingQuestion();
      case QUESTION_TYPES.TEXT:
        return renderTextQuestion();
      case QUESTION_TYPES.RADIO:
        return renderRadioQuestion();
      case QUESTION_TYPES.CHECKBOX:
        return renderCheckboxQuestion();
      default:
        return renderTextQuestion();
    }
  };

  return (
    <View style={containerStyle}>
      <Text style={labelStyle}>
        {getLocalizedText(question.question_text, question.question_text_en)}
        {question.required ? ' *' : ''}
      </Text>
      {renderQuestionInput()}
    </View>
  );
};

export default DynamicSurveyQuestion;
