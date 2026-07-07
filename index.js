require('dotenv').config();
const express = require('express');
const { YemotRouter } = require('yemot-router2');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.urlencoded({ extended: true }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: ".אתה עוזר חביב ומקצועי שמדבר עברית טבעית"
});

const router = YemotRouter();

router.post('/', async (call) => {
    try {
        // קריאת הטקסט שימות המשיח תמללה מהדיבור שלך
        const userText = call.get('val_name') || call.get('input') || call.get('record_text') || "שלום";
        let history = call.session.history || "";

        // פנייה לג'מיני לקבלת תשובה
        const result = await model.generateContent(`
            היסטוריה: ${history}
            לקוח: ${userText}
            :ענה בעברית בצורה טבעית וקצרה
        `);

        const aiResponse = result.response.text().trim();

        // שמירת ההיסטוריה של השיחה
        call.session.history = history + `\nלקוח: ${userText}\nאתה: ${aiResponse}`;

        // הקראת התשובה של ג'מיני למשתמש בטלפון
        call.read([{ type: 'text', text: aiResponse }]);
        call.end();

    } catch (e) {
        console.error(e);
        call.read([{ type: 'text', text: 'סליחה, יש בעיה. נסה שוב.' }]);
        call.end();
    }
});

app.use('/', router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port', PORT));
