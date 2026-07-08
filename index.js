
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
        const userText = call.get('val_name');

        // אם המשתמש רק נכנס, ג'מיני פותח את השיחה מיד ב-"היי"
        if (!userText) {
            return call.read([{ type: 'text', text: 'היי, מה נשמע?' }]);
        }

        let history = call.session.history || "";

        // פנייה לג'מיני עם הקלט של המשתמש
        const result = await model.generateContent(`
            היסטוריה: ${history}
            לקוח: ${userText}
            :ענה בעברית בצורה טבעית וקצרה
        `);

        const aiResponse = result.response.text().trim();

        // שמירת ההיסטוריה
        call.session.history = history + `\nלקוח: ${userText}\nאתה: ${aiResponse}`;

        // הקראת התשובה של ג'מיני
        return call.read([{ type: 'text', text: aiResponse }]);

    } catch (e) {
        console.error("שגיאה בשרת:", e);
        return call.read([{ type: 'text', text: 'אופס, משהו השתבש.' }]);
    }
});

app.use('/', router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port', PORT));
