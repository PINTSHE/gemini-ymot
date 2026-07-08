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

// הקשבה לכל סוגי הפניות (גם GET וגם POST)
router.all('/', async (call) => {
    try {
        // בבקשות GET הפרמטרים מגיעים לפעמים בצורה שונה, נבדוק את כל האופציות
        const userText = call.get('val_name') || call.query?.val_name;

        // אם המשתמש רק נכנס ואין עדיין קלט, ג'מיני פותח את השיחה מיד
        if (!userText) {
            return call.read([{ type: 'text', text: 'היי, מה נשמע?' }]);
        }

        let history = call.session.history || "";

        // פנייה לג'מיני
        const result = await model.generateContent(`
            היסטוריה: ${history}
            לקוח: ${userText}
            :ענה בעברית בצורה טבעית וקצרה
        `);

        const aiResponse = result.response.text().trim();

        // שמירת היסטוריית השיחה בסשן
        call.session.history = history + `\nלקוח: ${userText}\nאתה: ${aiResponse}`;

        // הקראת התשובה של ג'מיני למשתמש בטלפון
        return call.read([{ type: 'text', text: aiResponse }]);

    } catch (e) {
        console.error("שגיאה בזמן הטיפול בשיחה:", e);
        return call.read([{ type: 'text', text: 'אופס, משהו השתבש. נסה שוב.' }]);
    }
});

app.use('/', router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port', PORT));
