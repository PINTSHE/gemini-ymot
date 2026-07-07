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
        // השמעת הודעת פתיחה חיונית רק פעם אחת בכניסה
        await call.read([{ type: 'text', data: 'שלום, הגעת לג׳מיני.' }]);

        // לולאה אינסופית שתשמור אותך בתוך השלוחה ותמנע חזרה לתפריט הראשי
        while (true) {
            
            // פקודת הקשבה: משמיעה צפצוף (או שקט) ומחכה שהמשתמש ידבר.
            // הטקסט שתומלל יישמר אוטומטית בתוך המשתנה userText
            const userText = await call.read(
                [{ type: 'text', data: '' }], // שקט/צפצוף
                'stt', // הפעלת מנוע זיהוי דיבור
                { val_name: 'user_voice_input' }
            );

            // הגנה למקרה שהמשתמש שותק או שאין קלט
            if (!userText) continue;

            let history = call.session.history || "";

            // שליחת המילים לג'מיני
            const result = await model.generateContent(`
                היסטוריה: ${history}
                לקוח: ${userText}
                :ענה בעברית בצורה טבעית וקצרה
            `);

            const aiResponse = result.response.text().trim();

            // שמירת היסטוריית השיחה
            call.session.history = history + `\nלקוח: ${userText}\nאתה: ${aiResponse}`;

            // הקראת התשובה של ג'מיני - והלולאה תחזור אוטומטית להתחלה להקשיב לך שוב!
            await call.read([{ type: 'text', data: aiResponse }]);
        }

    } catch (e) {
        console.error("שגיאה במערכת:", e);
        // במקרה של שגיאה משמיעים הודעה והלולאה תנסה להקשיב שוב
        try {
            await call.read([{ type: 'text', data: 'סליחה, חלה שגיאה. נסה לדבר שוב.' }]);
        } catch (err) {
            console.error(err);
        }
    }
});

app.use('/', router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port', PORT));
