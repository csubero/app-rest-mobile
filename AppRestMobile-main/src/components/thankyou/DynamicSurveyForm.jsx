import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useSelector} from 'react-redux';
import DynamicSurveyQuestion from './DynamicSurveyQuestion';
import {
  getSurveys,
  getActiveSurvey,
  submitSurveyAnswers,
  transformAnswersForSubmission,
  QUESTION_TYPES,
} from '../../services/payment/surveyService';

const DynamicSurveyForm = ({
  onSubmit,
  colors,
  font_type,
  dimensions,
  sizes,
  generalData,
}) => {
  const {t} = useTranslation();
  const {serverIp} = useSelector(state => state.store);
  const {apiToken} = useSelector(state => state.auth);
  const settings = useSelector(state => state.company.companySelected.settings);

  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [imageLoading, setImageLoading] = useState(true);
  const {language} = useSelector(state => state.settings);

  // Función para obtener el texto traducido
  const getLocalizedText = (text, textEn) => {
    return language === 'en' && textEn ? textEn : text;
  };

  const styles = StyleSheet.create({
    surveyTitle: {
      fontSize: dimensions.width * 0.024, // puedes ajustar con dimensions.width * 0.026 si lo prefieres
      fontFamily: font_type.semibold,
      marginBottom: 20,
      marginTop: 12,
      textAlign: 'left',
    },
    surveyDescription: {
      fontSize: dimensions.width * 0.016,
      fontFamily: font_type.regular,
      marginBottom: 30,
      textAlign: 'left',
    },
    submitButton: {
      width: '100%',
      backgroundColor: colors.button,
      paddingVertical: 12,
      paddingHorizontal: 30,
      borderRadius: sizes.borderRadius, // sizes.borderRadius2
      alignSelf: 'flex-start',
      marginTop: 10,
    },
    submitButtonDisabled: {
      backgroundColor: '#ccc',
    },
    submitButtonText: {
      color: '#fff',
      fontFamily: font_type.lite,
      fontSize: dimensions.width * 0.012,
      paddingHorizontal: 50,
      textAlign: 'center',
      textTransform: 'uppercase',
    },
    errorText: {
      color: colors.text,
      marginTop: 10,
      textAlign: 'center',
      fontSize: dimensions.width * 0.014,
      fontFamily: font_type.regular,
    },
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    errorTitle: {
      textAlign: 'center',
      marginBottom: 20,
    },
    continueButton: {
      paddingVertical: 12,
      paddingHorizontal: 30,
    },
    continueButtonText: {
      textTransform: 'uppercase',
    },
    formContainer: {
      flex: 1,
      flexDirection: 'row',
      width: '100%',
    },
    imageContainer: {
      width: '45%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageLoadingContainer: {
      position: 'absolute',
      zIndex: 2,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      backgroundColor: colors.white,
    },
    imageLoadingText: {
      fontSize: dimensions.width * 0.016,
      fontFamily: font_type.regular,
      color: colors.button,
      marginTop: 10,
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    scrollView: {
      width: '55%',
      paddingHorizontal: 40,
    },
    scrollViewContent: {
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      paddingVertical: 40,
    },
  });

  useEffect(() => {
    loadSurvey();
  }, [loadSurvey]);

  const loadSurvey = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getSurveys({serverIp, apiToken});
      const activeSurvey = getActiveSurvey(response);

      if (activeSurvey) {
        setSurvey(activeSurvey);
        // Inicializar respuestas vacías
        const initialAnswers = {};
        activeSurvey.questions.forEach(question => {
          if (question.question_type.key === QUESTION_TYPES.CHECKBOX) {
            initialAnswers[question.external_id] = [];
          } else {
            initialAnswers[question.external_id] = '';
          }
        });
        setAnswers(initialAnswers);
      } else {
        setError(t('survey_no_active'));
      }
    } catch (err) {
      console.error('Error cargando encuesta:', err);
      setError(t('survey_error_loading'));
    } finally {
      setLoading(false);
    }
  }, [serverIp, apiToken, t]);

  const handleAnswerChange = (questionExternalId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionExternalId]: value,
    }));
  };

  const validateAnswers = () => {
    if (!survey) {
      return false;
    }

    for (const question of survey.questions) {
      if (question.required) {
        const answer = answers[question.external_id];
        const questionText = getLocalizedText(
          question.question_text,
          question.question_text_en,
        );

        switch (question.question_type.key) {
          case QUESTION_TYPES.RATING:
            if (!answer || parseInt(answer, 10) === 0) {
              return {
                valid: false,
                message: `${t('survey_please_answer')} ${questionText}`,
              };
            }
            break;
          case QUESTION_TYPES.TEXT:
            if (!answer || answer.trim() === '') {
              return {
                valid: false,
                message: `${t('survey_please_answer')} ${questionText}`,
              };
            }
            break;
          case QUESTION_TYPES.RADIO:
            if (!answer) {
              return {
                valid: false,
                message: `${t('survey_please_select')} ${questionText}`,
              };
            }
            break;
          case QUESTION_TYPES.CHECKBOX:
            if (!Array.isArray(answer) || answer.length === 0) {
              return {
                valid: false,
                message: `${t('survey_please_select_one')} ${questionText}`,
              };
            }
            break;
        }
      }
    }

    return {valid: true};
  };

  const handleSubmit = async () => {
    const validation = validateAnswers();
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const transformedAnswers = transformAnswersForSubmission(
        answers,
        survey.questions,
      );

      console.log('Respuestas transformadas:', transformedAnswers);

      await submitSurveyAnswers({
        serverIp,
        apiToken,
        surveyId: survey.id,
        answers: transformedAnswers,
        generalData,
      });

      onSubmit();
    } catch (err) {
      console.error('Error enviando encuesta:', err);
      setError(t('survey_error_submitting'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, {backgroundColor: colors.white}]}>
        <ActivityIndicator size="large" color={colors.button} />
        <Text
          style={[
            styles.loadingText,
            {
              fontSize: dimensions.width * 0.016,
              fontFamily: font_type.regular,
              color: colors.text,
            },
          ]}>
          {t('survey_loading')}
        </Text>
      </View>
    );
  }

  if (error && !survey) {
    return (
      <View style={[styles.errorContainer, {backgroundColor: colors.white}]}>
        <Text
          style={[
            styles.errorTitle,
            {
              fontSize: dimensions.width * 0.018,
              fontFamily: font_type.semibold,
              color: colors.text,
            },
          ]}>
          {error}
        </Text>
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: colors.button,
              borderRadius: sizes.borderRadius,
            },
          ]}
          onPress={() => onSubmit()}>
          <Text
            style={[
              styles.continueButtonText,
              {
                color: colors.white,
                fontFamily: font_type.regular,
                fontSize: dimensions.width * 0.012,
              },
            ]}>
            {t('continue')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!survey) {
    return null;
  }

  // Selección de imagen según idioma
  const surveyImageUrl =
    language === 'en'
      ? settings.survey_image_url_en || settings.survey_image_url
      : settings.survey_image_url;

  return (
    <View style={[styles.formContainer, {backgroundColor: colors.white}]}>
      {/* Lado izquierdo: Imagen */}
      <View style={styles.imageContainer}>
        {imageLoading && (
          <View style={styles.imageLoadingContainer}>
            <ActivityIndicator size="large" color={colors.button} />
            <Text style={styles.imageLoadingText}>
              {t('survey_loading_image')}
            </Text>
          </View>
        )}
        <Image
          source={{uri: surveyImageUrl}}
          style={styles.image}
          onLoadStart={() => setImageLoading(true)}
          onLoadEnd={() => setImageLoading(false)}
          onError={() => setImageLoading(false)}
        />
      </View>

      {/* Lado derecho: Preguntas */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.surveyTitle}>
          {getLocalizedText(survey.title, survey.title_en)}
        </Text>

        {survey.description && (
          <Text style={styles.surveyDescription}>
            {getLocalizedText(survey.description, survey.description_en)}
          </Text>
        )}

        {survey.questions.map(question => (
          <DynamicSurveyQuestion
            key={question.external_id}
            question={question}
            value={answers[question.external_id]}
            onChange={value => handleAnswerChange(question.external_id, value)}
            colors={colors}
            fontSize={dimensions.width * 0.016}
            fontFamily={font_type}
            dimensions={dimensions}
            language={language}
            alignLeft
          />
        ))}

        <TouchableOpacity
          style={[
            styles.submitButton,
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting}>
          {submitting ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>{t('send', 'Enviar')}</Text>
          )}
        </TouchableOpacity>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>
    </View>
  );
};

export default DynamicSurveyForm;
