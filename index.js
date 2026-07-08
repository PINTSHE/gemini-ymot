require('dotenv').config();
const express = require('express');
const { YemotRouter } = require('yemot-router2');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: ".אתה עוזר חביב ומקצועי שמדבר עברית טבעית"
});

const router = YemotRouter();

router.all('/', async (call) => {
    try {
        // הודעת פתיחה ראשונית
        await call.read([{ type: 'text', data: 'שלום, הגעת לג׳מיני. אנא דבר לאחר הצליל.' }]);

        // לולאת שיחה אינסופית
        while (true) {
            // הספרייה עצמה מבקשת מימות המשיח לפתוח מיקרופון ולתמלל
            const userText = await call.read(
                [{ type: 'text', data: '' }], // שקט לפני הצליל
                'stt', // הפעלת מנוע תמלול קולי
                { language: 'he-IL' } // שפת התמלול
            );

            // אם המשתמש לא דיבר או שיש שתיקה, נמשיך לחכות
            if (!userText) continue;

            let history = call.session.history || "";

            // פנייה לג'מיני
            const result = await model.generateContent(`
                היסטוריה: ${history}
                לקוח: ${userText}
                :ענה בעברית בצורה טבעית וקצרה
            `);

            const aiResponse = result.response.text().trim();

            // שמירת היסטוריית השיחה
            call.session.history = history + `\nלקוח: ${userText}\nאתה: ${aiResponse}`;

            // הקראת התשובה של ג'מיני - ואז הלולאה חוזרת אוטומטית להתחלה ומקשיבה שוב!
            await call.read([{ type: 'text', data: aiResponse }]);
        }

    } catch (e) {
        console.error("שגיאה בשיחה:", e);
        // הגנה קטנה במקרה של ניתוק או שגיאה
        try {
            await call.read([{ type: 'text', data: 'חלה שגיאה, נסה שוב.' }]);
        } catch (err) {}
    }
});

app.use('/', router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port', PORT));
