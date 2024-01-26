
const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");
const config = require('../config')
const insights = require('../services/insights')
const serviceEmail = require('../services/email')
const Generalfeedback = require('../models/generalfeedback')
const axios = require('axios');
const Vote = require('../models/vote')

const ApiManagementKey = config.API_MANAGEMENT_KEY;


async function callOpenAi (req, res){
  var jsonText = req.body.value;
  (async () => {
    try {

      const messages = [
        { role: "user", content: jsonText}
      ];

      const requestBody = {
        messages: messages,
        temperature: 0,
        max_tokens: 800,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      };

      const result = await axios.post('https://apiopenai.azure-api.net/oasis/deployments', requestBody,{
        headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': ApiManagementKey,
        }
    }); 
  
      if(result.data.choices[0].message.content == undefined){
        //send email
        serviceEmail.sendMailErrorGPT(req.body.value, result.data.choices)
      }
      res.status(200).send(result.data)
    }catch(e){
      insights.error(e);
      console.log(e)
      if (e.response) {
        console.log(e.response.status);
        console.log(e.response.data);
      } else {
        console.log(e.message);
      }
      console.error("[ERROR]: " + e)
      /*if (e.response.status === 429) {
        console.error("[ERROR] OpenAI responded with status: " + e.response.status)
          console.log("OpenAI Quota exceeded")
          //handle this case
      }*/
      serviceEmail.sendMailErrorGPT(req.body.value, e)
					.then(response => {
            
					})
					.catch(response => {
            insights.error(response);
						//create user, but Failed sending email.
						console.log('Fail sending email');
					})

      res.status(500).send(e)
    }
    
  })();
}

async function callOpenAiAnonymized(req, res) {
  // Anonymize user message
  var jsonText = req.body.value;
  var anonymizationPrompt = `The task is to anonymize the following medical document by replacing any personally identifiable information (PII) with [ANON-N], 
  where N is the count of characters that have been anonymized. 
  Only specific information that can directly lead to patient identification needs to be anonymized. This includes but is not limited to: 
  full names, addresses, contact details, Social Security Numbers, and any unique identification numbers. 
  However, it's essential to maintain all medical specifics, such as medical history, diagnosis, treatment plans, and lab results, as they are not classified as PII. 
  The anonymized document should retain the integrity of the original content, apart from the replaced PII. 
  Avoid including any information that wasn't part of the original document and ensure the output reflects the original content structure and intent, albeit anonymized. 
  Here is the original document between the triple quotes:
  ----------------------------------------
  """
  ${jsonText}
  """
  ----------------------------------------
  ANONYMIZED DOCUMENT:"`;

  try {

    const messages = [
      { role: "user", content: anonymizationPrompt}
    ];

    const requestBody = {
      messages: messages,
      temperature: 0,
      max_tokens: 2000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    };

    const result = await axios.post('https://apiopenai.azure-api.net/oasis/anonymized', requestBody,{
        headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': ApiManagementKey,
        }
    }); 

    res.status(200).send(result.data)
  } catch(e) {
    insights.error(e);
    console.log(e)
    if (e.response) {
      console.log(e.response.status);
      console.log(e.response.data);
    } else {
      console.log(e.message);
    }
    console.error("[ERROR]: " + e)
    res.status(500).send(e)
  }
}

function opinion (req, res){

  (async () => {
    try {
      let vote = new Vote()
      vote.value = req.body.vote
      vote.myuuid = req.body.myuuid
      vote.type = 'Diseases'
      vote.save((err, voteStored) => {
        res.status(200).send({send: true, id: voteStored._id})
      })
      
    }catch(e){
      insights.error(e);
      console.error("[ERROR] OpenAI responded with status: " + e)
      serviceEmail.sendMailErrorGPT(req.body.value, e)
					.then(response => {
            
					})
					.catch(response => {
            insights.error(response);
						//create user, but Failed sending email.
						console.log('Fail sending email');
					})

      res.status(500).send(e)
    }
    
  })();
}

function questionopinion (req, res){

  (async () => {
    try {
      let vote = new Vote()
      vote.value = req.body.vote
      vote.myuuid = req.body.myuuid
      vote.type = 'Question'
      vote.description = req.body.description
      vote.save((err, voteStored) => {
        res.status(200).send({send: true, id: voteStored._id})
      })
      
    }catch(e){
      insights.error(e);
      console.error("[ERROR] OpenAI responded with status: " + e)
      serviceEmail.sendMailErrorGPT(req.body.value, e)
					.then(response => {
            
					})
					.catch(response => {
            insights.error(response);
						//create user, but Failed sending email.
						console.log('Fail sending email');
					})

      res.status(500).send(e)
    }
    
  })();
}

function sendFeedback (req, res){

  (async () => {
    try {

      Vote.findByIdAndUpdate(req.body.voteId, { description: req.body.description}, { new: true }, (err, voteUpdated) => {
        if (err || !voteUpdated){
          insights.error(err);
          console.log(err)
          var msg = err || 'Error updating vote'
          serviceEmail.sendMailErrorGPT(req.body.description, msg)
					.then(response => {
            
					})
					.catch(response => {
            insights.error(response);
						//create user, but Failed sending email.
						console.log('Fail sending email');
					})
        }
      })

      serviceEmail.sendMailFeedback(req.body.description)
					.then(response => {
            
					})
					.catch(response => {
            insights.error(response);
						//create user, but Failed sending email.
						console.log('Fail sending email');
					})

      res.status(200).send({send: true})
    }catch(e){
      insights.error(e);
      console.error("[ERROR] OpenAI responded with status: " + e)
      serviceEmail.sendMailErrorGPT(req.body.description, e)
					.then(response => {
            
					})
					.catch(response => {
            insights.error(response);
						//create user, but Failed sending email.
						console.log('Fail sending email');
					})

      res.status(500).send(e)
    }
    
  })();
}

function sendGeneralFeedback (req, res){

  (async () => {
    try {
      let generalfeedback = new Generalfeedback()
			generalfeedback.myuuid = req.body.myuuid
			generalfeedback.pregunta1 = req.body.value.pregunta1
      generalfeedback.pregunta2 = req.body.value.pregunta2
      generalfeedback.moreFunct = req.body.value.moreFunct
      generalfeedback.freeText = req.body.value.freeText
			generalfeedback.save((err, generalfeedbackStored) => {
			})
      serviceEmail.sendMailGeneralFeedback(req.body.value, req.body.myuuid)
					.then(response => {
            
					})
					.catch(response => {
            insights.error(response);
						//create user, but Failed sending email.
						console.log('Fail sending email');
					})

      res.status(200).send({send: true})
    }catch(e){
      insights.error(e);
      console.error("[ERROR] OpenAI responded with status: " + e)
      serviceEmail.sendMailErrorGPT(req.body, e)
					.then(response => {
            
					})
					.catch(response => {
            insights.error(response);
						//create user, but Failed sending email.
						console.log('Fail sending email');
					})

      res.status(500).send(e)
    }
    
  })();
}

module.exports = {
	callOpenAi,
  callOpenAiAnonymized,
  opinion,
  questionopinion,
  sendFeedback,
  sendGeneralFeedback
}
