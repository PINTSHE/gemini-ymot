require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: "אתה עוזר חביב ומקצועי שמדבר עברית טבעית."
});

// זיכרון זמני פשוט להיסטוריה (לפי מספר טלפון)
const sessions = {};

app.all('/', async (req, res) => {
    try {
        // ימות המשיח שולחת את הפרמטרים ב-query (GET) או ב-body (POST)
        const params = { ...req.query, ...req.body };
        const userText = params.val_name;
        const phone = params.ApiPhone || 'default';

        // אם זו כניסה ראשונית ואין עדיין טקסט מתומלל
        if (!userText) {
            // נשמיע הודעה ונפתח מיקרופון להקלטה ותמלול
            res.send("read=t-היי, מה נשמע? אנא דבר לאחר הצליל.=safe,stt,stt");
            return;
        }

        // ניהול היסטוריה בסיסי
        if (!sessions[phone]) sessions[phone] = "";
        let history = sessions[phone];

        // פנייה לג'מיני
        const result = await model.generateContent(`
            היסטוריה: ${history}
            לקוח: ${userText}
            ענה בעברית בצורה טבעית וקצרה:
        `);

        const aiResponse = result.response.text().trim();

        // עדכון היסטוריה
        sessions[phone] = history + `\nלקוח: ${userText}\nאתה: ${aiResponse}`;

        // מחזירים פקודה להקריא את התשובה ולפתוח שוב מיקרופון לקלט הבא
        res.send(`read=t-${aiResponse}.=safe,stt,stt`);

    } catch (e) {
        console.error("Error:", e);
        res.send("read=t-אופס, חלה שגיאה במערכת.=safe,stt,stt");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Pure Express Server running on port', PORT));
