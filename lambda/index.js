const Alexa = require('ask-sdk-core');
const https = require('https');

const API_URL = 'https://prefavorably-garmentless-honey.ngrok-free.dev/dados';

function getDadosSensor() {
    return new Promise((resolve, reject) => {
        const req = https.get(API_URL, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    if (res.statusCode < 200 || res.statusCode >= 300) {
                        return reject(new Error(`Status HTTP ${res.statusCode}: ${data}`));
                    }

                    const json = JSON.parse(data);
                    resolve(json);
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.setTimeout(8000, () => {
            req.destroy();
            reject(new Error('Tempo limite ao acessar a API.'));
        });
    });
}

async function responderComDados(handlerInput) {
    try {
        const dados = await getDadosSensor();

        const speechText =
            `O ambiente monitorado está com temperatura de ${dados.temperatura} graus Celsius, ` +
            `umidade de ${dados.umidade} por cento, ` +
            `e o status do sistema é ${dados.status}.`;

        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();

    } catch (error) {
        console.log(`Erro ao acessar API: ${error.message}`);

        return handlerInput.responseBuilder
            .speak('Não consegui acessar os dados do sistema no momento. Verifique se o servidor e o ngrok estão ligados.')
            .getResponse();
    }
}

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },

    async handle(handlerInput) {
        return responderComDados(handlerInput);
    }
};

const GenericIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },

    async handle(handlerInput) {
        return responderComDados(handlerInput);
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },

    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak('Para usar o sistema, diga: abrir monitoramento de temperatura e umidade.')
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (
                Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent'
            );
    },

    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak('Encerrando o monitoramento.')
            .getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },

    handle(handlerInput, error) {
        console.log(`Erro capturado no ErrorHandler: ${error.message}`);

        return handlerInput.responseBuilder
            .speak('Ocorreu um erro ao processar sua solicitação.')
            .getResponse();
    }
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        GenericIntentHandler
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();