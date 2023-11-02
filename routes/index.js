// file that contains the routes of the api
'use strict'

const express = require('express')

const langCtrl = require('../controllers/all/lang')
const supportCtrl = require('../controllers/all/support')
const openAIserviceCtrl = require('../services/openaiazure')
const translationCtrl = require('../services/translation')
const cors = require('cors');

const api = express.Router()


// Lista de dominios permitidos
const whitelist = ['https://oasisgpt.azurewebsites.net'];
//const whitelist = ['https://oasisgpt.azurewebsites.net', 'http://localhost:4200'];
const corsOptions = {
    origin: function (origin, callback) {
        console.log(origin)
      if (whitelist.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  };

// lang routes, using the controller lang, this controller has methods
api.get('/langs/', cors(corsOptions),  langCtrl.getLangs)

//Support
api.post('/sendmsg/', cors(corsOptions), supportCtrl.sendMsg)

//services OPENAI
api.post('/callopenai', cors(corsOptions), openAIserviceCtrl.callOpenAi)
api.post('/callanonymized', cors(corsOptions), openAIserviceCtrl.callOpenAiAnonymized)

//services OPENAI
api.post('/opinion', cors(corsOptions), openAIserviceCtrl.opinion)
api.post('/questionsopinion', cors(corsOptions), openAIserviceCtrl.questionopinion)
api.post('/feedback', cors(corsOptions), openAIserviceCtrl.sendFeedback)


api.post('/generalfeedback', cors(corsOptions), openAIserviceCtrl.sendGeneralFeedback)


api.post('/getDetectLanguage', cors(corsOptions), translationCtrl.getDetectLanguage)
api.post('/translation', cors(corsOptions), translationCtrl.getTranslationDictionary)
api.post('/translationinvert', cors(corsOptions), translationCtrl.getTranslationDictionaryInvert)
api.post('/translation/segments', cors(corsOptions), translationCtrl.getTranslationSegments)

module.exports = api
