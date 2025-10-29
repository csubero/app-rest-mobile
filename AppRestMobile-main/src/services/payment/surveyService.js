import apiClient from '../api/apiClient';

export const QUESTION_TYPES = {
  TEXT: 'text',
  RADIO: 'radio',
  CHECKBOX: 'checkbox',
  RATING: 'rating',
};

export const getSurveys = async ({serverIp, apiToken}) => {
  try {
    const response = await apiClient(serverIp, apiToken).get('surveys/');
    console.log('Encuestas obtenidas con éxito:', response);
    return response;
  } catch (error) {
    console.error(
      'Error al obtener encuestas:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const submitSurveyAnswers = async ({
  serverIp,
  apiToken,
  surveyId,
  answers,
  generalData,
}) => {
  try {
    const payload = {
      survey_id: surveyId,
      table_number: generalData.table_number || '000',
      order_series: generalData.order_series || 'FAC',
      order_number: generalData.order_number || 'FAC-000-0000',
      respondent_name: generalData.respondent_name || 'Sin  nombre',
      respondent_email:
        generalData.respondent_email || 'sin_email@notemail.com',
      answers: answers,
    };

    const response = await apiClient(serverIp, apiToken).post(
      'surveys/response/',
      payload,
    );
    console.log(JSON.stringify(response, null, 2));

    console.log('Respuestas de encuesta enviadas con éxito:', response);
    return response;
  } catch (error) {
    console.error(
      'Error al enviar respuestas de encuesta:',
      error.response?.data || error.message,
    );
    console.log(JSON.stringify(error.response, null, 2));
    throw error;
  }
};

export const submitReject = async ({serverIp, apiToken, generalData}) => {
  try {
    const payload = {
      table_number: generalData.table_number || '000',
      order_series: generalData.order_series || 'FAC',
      order_number: generalData.order_number || 'FAC-000-0000',
    };

    const response = await apiClient(serverIp, apiToken).post(
      'surveys/rejection/',
      payload,
    );

    console.log('Encuesta rechazada con éxito:', response);
    return response;
  } catch (error) {
    console.error(
      'Error al enviar respuestas de encuesta:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const isSurveyActive = survey => {
  const now = new Date();
  const startDate = new Date(survey.start_date);
  const endDate = new Date(survey.end_date);

  return now >= startDate && now <= endDate;
};

export const getActiveSurvey = surveys => {
  if (!surveys || !Array.isArray(surveys)) {
    return null;
  }

  return surveys.find(survey => isSurveyActive(survey)) || null;
};

export const transformAnswersForSubmission = (formAnswers, questions) => {
  return questions.map(question => {
    const answer = formAnswers[question.external_id];

    const transformedAnswer = {
      question_id: question.id,
    };

    switch (question.question_type.key) {
      case QUESTION_TYPES.TEXT:
        transformedAnswer.value = String(answer || '');
        break;

      case QUESTION_TYPES.RATING:
        transformedAnswer.value = String(parseInt(answer, 10) || 0);
        // transformedAnswer.choice_id =
        //   question.choices.find(
        //     choice =>
        //       choice.choice_text === answer || choice.choice_text_en === answer,
        //   )?.id || null;
        break;

      case QUESTION_TYPES.RADIO:
        transformedAnswer.value = answer
          ? JSON.stringify([parseInt(answer, 10)])
          : JSON.stringify([]);
        // transformedAnswer.choice_id =
        //   question.choices.find(
        //     choice =>
        //       choice.choice_text === answer || choice.choice_text_en === answer,
        //   )?.id || null;
        break;

      case QUESTION_TYPES.CHECKBOX:
        transformedAnswer.value = JSON.stringify(
          Array.isArray(answer) ? answer.map(id => parseInt(id, 10)) : [],
        );
        break;

      default:
        transformedAnswer.value = String(answer || '');
    }

    return transformedAnswer;
  });
};
