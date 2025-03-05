const { Client } = require('whatsapp-web.js');
const { processDialogflowMessage } = require('./src/services/dialogflow');
const { logConversation } = require('./src/services/sheets');
const { getChatGPTResponse } = require('./src/services/chatgpt');

// Start the WhatsApp client
const client = new Client();

// Initialize WhatsApp client
client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
});

client.on('ready', () => {
    console.log('WhatsApp client is ready!');
});

client.on('message', async (message) => {
    try {
        const sender = message.from;
        const userMessage = message.body;

        // First try Dialogflow
        const dialogflowResponse = await processDialogflowMessage(sender, userMessage);
        
        let botResponse;
        if (dialogflowResponse && dialogflowResponse.confidence > 0.7) {
            botResponse = dialogflowResponse.text;
        } else {
            // Fallback to ChatGPT
            botResponse = await getChatGPTResponse(userMessage);
        }

        // Send response
        await client.sendMessage(sender, botResponse);

        // Log conversation
        await logConversation(sender, userMessage, botResponse);
    } catch (error) {
        console.error('Error processing message:', error);
    }
});

client.initialize();
