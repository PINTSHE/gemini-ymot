require('dotenv').config();
const express = require('express');
const { YemotRouter } = require('yemot-router2');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.urlencoded({ extended: true }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: "אתה עוזר חביב ומקצועי שמדבר עברית טבעית."
});

const router = YemotRouter();

router.post('/', async (call) => {
    try {
        const userText = call.get('input') || call.get('record_text') || "שלום";
        let history = call.session.history || "";

        const result = await model.generateContent(`
היסטוריה: ${history}
לקוח: ${userText}
ענה בעברית בצורה טבעית וקצרה:
`);

        const aiResponse = result.response.text().trim();

        call.session.history = history + `\nלקוח: ${userText}\nאתה: ${aiResponse}`;

        call.read([{ type: 'text', text: aiResponse }]);
        call.go_to('continue');

    } catch (e) {
        console.error(e);
        call.read([{ type: 'text', text: 'סליחה, יש בעיה. נסה שוב.' }]);
        call.go_to('continue');
    }
});

app.use('/', router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port', PORT));
