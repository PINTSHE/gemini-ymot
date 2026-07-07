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
        // קריאת הקלט שמגיע מה-ans_folder של ימות המשיח
        const userText = call.get('val_name');

        // אם זו כניסה ראשונית ואין עדיין קלט, פשוט נשמיע הודעה קצרה והמערכת תפעיל את ה-STT של ימות המשיח
        if (!userText) {
            return call.read([{ type: 'text', data: 'שלום, הגעת לג׳מיני. אנא דבר לאחר הצליל.' }]);
        }

        let history = call.session.history || "";

        // פנייה לג'מיני
        const result = await model.generateContent(`
            היסטוריה: ${history}
            לקוח: ${userText}
            :ענה בעברית בצורה טבעית וקצרה
        `);

        const aiResponse = result.response.text().trim();

        // שמירת היסטוריה
        call.session.history = history + `\nלקוח: ${userText}\nאתה: ${aiResponse}`;

        // מקריאים את התשובה למשתמש
        return call.read([{ type: 'text', data: aiResponse }]);

    } catch (e) {
        console.error("שגיאה:", e);
        return call.read([{ type: 'text', data: 'סליחה, חלה שגיאה זמנית. נסה שוב.' }]);
    }
});

app.use('/', router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port', PORT));
